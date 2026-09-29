import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function ozelIP(ip: string): boolean {
  return ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.');
}

async function ipdenBolge(ip: string): Promise<string | null> {
  const temiz = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
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

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const admin = getAdmin();

  // bolge null olan ama ip'si olan kayıtları çek
  const { data: kayitlar, error } = await admin
    .from('ziyaretler')
    .select('id, ip')
    .is('bolge', null)
    .not('ip', 'is', null)
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!kayitlar || kayitlar.length === 0) return NextResponse.json({ guncellenen: 0, mesaj: 'Güncellenecek kayıt yok.' });

  // Aynı IP'yi tekrar tekrar sorgulamaktan kaçın
  const ipCache: Record<string, string | null> = {};
  let guncellenen = 0;

  for (const kayit of kayitlar) {
    const ip: string = kayit.ip;
    if (ozelIP(ip)) continue;

    if (!(ip in ipCache)) {
      ipCache[ip] = await ipdenBolge(ip);
      // Rate limit aşmamak için kısa bekleme
      await new Promise(r => setTimeout(r, 300));
    }

    const bolge = ipCache[ip];
    if (!bolge) continue;

    await admin.from('ziyaretler').update({ bolge }).eq('id', kayit.id);
    guncellenen++;
  }

  return NextResponse.json({ guncellenen, toplam: kayitlar.length });
}
