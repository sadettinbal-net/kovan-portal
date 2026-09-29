import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

import { ADMIN_EMAILS } from '@/lib/admin';
const TR_OFFSET = 3 * 60 * 60 * 1000;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const ip = request.nextUrl.searchParams.get('ip');
  if (!ip) return NextResponse.json([]);

  // Bugünün başlangıcı (Türkiye saati)
  const now = new Date();
  const trNow = new Date(now.getTime() + TR_OFFSET);
  const bugunTR = new Date(trNow);
  bugunTR.setUTCHours(0, 0, 0, 0);
  const bugunUTC = new Date(bugunTR.getTime() - TR_OFFSET).toISOString();

  const admin = getAdmin();

  const { data: ziyaretler } = await admin
    .from('ziyaretler')
    .select('firma_id, created_at')
    .eq('ip', ip)
    .not('firma_id', 'is', null)
    .gte('created_at', bugunUTC)
    .order('created_at', { ascending: true })
    .limit(50);

  if (!ziyaretler || ziyaretler.length === 0) return NextResponse.json([]);

  const firmaIds = Array.from(new Set(ziyaretler.map(z => z.firma_id as number)));
  const { data: firmalar } = await admin
    .from('firmalar')
    .select('id, ad')
    .in('id', firmaIds);

  const firmaAd: Record<number, string> = {};
  for (const f of firmalar || []) firmaAd[f.id] = f.ad;

  // Her firma görüntülenmesini saat ile birlikte döndür
  const sonuc = ziyaretler.map(z => {
    const d = new Date(new Date(z.created_at).getTime() + TR_OFFSET);
    const saat = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    return {
      firma_id: z.firma_id as number,
      firma_ad: firmaAd[z.firma_id as number] || 'Silinmiş Firma',
      saat,
    };
  });

  return NextResponse.json(sonuc);
}
