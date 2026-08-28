import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Uploads attendance-sheet images straight into the admin's own Google Drive.
 *
 * This uses a standard OAuth2 "refresh token" that is generated ONCE by the
 * admin (see README -> "Google Drive setup") and stored as an environment
 * variable. Every upload after that happens silently in the background -
 * no one has to log into Google inside the app itself.
 *
 * Files land in one folder (GOOGLE_DRIVE_FOLDER_ID), organised into
 * "Centre / Year" subfolders so the Drive stays browsable on its own.
 */

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN (see README).'
    );
  }

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

async function findOrCreateFolder(drive: ReturnType<typeof google.drive>, name: string, parentId: string) {
  const safeName = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
    return res.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  });

  if (!created.data.id) throw new Error('Failed to create Google Drive folder');
  return created.data.id;
}

/**
 * Permanently deletes a single file from Google Drive. Used when a staff
 * member removes an image or an admin deletes a whole record - keeps the
 * Drive folder in sync with the archive instead of accumulating orphaned
 * files. Safe to call even if the file was already removed manually.
 */
export async function deleteDriveFile(fileId: string) {
  const auth = getOAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  try {
    await drive.files.delete({ fileId });
  } catch (err: any) {
    // Already gone from Drive (e.g. removed manually) - not a real failure.
    if (err?.code === 404 || err?.response?.status === 404) return;
    throw err;
  }
}

export async function uploadAttendanceImages({
  files,
  centre,
  eventDate
}: {
  files: { buffer: Buffer; mimeType: string; fileName: string }[];
  centre: string;
  eventDate: Date;
}) {
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set (see README -> Google Drive setup).');
  }

  const auth = getOAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const year = String(eventDate.getFullYear());
  const centreFolderId = await findOrCreateFolder(drive, centre || 'Unspecified Centre', rootFolderId);
  const yearFolderId = await findOrCreateFolder(drive, year, centreFolderId);
  const driveFolderPath = `${centre || 'Unspecified Centre'}/${year}`;

  const results: { driveFileId: string | null; driveViewLink: string | null; driveFolderPath: string; mimeType: string }[] = [];

  for (const file of files) {
    const media = { mimeType: file.mimeType, body: Readable.from(file.buffer) };
    const uploaded = await drive.files.create({
      requestBody: { name: file.fileName, parents: [yearFolderId] },
      media,
      fields: 'id, webViewLink, name'
    });

    results.push({
      driveFileId: uploaded.data.id ?? null,
      driveViewLink: uploaded.data.webViewLink ?? null,
      driveFolderPath,
      mimeType: file.mimeType
    });
  }

  return results;
}
