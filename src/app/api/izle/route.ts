import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Ziyaretçi izleme kaydı (components/ZiyaretciIzleme.tsx gönderir). Yönetim Paneli → Ziyaretçiler'de görünür.
export const dynamic = 'force-dynamic';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const TIPLER = ['sayfa', 'tiklama', 'reklam_tik', 'reklam_izle'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|python-requests|curl|wget/i;

function coz(v: string | null) {
  if (!v) return null;
  try { return decodeURIComponent(v); } catch { return v; }
}

// Konum: barındırma sağlayıcısının (Vercel) isteğe eklediği coğrafi başlıklar. IP üçüncü bir servise gönderilmez.
// IP'den en fazla şehir/bölge çıkar; mahalle bilgisi IP'den elde edilemez. Yerelde (localhost) bu başlıklar yoktur.
function konum(req: NextRequest) {
  const kod = req.headers.get('x-vercel-ip-country');
  let ulke: string | null = null;
  if (kod) {
    try { ulke = new Intl.DisplayNames(['tr'], { type: 'region' }).of(kod) || kod; } catch { ulke = kod; }
  }
  return {
    ulke,
    bolge: coz(req.headers.get('x-vercel-ip-country-region')),
    sehir: coz(req.headers.get('x-vercel-ip-city')),
  };
}

// Tarayıcı kimliğinden (User-Agent) işletim sistemi, tarayıcı ve cihaz tipi
function cihazBilgisi(ua: string, genislik: number | null) {
  const isletim_sistemi =
    /Windows NT/i.test(ua) ? 'Windows'
    : /Android/i.test(ua) ? 'Android'
    : /iPhone|iPod/i.test(ua) ? 'iOS (iPhone)'
    : /iPad/i.test(ua) ? 'iPadOS'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
    : /CrOS/i.test(ua) ? 'ChromeOS'
    : /Linux/i.test(ua) ? 'Linux'
    : null;
  const tarayici =
    /Edg\//i.test(ua) ? 'Edge'
    : /OPR\/|Opera/i.test(ua) ? 'Opera'
    : /YaBrowser/i.test(ua) ? 'Yandex'
    : /SamsungBrowser/i.test(ua) ? 'Samsung Internet'
    : /Firefox|FxiOS/i.test(ua) ? 'Firefox'
    : /Chrome|CriOS/i.test(ua) ? 'Chrome'
    : /Safari/i.test(ua) ? 'Safari'
    : null;
  const cihaz =
    /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? 'Tablet'
    : /Mobi|iPhone|Android/i.test(ua) ? 'Mobil'
    : genislik !== null && genislik < 1440 ? 'Laptop'
    : 'Masaüstü';
  return { isletim_sistemi, tarayici, cihaz };
}

export async function POST(request: NextRequest) {
  try {
    const ua = request.headers.get('user-agent') || '';
    if (BOT.test(ua)) return NextResponse.json({ ok: true });

    const govde = await request.json();
    const oturum = String(govde?.oturum || '');
    if (!UUID.test(oturum)) return NextResponse.json({ ok: false }, { status: 400 });

    const olaylar = Array.isArray(govde.olaylar)
      ? govde.olaylar.slice(0, 80).map((o: Record<string, unknown>) => ({
          tip: TIPLER.includes(String(o.tip)) ? String(o.tip) : 'sayfa',
          sayfa: o.sayfa ? String(o.sayfa).slice(0, 500) : null,
          hedef: o.hedef ? String(o.hedef).slice(0, 150) : null,
          baglanti: o.baglanti ? String(o.baglanti).slice(0, 500) : null,
          // reklam_tik / reklam_izle: hangi reklam ve (izlemede) kaç milisaniye ekranda kaldığı
          reklam_id: Number.isInteger(o.reklam_id) && (o.reklam_id as number) > 0 ? o.reklam_id : null,
          sure_ms: Number.isFinite(o.sure_ms) ? Math.min(Math.max(Math.round(o.sure_ms as number), 0), 3600000) : null,
        }))
      : [];

    // Oturum bilgileri yalnızca ilk gönderimde gelir; sonrakilerde boş (veritabanı var olan oturumu değiştirmez)
    let bilgi: Record<string, unknown> = {};
    if (govde.bilgi && typeof govde.bilgi === 'object') {
      const b = govde.bilgi as Record<string, unknown>;
      const genislik = typeof b.genislik === 'number' ? b.genislik : null;
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || null;
      bilgi = {
        ip,
        ...konum(request),
        ...cihazBilgisi(ua, genislik),
        ekran: b.ekran ? String(b.ekran).slice(0, 20) : null,
        dil: b.dil ? String(b.dil).slice(0, 20) : null,
        referrer: b.referrer ? String(b.referrer).slice(0, 500) : null,
      };
    }

    const { error } = await getAdmin().rpc('ziyaretci_kaydet', { p_oturum: oturum, p_bilgi: bilgi, p_olaylar: olaylar });
    return NextResponse.json({ ok: !error });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
