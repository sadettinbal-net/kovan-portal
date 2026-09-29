import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { access_token, refresh_token, user } = await request.json();

  if (!access_token || !user) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify the token is genuine before trusting the user object.
  const { data: { user: verified }, error: verifyErr } = await supabaseAdmin.auth.getUser(access_token);
  if (verifyErr || !verified) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Create user record if first login.
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('google_id', verified.id)
    .single();

  if (!existing) {
    await supabaseAdmin.from('users').insert({
      google_id: verified.id,
      email: verified.email,
      name: verified.user_metadata?.full_name || verified.user_metadata?.name || 'Kullanıcı',
      avatar_url: verified.user_metadata?.avatar_url || verified.user_metadata?.picture || null,
      created_at: new Date().toISOString(),
    });
  }

  const response = NextResponse.json({ success: true });

  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('sb-access-token', access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  response.cookies.set('sb-refresh-token', refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });

  return response;
}
