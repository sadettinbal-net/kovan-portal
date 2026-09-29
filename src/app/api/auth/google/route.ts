import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = getCanonicalOrigin(requestUrl.origin);
  const cookieDomain = getCookieDomain(requestUrl.origin);

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  const cookieBase = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };

  response.cookies.set('oauth_state', state, cookieBase);
  response.cookies.set('oauth_code_verifier', codeVerifier, cookieBase);

  return response;
}
