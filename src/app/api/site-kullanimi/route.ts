import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = adminClient();
  const { data } = await supabase
    .from('site_icerikleri')
    .select('icerik')
    .eq('anahtar', 'site_kullanimi')
    .single();
  return NextResponse.json({ icerik: data?.icerik || '' });
}
