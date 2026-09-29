import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getCanonicalOrigin(requestOrigin: string): string {
  if (requestOrigin.includes('localhost')) return requestOrigin;
  return process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
}

function getCookieDomain(requestOrigin: string): string | undefined {
  if (requestOrigin.includes('localhost')) return undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin;
  const hostname = new URL(siteUrl).hostname;
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const errorParam = requestUrl.searchParams.get('error');
  const origin = getCanonicalOrigin(requestUrl.origin);
  const cookieDomain = getCookieDomain(requestUrl.origin);

  if (errorParam) {
    const msg = encodeURIComponent(requestUrl.searchParams.get('error_description') || errorParam);
    return NextResponse.redirect(new URL(`/giris?error=auth_failed&msg=${msg}`, origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/giris?error=no_code', origin));
  }

  const storedState = request.cookies.get('oauth_state')?.value;
  const codeVerifier = request.cookies.get('oauth_code_verifier')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/giris?error=invalid_state', origin));
  }

  // Google'dan token al
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: 'authorization_code',
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.id_token) {
    const msg = encodeURIComponent(tokens.error_description || tokens.error || 'no_id_token');
    return NextResponse.redirect(new URL(`/giris?error=token_failed&msg=${msg}`, origin));
  }

  const response = NextResponse.redirect(new URL('/', origin));

  const clearCookieBase = {
    maxAge: 0,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
  response.cookies.set('oauth_state', '', clearCookieBase);
  response.cookies.set('oauth_code_verifier', '', clearCookieBase);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              // httpOnly değil: tarayıcıdaki Supabase istemcisi oturumu okuyup veritabanı kurallarından geçebilsin
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              ...(cookieDomain ? { domain: cookieDomain } : {}),
            })
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: tokens.id_token,
    access_token: tokens.access_token,
  });

  if (error || !data.session) {
    const detail = error ? error.message : 'session null';
    return NextResponse.redirect(
      new URL(`/giris?error=session_failed&msg=${encodeURIComponent(detail)}`, origin)
    );
  }

  // Kullanıcıyı DB'ye kaydet (ilk girişte)
  const supabaseAdmin = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const verified = data.session.user;
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('google_id', verified.id)
    .single();

  const avatarUrl = verified.user_metadata?.avatar_url || verified.user_metadata?.picture || null;

  if (!existing) {
    await supabaseAdmin.from('users').insert({
      google_id: verified.id,
      email: verified.email,
      name: verified.user_metadata?.full_name || verified.user_metadata?.name || 'Kullanıcı',
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
    });
  } else {
    await supabaseAdmin.from('users').update({ avatar_url: avatarUrl }).eq('google_id', verified.id);
  }

  return response;
}
