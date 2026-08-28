import { google } from 'googleapis';

/**
 * A separate OAuth client from the one in drive.ts. That one uses a
 * "Desktop app" credential (installed-app flow, no redirect URI) purely to
 * back up images to your own Drive. This one uses a "Web application"
 * credential with a real redirect URI, for people signing into the site
 * itself with their Google account. Two different credential types in
 * Google Cloud - see README for how to create this one.
 */
export function getGoogleLoginClient(redirectUri: string) {
  const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google sign-in is not configured. Set GOOGLE_LOGIN_CLIENT_ID and GOOGLE_LOGIN_CLIENT_SECRET.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}
