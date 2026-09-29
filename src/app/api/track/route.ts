import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getBolge(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const temiz = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (temiz === '::1' || temiz.startsWith('127.') || temiz.startsWith('192.168.') || temiz.startsWith('10.')) return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${temiz}?fields=status,city,regionName,country`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const geo = await res.json();
    if (geo.status !== 'success') return null;
    const sehir = geo.city || geo.regionName || null;
    const ulke = geo.country || null;
    if (sehir && ulke) return `${sehir}, ${ulke}`;
    return sehir || ulke || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sayfa, firma_id, referrer, cihaz } = await request.json();
    if (!sayfa) return NextResponse.json({ ok: false });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || null;
    const bolge = await getBolge(ip);

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
