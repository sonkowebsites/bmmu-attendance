import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getGoogleLoginClient } from '@/lib/google-login';

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  let authUrl: string;
  try {
    const client = getGoogleLoginClient(redirectUri);
    // A random, one-time value stored in a short-lived cookie and checked
    // again on the way back - stops a third party from tricking someone
    // into completing a sign-in flow they didn't start (CSRF).
    const state = crypto.randomBytes(16).toString('hex');

    authUrl = client.generateAuthUrl({
      access_type: 'online',
      scope: ['openid', 'email', 'profile'],
      state
    });

    const res = NextResponse.redirect(authUrl);
    res.cookies.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300 // 5 minutes is plenty to complete the Google consent screen
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google sign-in is not set up yet.';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }
}
