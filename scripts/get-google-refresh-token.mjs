// One-time helper: run this on your own computer (not on the server) to get
// the GOOGLE_REFRESH_TOKEN value for your .env file.
//
// Usage:
//   node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
//
// Full instructions are in README.md -> "Google Drive setup".

import { google } from 'googleapis';
import readline from 'node:readline/promises';

const [clientId, clientSecret] = process.argv.slice(2);

if (!clientId || !clientSecret) {
  console.error('Usage: node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // manual "copy the code" flow, no local server needed

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file']
});

console.log('\n1. Open this URL in a browser, signed in with the Google account you want scans saved to:\n');
console.log(authUrl);
console.log('\n2. Approve access, then copy the code Google shows you.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = await rl.question('Paste the code here: ');
rl.close();

const { tokens } = await oAuth2Client.getToken(code.trim());

console.log('\nAdd this to your .env / hosting provider environment variables:\n');
console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
console.log('\nKeep it secret - it grants upload access to your Drive folder.');
