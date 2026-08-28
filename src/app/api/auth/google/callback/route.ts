import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function toLogin(origin: string, error: string) {
  return NextResponse.redirect(`${origin}/login?error=${error}`);
}

// This app does NOT let people sign up with Google - it links Google
// sign-in to an account an administrator has already created (matched by
// the email address saved on that account). This keeps the "accounts are
// created by the administrator" access model intact while letting staff
// sign in with one tap instead of typing a password.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const cookieStore = cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  cookieStore.set('google_oauth_state', '', { path: '/', maxAge: 0 });

  if (oauthError) {
    return toLogin(origin, 'google_cancelled');
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return toLogin(origin, 'google_invalid');
  }

  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return toLogin(origin, 'google_not_configured');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenRes.ok) {
      console.error('Google token exchange failed', await tokenRes.text().catch(() => ''));
      return toLogin(origin, 'google_failed');
    }

    const tokens = await tokenRes.json();

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userInfoRes.ok) {
      return toLogin(origin, 'google_failed');
    }

    const profile = await userInfoRes.json();
    const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : null;

    if (!email || profile.email_verified !== true) {
      return toLogin(origin, 'google_unverified');
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      await logAudit({
        action: 'LOGIN_FAILED',
        entityType: 'Auth',
        details: `Google sign-in attempted with no matching active account: ${email}`,
        request
      });
      return toLogin(origin, 'google_no_account');
    }

    await setSessionCookie({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      centres: user.centres
    });

    await logAudit({
      action: 'LOGIN_SUCCESS',
      entityType: 'Auth',
      userId: user.id,
      details: 'Signed in with Google',
      request
    });

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (err) {
    console.error('Google sign-in failed', err);
    return toLogin(origin, 'google_failed');
  }
}
