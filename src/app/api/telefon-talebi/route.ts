import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { servisIstemcisi } from '@/lib/firmaSilme';
import {
  GORUNUM_ALANLARI, KVKK_SURUM, SINIR, istemciIp, numaraVeTur, onayEpostasiGonder, ozet,
  siteKoku, telefonGoster, testModu, yeniKod, yeniToken,
} from '@/lib/telefonTalebi';

// Telefonu olmayan firmaya numara ekleme talebi.
// GET  ?firma_id=  → giriş yapan kişinin bu firma için son talebi
// POST { firma_id, telefon, ad_soyad?, kvkk: true } → yeni talep
//   cep  : doğrudan yönetici listesine düşer; kişi ekrandaki kodu WhatsApp'tan sitenin hattına gönderir
//   sabit: e-postadaki bağlantıya tıklanınca yönetici listesine düşer

async function girisYapan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return {
    email: user.email.toLowerCase(),
    ad: (user.user_metadata?.full_name || user.user_metadata?.name || '') as string,
  };
}

export async function GET(request: NextRequest) {
  const kisi = await girisYapan();
  if (!kisi) return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 });
  const firmaId = Number(request.nextUrl.searchParams.get('firma_id'));
  if (!Number.isInteger(firmaId) || firmaId <= 0) return NextResponse.json({ error: 'Geçersiz firma.' }, { status: 400 });

  const { data, error } = await servisIstemcisi()
    .from('telefon_talepleri')
    .select(GORUNUM_ALANLARI)
    .eq('firma_id', firmaId)
    .eq('kullanici_email', kisi.email)
    .neq('durum', 'iptal')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ talep: data, email: kisi.email, ad: kisi.ad });
}

export async function POST(request: NextRequest) {
  const kisi = await girisYapan();
  if (!kisi) return NextResponse.json({ error: 'Önce Google ile bağlanmalısınız.' }, { status: 401 });

  const govde = await request.json().catch(() => ({}));
  const firmaId = Number(govde.firma_id);
  if (!Number.isInteger(firmaId) || firmaId <= 0) return NextResponse.json({ error: 'Geçersiz firma.' }, { status: 400 });
  if (govde.kvkk !== true) return NextResponse.json({ error: 'KVKK bilgilendirmesini kabul etmelisiniz.' }, { status: 400 });
  const numara = numaraVeTur(govde.telefon);
  if (!numara) return NextResponse.json({ error: 'Telefon numarası geçerli değil. Örnek: 0532 123 45 67 veya 0216 123 45 67' }, { status: 400 });
  const adSoyad = typeof govde.ad_soyad === 'string' ? govde.ad_soyad.trim().slice(0, 100) || null : null;

  const db = servisIstemcisi();
  const { data: firma } = await db
    .from('firmalar')
    .select('id, ad, telefon, mobil_telefon, onay_durumu')
    .eq('id', firmaId)
    .maybeSingle();
  if (!firma || firma.onay_durumu !== 'onaylandi') return NextResponse.json({ error: 'Firma bulunamadı.' }, { status: 404 });
  if (firma.telefon || firma.mobil_telefon) {
    return NextResponse.json({ error: 'Bu firmanın telefonu zaten kayıtlı. Değişiklik için bizimle iletişime geçin.' }, { status: 409 });
  }

  // Bu kişinin bu firma için açık talebi
  const { data: acik } = await db
    .from('telefon_talepleri')
    .select('id, durum, dogrulandi_at')
    .eq('firma_id', firmaId)
    .eq('kullanici_email', kisi.email)
    .in('durum', ['dogrulama_bekliyor', 'onay_bekliyor']);
  // E-postayla doğrulanmış talep değiştirilemez; WhatsApp kodu bekleyen cep talebi ise yeni numarayla değiştirilebilir
  if (acik?.some((t) => t.durum === 'onay_bekliyor' && t.dogrulandi_at)) {
    return NextResponse.json({ error: 'Bu firma için talebiniz zaten yönetici onayında.' }, { status: 409 });
  }

  const gunOnce = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [epostaSay, telSay] = await Promise.all([
    db.from('telefon_talepleri').select('id', { count: 'exact', head: true }).eq('kullanici_email', kisi.email).gte('created_at', gunOnce),
    db.from('telefon_talepleri').select('id', { count: 'exact', head: true }).eq('telefon', numara.telefon).gte('created_at', gunOnce),
  ]);
  if ((epostaSay.count ?? 0) >= SINIR.epostaGunluk || (telSay.count ?? 0) >= SINIR.telefonGunluk) {
    return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen 24 saat sonra tekrar deneyin.' }, { status: 429 });
  }

  // Yarım kalmış eski talebi kapat (yeni numara/yeni kod ile baştan başlar)
  const eskiler = (acik || []).map((t) => t.id);
  if (eskiler.length) await db.from('telefon_talepleri').update({ durum: 'iptal' }).in('id', eskiler);

  const kod = numara.tur === 'cep' ? yeniKod() : null;
  const token = numara.tur === 'sabit' ? yeniToken() : null;
  const simdi = new Date();

  const { data: talep, error } = await db
    .from('telefon_talepleri')
    .insert({
      firma_id: firmaId,
      kullanici_email: kisi.email,
      ad_soyad: adSoyad || kisi.ad || null,
      telefon: numara.telefon,
      tur: numara.tur,
      durum: kod ? 'onay_bekliyor' : 'dogrulama_bekliyor',
      dogrulama_kodu: kod,
      eposta_token_ozet: token ? ozet(token) : null,
      kvkk_onay_at: simdi.toISOString(),
      kvkk_surum: KVKK_SURUM,
      ip: istemciIp(request.headers),
    })
    .select(GORUNUM_ALANLARI)
    .single();
  if (error || !talep) return NextResponse.json({ error: error?.message || 'Kayıt açılamadı.' }, { status: 500 });

  const yanit: Record<string, unknown> = { talep };
  // Cep: kod ekranda gösterilir, kişi WhatsApp'tan gönderir. Sabit: e-posta gider.
  if (token) {
    const e = await onayEpostasiGonder(siteKoku(request.url), kisi.email, firma.ad, numara.telefon, token);
    if (testModu()) yanit.test_baglanti = e.baglanti;
  }
  yanit.mesaj = kod
    ? `${telefonGoster(numara.telefon)} numarası kaydedildi. Doğrulama için kodu WhatsApp'tan gönderin.`
    : `${kisi.email} adresine onay bağlantısı gönderildi.`;
  return NextResponse.json(yanit);
}
