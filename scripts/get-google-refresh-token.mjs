// One-time helper: run this on your own computer (not on the server) to get
// the GOOGLE_REFRESH_TOKEN value for your .env file.
//
// Usage:
//   node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
//
// Full instructions are in README.md -> "Google Drive setup".
//
// NOTE: this uses the "loopback" redirect flow (a page briefly served on
// your own computer at http://localhost) rather than the older manual
// copy/paste ("OOB") flow, which Google has fully blocked as of 2023.

import { google } from 'googleapis';
import http from 'node:http';

const [clientId, clientSecret] = process.argv.slice(2);

if (!clientId || !clientSecret) {
  console.error('Usage: node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const PORT = 53682; // any free local port works - this one is just unlikely to clash
const REDIRECT_URI = `http://localhost:${PORT}`;

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file']
});

console.log('\n1. Open this URL in a browser, signed in with the Google account you want scans saved to:\n');
console.log(authUrl);
console.log(
  '\n2. Approve access. You may see an "unverified app" warning - click "Advanced" then "Go to (app name)" to continue, this is expected for a private app.'
);
console.log('\n3. Your browser will redirect to localhost and this script will pick it up automatically.\n');
console.log('Waiting for you to finish in the browser...\n');

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, REDIRECT_URI);
      const authCode = url.searchParams.get('code');
      const authError = url.searchParams.get('error');

      if (authError) {
        res.end('Authorization failed - you can close this tab and check the terminal.');
        server.close();
        reject(new Error(`Google returned an error: ${authError}`));
        return;
      }

      if (authCode) {
        res.end('Success! You can close this tab and go back to the terminal.');
        server.close();
        resolve(authCode);
      }
    } catch (err) {
      res.end('Something went wrong - check the terminal.');
      server.close();
      reject(err);
    }
  });

  server.listen(PORT);
});

const { tokens } = await oAuth2Client.getToken(code);

console.log('\nAdd this to your .env / hosting provider environment variables:\n');
console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
console.log('\nKeep it secret - it grants upload access to your Drive folder.');
