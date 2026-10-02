import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';
import { ilanAlanlariKontrol } from '@/lib/ilanKurallari';

const DURUMLAR = ['beklemede', 'onaylandi', 'reddedildi'];

// Yönetici ilan düzenlemesi: sadece bu alanlar kabul edilir ve ilan verme kurallarıyla kontrol edilir.
export async function PATCH(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!yoneticiMi(user?.email)) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });

  const govde = await request.json().catch(() => ({}));
  const { id } = govde;
  if (!id) return NextResponse.json({ error: 'ID gerekli.' }, { status: 400 });

  const gelen: Record<string, unknown> = {};
  for (const k of ['baslik', 'aciklama', 'fiyat', 'kategori', 'telefon', 'ilan_veren_ad'] as const) if (k in govde) gelen[k] = govde[k];
  const kontrol = ilanAlanlariKontrol(gelen, false);
  if ('hata' in kontrol) return NextResponse.json({ error: kontrol.hata }, { status: 400 });
  const guncelleme: Record<string, unknown> = { ...kontrol.alanlar };
  if ('onay_durumu' in govde) {
    if (!DURUMLAR.includes(govde.onay_durumu)) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 });
    guncelleme.onay_durumu = govde.onay_durumu;
  }
  if (Object.keys(guncelleme).length === 0) return NextResponse.json({ error: 'Değiştirilecek alan yok.' }, { status: 400 });

  const { data, error } = await servisIstemcisi().from('ilanlar').update(guncelleme).eq('id', id)
    .select('id, baslik, aciklama, fiyat, kategori, telefon, ilan_veren_ad, onay_durumu');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'İlan bulunamadı (0 kayıt güncellendi).' }, { status: 404 });
  return NextResponse.json({ success: true, ilan: data[0] });
}
