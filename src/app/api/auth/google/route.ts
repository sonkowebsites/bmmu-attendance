import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// This is a *separate* Google OAuth client from the one used for the Drive
// backup (see src/lib/drive.ts). That one is a one-time "Desktop app"
// authorization the admin runs once from their own machine. This one is a
// "Web application" client used every time a staff member signs in, so it
// needs its own Client ID/Secret and an Authorized Redirect URI set in
// Google Cloud Console pointing at /api/auth/google/callback (see README).
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/login?error=google_not_configured`);
  }

  const state = randomBytes(16).toString('hex');

  cookies().set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300 // 5 minutes - just long enough to complete the Google consent screen
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', `${origin}/api/auth/google/callback`);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(authUrl.toString());
}
