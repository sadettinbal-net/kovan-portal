import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { ADMIN_EMAILS } from '@/lib/admin';
const TR_OFFSET = 3 * 60 * 60 * 1000; // UTC+3

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Türkiye saatiyle gece yarısı, hafta başı, ay başı, yıl başı hesapla
function takvimAraliklari() {
  const now = new Date();
  const trNow = new Date(now.getTime() + TR_OFFSET);

  // Bugün 00:00 TR saati → UTC
  const bugunTR = new Date(trNow);
  bugunTR.setUTCHours(0, 0, 0, 0);
  const bugunUTC = new Date(bugunTR.getTime() - TR_OFFSET).toISOString();

  // Bu haftanın Pazartesi 00:00 TR saati → UTC
  const gun = trNow.getUTCDay(); // 0=Pazar
  const pazartesiOffset = gun === 0 ? 6 : gun - 1;
  const pazartesiTR = new Date(bugunTR);
  pazartesiTR.setUTCDate(bugunTR.getUTCDate() - pazartesiOffset);
  const pazartesiUTC = new Date(pazartesiTR.getTime() - TR_OFFSET).toISOString();

  // Bu ayın 1. günü 00:00 TR saati → UTC
  const ayBasiTR = new Date(bugunTR);
  ayBasiTR.setUTCDate(1);
  const ayBasiUTC = new Date(ayBasiTR.getTime() - TR_OFFSET).toISOString();

  // Bu yılın 1 Ocak 00:00 TR saati → UTC
  const yilBasiTR = new Date(bugunTR);
  yilBasiTR.setUTCMonth(0, 1);
  const yilBasiUTC = new Date(yilBasiTR.getTime() - TR_OFFSET).toISOString();

  return { bugunUTC, pazartesiUTC, ayBasiUTC, yilBasiUTC };
}

function formatSaat(iso: string) {
  const d = new Date(new Date(iso).getTime() + TR_OFFSET);
  const s = d.getUTCHours().toString().padStart(2, '0');
  const dk = d.getUTCMinutes().toString().padStart(2, '0');
  return `${s}:${dk}`;
}

function formatGunSaat(iso: string) {
  const gunlar = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const d = new Date(new Date(iso).getTime() + TR_OFFSET);
  const gun = gunlar[d.getUTCDay()];
  const s = d.getUTCHours().toString().padStart(2, '0');
  const dk = d.getUTCMinutes().toString().padStart(2, '0');
  return `${gun} ${s}:${dk}`;
}

function formatTarihSaat(iso: string) {
  const d = new Date(new Date(iso).getTime() + TR_OFFSET);
  const gun = d.getUTCDate().toString().padStart(2, '0');
  const ay = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const s = d.getUTCHours().toString().padStart(2, '0');
  const dk = d.getUTCMinutes().toString().padStart(2, '0');
  return `${gun}.${ay} ${s}:${dk}`;
}

export async function GET() {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  const supabase = getAdmin();
  const { bugunUTC, pazartesiUTC, ayBasiUTC, yilBasiUTC } = takvimAraliklari();
  const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [rGunluk, rHaftalik, rAylik, rYillik,
         rGunlukDetay, rHaftalikDetay, rAylikDetay,
         rFirma, rKaynak, rCihaz, rSayfa] = await Promise.all([
    // Sayılar
    supabase.from('ziyaretler').select('id', { count: 'exact', head: true })
      .eq('sayfa', '__giris__').gte('created_at', bugunUTC),
    supabase.from('ziyaretler').select('id', { count: 'exact', head: true })
      .eq('sayfa', '__giris__').gte('created_at', pazartesiUTC),
    supabase.from('ziyaretler').select('id', { count: 'exact', head: true })
      .eq('sayfa', '__giris__').gte('created_at', ayBasiUTC),
    supabase.from('ziyaretler').select('id', { count: 'exact', head: true })
      .eq('sayfa', '__giris__').gte('created_at', yilBasiUTC),
    // Detay zaman damgaları
    supabase.from('ziyaretler').select('id, created_at, bolge, ip')
      .eq('sayfa', '__giris__').gte('created_at', bugunUTC)
      .order('created_at', { ascending: false }).limit(500),
    supabase.from('ziyaretler').select('created_at')
      .eq('sayfa', '__giris__').gte('created_at', pazartesiUTC)
      .order('created_at', { ascending: false }).limit(500),
    supabase.from('ziyaretler').select('created_at')
      .eq('sayfa', '__giris__').gte('created_at', ayBasiUTC)
      .order('created_at', { ascending: false }).limit(500),
    // Diğer istatistikler
    supabase.from('ziyaretler').select('firma_id')
      .not('firma_id', 'is', null).gte('created_at', d30).limit(5000),
    supabase.from('ziyaretler').select('referrer')
      .eq('sayfa', '__giris__').gte('created_at', d30).limit(5000),
    supabase.from('ziyaretler').select('cihaz')
      .eq('sayfa', '__giris__').not('cihaz', 'is', null).gte('created_at', d30).limit(5000),
    supabase.from('ziyaretler').select('sayfa')
      .neq('sayfa', '__giris__').gte('created_at', d30).limit(5000),
  ]);

  // Günlük ziyaretçilerin baktığı firmaları IP bazlı çek
  const gunlukIpler = Array.from(new Set(
    (rGunlukDetay.data || []).map(r => r.ip as string | null).filter(Boolean)
  )) as string[];

  const ipFirmaMap: Record<string, { firma_ad: string; saat: string }[]> = {};

  if (gunlukIpler.length > 0) {
    const { data: firmaZiyaretleri } = await supabase
      .from('ziyaretler')
      .select('ip, firma_id, created_at')
      .in('ip', gunlukIpler)
      .not('firma_id', 'is', null)
      .gte('created_at', bugunUTC)
      .order('created_at', { ascending: true })
      .limit(2000);

    const firmaIdler = Array.from(new Set((firmaZiyaretleri || []).map(z => z.firma_id as number)));
    const { data: firmaListesi } = firmaIdler.length > 0
      ? await supabase.from('firmalar').select('id, ad').in('id', firmaIdler)
      : { data: [] };
    const firmaAdMap: Record<number, string> = {};
    for (const f of firmaListesi || []) firmaAdMap[f.id] = f.ad;

    for (const z of firmaZiyaretleri || []) {
      const zIp = z.ip as string | null;
      if (!zIp) continue;
      if (!ipFirmaMap[zIp]) ipFirmaMap[zIp] = [];
      const d = new Date(new Date(z.created_at).getTime() + TR_OFFSET);
      const saat = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
      ipFirmaMap[zIp].push({ firma_ad: firmaAdMap[z.firma_id as number] || 'Silinmiş Firma', saat });
    }
  }

  // Detay formatla
  const gunlukDetay = (rGunlukDetay.data || []).map(r => ({
    saat: formatSaat(r.created_at),
    id: r.id as number,
    bolge: (r.bolge as string | null) || null,
    ip: (r.ip as string | null) || null,
    firmalar: r.ip ? (ipFirmaMap[r.ip as string] || []) : [],
  }));
  const haftalikDetay = (rHaftalikDetay.data || []).map(r => formatGunSaat(r.created_at));
  const aylikDetay = (rAylikDetay.data || []).map(r => formatTarihSaat(r.created_at));

  // Top firmalar
  const firmaMap: Record<number, number> = {};
  for (const row of rFirma.data || []) {
    if (row.firma_id) firmaMap[row.firma_id] = (firmaMap[row.firma_id] || 0) + 1;
  }
  const topIds = Object.entries(firmaMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => parseInt(id));
  const { data: firmalarData } = topIds.length > 0
    ? await supabase.from('firmalar').select('id, ad').in('id', topIds)
    : { data: [] };
  const firmaAd: Record<number, string> = {};
  for (const f of firmalarData || []) firmaAd[f.id] = f.ad;
  const topFirmalar = topIds.map(id => ({ firma_id: id, ad: firmaAd[id] || 'Silinmiş Firma', sayi: firmaMap[id] }));

  // Kaynaklar
  const kaynakMap: Record<string, number> = {};
  for (const row of rKaynak.data || []) {
    let kaynak = 'Direkt';
    if (row.referrer) {
      try {
        const domain = new URL(row.referrer).hostname.replace('www.', '');
        if (domain.includes('google'))    kaynak = 'Google';
        else if (domain.includes('yandex'))    kaynak = 'Yandex';
        else if (domain.includes('instagram')) kaynak = 'Instagram';
        else if (domain.includes('facebook'))  kaynak = 'Facebook';
        else if (domain.includes('twitter') || domain.includes('x.com')) kaynak = 'Twitter/X';
        else if (domain.includes('youtube'))   kaynak = 'YouTube';
        else if (domain.includes('whatsapp'))  kaynak = 'WhatsApp';
        else kaynak = domain;
      } catch { kaynak = 'Direkt'; }
    }
    kaynakMap[kaynak] = (kaynakMap[kaynak] || 0) + 1;
  }
  const kaynaklar = Object.entries(kaynakMap)
    .map(([kaynak, sayi]) => ({ kaynak, sayi }))
    .sort((a, b) => b.sayi - a.sayi).slice(0, 8);

  // Cihaz türleri
  const cihazSirasi = ['Mobil', 'Tablet', 'Laptop', 'Masaüstü'];
  const cihazMap: Record<string, number> = {};
  for (const row of rCihaz.data || []) {
    if (row.cihaz) cihazMap[row.cihaz] = (cihazMap[row.cihaz] || 0) + 1;
  }
  const cihazlar = cihazSirasi.filter(c => cihazMap[c]).map(c => ({ cihaz: c, sayi: cihazMap[c] }));

  // En çok gezilen sayfalar
  const sayfaEtiket: Record<string, string> = {
    '/': 'Ana Sayfa', '/firmalar': 'Firmalar', '/iletisim': 'İletişim',
    '/hakkimizda': 'Hakkımızda', '/gizlilik-politikasi': 'Gizlilik Politikası',
  };
  const sayfaMap: Record<string, number> = {};
  for (const row of rSayfa.data || []) {
    if (!row.sayfa) continue;
    let etiket = sayfaEtiket[row.sayfa] || row.sayfa;
    if (row.sayfa.startsWith('/firma/')) etiket = 'Firma Detay';
    sayfaMap[etiket] = (sayfaMap[etiket] || 0) + 1;
  }
  const topSayfalar = Object.entries(sayfaMap)
    .map(([sayfa, sayi]) => ({ sayfa, sayi }))
    .sort((a, b) => b.sayi - a.sayi).slice(0, 10);

  return NextResponse.json({
    gunluk:        rGunluk.count  || 0,
    haftalik:      rHaftalik.count || 0,
    aylik:         rAylik.count   || 0,
    yillik:        rYillik.count  || 0,
    gunlukDetay,
    haftalikDetay,
    aylikDetay,
    topFirmalar,
    kaynaklar,
    cihazlar,
    topSayfalar,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
