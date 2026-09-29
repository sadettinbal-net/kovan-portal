import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['sadettinbal@gmail.com', 'mustafabal93@gmail.com'];

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

export async function PUT(request: NextRequest) {
  const supabaseUser = await createServerClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email!)) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const { icerik } = await request.json();

  const supabase = adminClient();
  const { error } = await supabase
    .from('site_icerikleri')
    .upsert({ anahtar: 'site_kullanimi', icerik, guncelleme_tarihi: new Date().toISOString() }, { onConflict: 'anahtar' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
