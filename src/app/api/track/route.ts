import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Yaklaşık konum (şehir, ülke): barındırma sağlayıcısının (Vercel) isteğe eklediği coğrafi başlıklardan okunur.
// IP adresi üçüncü bir konum servisine gönderilmez. Yerelde (localhost) bu başlıklar olmadığı için bölge boş kalır.
function getBolge(request: NextRequest): string | null {
  const coz = (v: string | null) => {
    if (!v) return null;
    try { return decodeURIComponent(v); } catch { return v; }
  };
  const sehir = coz(request.headers.get('x-vercel-ip-city'));
  const ulkeKodu = request.headers.get('x-vercel-ip-country');
  let ulke: string | null = null;
  if (ulkeKodu) {
    try { ulke = new Intl.DisplayNames(['tr'], { type: 'region' }).of(ulkeKodu) || ulkeKodu; } catch { ulke = ulkeKodu; }
  }
  if (sehir && ulke) return `${sehir}, ${ulke}`;
  return sehir || ulke || null;
}

export async function POST(request: NextRequest) {
  try {
    const { sayfa, firma_id, referrer, cihaz } = await request.json();
    if (!sayfa) return NextResponse.json({ ok: false });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || null;
    const bolge = getBolge(request);

    const geçerliCihaz = ['Mobil', 'Tablet', 'Laptop', 'Masaüstü'];
    const supabase = getAdmin();
    await supabase.from('ziyaretler').insert({
      sayfa: String(sayfa).slice(0, 500),
      firma_id: firma_id ? Number(firma_id) : null,
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      cihaz: cihaz && geçerliCihaz.includes(cihaz) ? cihaz : null,
      bolge: bolge ? bolge.slice(0, 100) : null,
      ip: ip ? ip.slice(0, 45) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
