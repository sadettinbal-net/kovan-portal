import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { servisIstemcisi } from '@/lib/firmaSilme';
import { resimleriKontrolEt, resimYukle } from '@/lib/resimKontrol';
import { ayniEposta } from '@/lib/yorumlar';

const BUCKET = 'firma-fotograflari';
const MAX_DETAY = 5;

function urlToPath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

// Firma sahibi fotoğraf değişikliği. Sıra: yeni dosyaları kontrol et → yükle → firmaya bağla → en son eskileri sil.
// Böylece bir adım başarısız olursa firma resimsiz kalmaz. Sadece bu firmaya ait fotoğraflar silinebilir.
export async function PATCH(request: NextRequest) {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Giriş gerekli.' }, { status: 401 });

  const formData = await request.formData();
  const id = Number(formData.get('id'));
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const supabase = servisIstemcisi();
  const { data: firma } = await supabase
    .from('firmalar')
    .select('kullanici_email, fotograf_url, detay_fotograflar')
    .eq('id', id)
    .single();
  if (!firma || !ayniEposta(firma.kullanici_email, user.email)) {
    return NextResponse.json({ error: 'Bu firmayı düzenleme yetkiniz yok.' }, { status: 403 });
  }

  const mevcutDetaylar: string[] = Array.isArray(firma.detay_fotograflar) ? firma.detay_fotograflar : [];
  const silKart = formData.get('sil_kart') === 'true';
  // Sadece bu firmanın kendi detay fotoğrafları silinebilir (başka adres gönderilirse yok sayılır)
  const silDetaylar = (formData.getAll('sil_detaylar') as string[]).filter((u) => mevcutDetaylar.includes(u));
  const kalanDetaylar = mevcutDetaylar.filter((u) => !silDetaylar.includes(u));

  // 1) Yeni dosyaları kontrol et (biri bile uymazsa hiçbir şey değişmez)
  const kart = await resimleriKontrolEt([formData.get('yeni_kart') as File].filter(Boolean), 1);
  if ('hata' in kart) return NextResponse.json({ error: kart.hata }, { status: 400 });
  const detay = await resimleriKontrolEt(formData.getAll('yeni_detaylar') as File[], MAX_DETAY);
  if ('hata' in detay) return NextResponse.json({ error: detay.hata }, { status: 400 });
  if (kalanDetaylar.length + detay.resimler.length > MAX_DETAY) {
    return NextResponse.json({ error: `En fazla ${MAX_DETAY} detay fotoğrafı olabilir.` }, { status: 400 });
  }

  // 2) Yükle
  const ts = Date.now();
  const updates: Record<string, unknown> = {};
  const silinecekDosyalar: string[] = [];
  if (kart.resimler.length > 0) {
    const url = await resimYukle(supabase, BUCKET, `kart/${id}-${ts}`, kart.resimler[0]);
    if (!url) return NextResponse.json({ error: 'Kart resmi yüklenemedi.' }, { status: 500 });
    updates.fotograf_url = url;
    updates.ana_sayfa_resim = url; // Kategori resmi ana sayfa resmi olarak da kullanılır
    if (firma.fotograf_url) silinecekDosyalar.push(firma.fotograf_url);
  } else if (silKart && firma.fotograf_url) {
    updates.fotograf_url = null;
    silinecekDosyalar.push(firma.fotograf_url);
  }
  const yeniUrller: string[] = [];
  for (let i = 0; i < detay.resimler.length; i++) {
    const url = await resimYukle(supabase, BUCKET, `detay/${id}-${ts}-${i}`, detay.resimler[i]);
    if (url) yeniUrller.push(url);
  }
  if (silDetaylar.length > 0 || yeniUrller.length > 0) {
    updates.detay_fotograflar = [...kalanDetaylar, ...yeniUrller];
    silinecekDosyalar.push(...silDetaylar);
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ success: true });

  // 3) Firmaya bağla
  const { data: guncellenen, error } = await supabase.from('firmalar').update(updates).eq('id', id).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!guncellenen || guncellenen.length === 0) return NextResponse.json({ error: 'Firma güncellenemedi (0 kayıt).' }, { status: 500 });

  // 4) En son eski dosyaları sil
  const yollar = silinecekDosyalar.map(urlToPath).filter((y): y is string => !!y);
  if (yollar.length > 0) {
    const { error: depoHata } = await supabase.storage.from(BUCKET).remove(yollar);
    if (depoHata) console.error('Eski fotoğraflar silinemedi:', yollar, depoHata);
  }
  return NextResponse.json({ success: true });
}
