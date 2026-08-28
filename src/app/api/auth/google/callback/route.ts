import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleLoginClient } from '@/lib/google-login';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieState = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('google_oauth_state='))
    ?.split('=')[1];

  function fail(message: string) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }

  if (!code) return fail('Google sign-in was cancelled or did not complete.');
  if (!state || !cookieState || state !== cookieState) {
    return fail('That sign-in link expired or was invalid. Please try again.');
  }

  try {
    const client = getGoogleLoginClient(redirectUri);
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email || !profile.verified_email) {
      return fail('Could not confirm a verified Google email address.');
    }

    const user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user || !user.active) {
      await logAudit({
        action: 'LOGIN_FAILED',
        entityType: 'Auth',
        details: `Google sign-in attempted with unrecognised or inactive email: ${profile.email}`,
        request
      });
      return fail('No active BMMU account is linked to that Google email. Ask your admin to add it to your account.');
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

    const res = NextResponse.redirect(`${origin}/dashboard`);
    res.cookies.set('google_oauth_state', '', { path: '/', maxAge: 0 }); // clean up
    return res;
  } catch (err) {
    console.error('Google sign-in failed', err);
    return fail('Something went wrong completing Google sign-in. Please try again.');
  }
}
