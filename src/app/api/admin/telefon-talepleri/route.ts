import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { yoneticiMi } from '@/lib/admin';
import { servisIstemcisi } from '@/lib/firmaSilme';

// Yönetici: telefon talepleri listesi ve onay/red.
// Cep numaralarında kişi ekrandaki kodu WhatsApp'tan sitenin hattına gönderir; yönetici kodu ve gönderen numarayı karşılaştırır.
// GET   ?durum=onay_bekliyor|dogrulama_bekliyor|onaylandi|reddedildi|iptal|tumu
// PATCH { id, islem: 'onayla' | 'reddet', red_nedeni? }

const DURUMLAR = ['onay_bekliyor', 'dogrulama_bekliyor', 'onaylandi', 'reddedildi', 'iptal'];

async function yonetici() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email && yoneticiMi(user.email) ? user.email.toLowerCase() : null;
}

export async function GET(request: NextRequest) {
  if (!(await yonetici())) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const durum = request.nextUrl.searchParams.get('durum') || 'onay_bekliyor';

  let sorgu = servisIstemcisi()
    .from('telefon_talepleri')
    .select('id, firma_id, kullanici_email, ad_soyad, telefon, tur, durum, dogrulama_kodu, dogrulandi_at, kvkk_onay_at, kvkk_surum, karar_at, karar_veren, red_nedeni, created_at, firmalar(id, ad, sektor, adres, telefon, mobil_telefon, eposta, kullanici_email)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (durum !== 'tumu') {
    if (!DURUMLAR.includes(durum)) return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 });
    sorgu = sorgu.eq('durum', durum);
  }
  const { data, error } = await sorgu;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ talepler: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const yon = await yonetici();
  if (!yon) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  const { id, islem, red_nedeni } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id) || (islem !== 'onayla' && islem !== 'reddet')) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const db = servisIstemcisi();
  const { data: t } = await db.from('telefon_talepleri').select('*').eq('id', id).maybeSingle();
  if (!t) return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  if (t.durum !== 'onay_bekliyor') return NextResponse.json({ error: 'Bu talep onay beklemiyor.' }, { status: 409 });
  const karar = { karar_at: new Date().toISOString(), karar_veren: yon };

  if (islem === 'reddet') {
    const neden = typeof red_nedeni === 'string' ? red_nedeni.trim().slice(0, 300) || null : null;
    await db.from('telefon_talepleri').update({ durum: 'reddedildi', red_nedeni: neden, ...karar }).eq('id', id);
    return NextResponse.json({ success: true });
  }

  const { data: firma } = await db
    .from('firmalar')
    .select('id, telefon, mobil_telefon, eposta, kullanici_email')
    .eq('id', t.firma_id)
    .maybeSingle();
  if (!firma) return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });

  // Numara türüne göre alan; e-posta ve sahiplik sadece boşsa doldurulur
  const alan = t.tur === 'cep' ? 'mobil_telefon' : 'telefon';
  const yeni: Record<string, string> = { [alan]: t.telefon };
  if (!firma.eposta) yeni.eposta = t.kullanici_email;
  if (!firma.kullanici_email) yeni.kullanici_email = t.kullanici_email;
  const onceki = Object.fromEntries(Object.keys(yeni).map((k) => [k, (firma as Record<string, unknown>)[k] ?? null]));

  const { error: fHata } = await db.from('firmalar').update(yeni).eq('id', t.firma_id);
  if (fHata) return NextResponse.json({ error: fHata.message }, { status: 500 });
  await db.from('telefon_talepleri').update({
    durum: 'onaylandi', onceki_degerler: onceki, ...karar,
    ...(t.tur === 'cep' && !t.dogrulandi_at ? { dogrulandi_at: karar.karar_at } : {}),
  }).eq('id', id);

  revalidatePath('/');
  revalidatePath(`/firma/${t.firma_id}`);
  return NextResponse.json({ success: true, guncellenen: yeni });
}
