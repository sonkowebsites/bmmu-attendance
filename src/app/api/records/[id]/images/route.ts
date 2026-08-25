import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { uploadAttendanceImages } from '@/lib/drive';

// Google Drive calls (folder lookups + the upload itself) can occasionally
// run past the platform's default 10s function timeout on a slow
// connection - this raises the ceiling so a slow upload finishes instead of
// getting cut off mid-response.
export const maxDuration = 60;

// Handles ONE image per request, deliberately - this keeps every request
// small (well under hosting platform request-size limits) no matter how
// many photos a record ends up with, and one slow/failed image never
// blocks the others. Every exit point returns valid JSON, even on an
// unexpected crash, so the browser never has to guess what happened.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err) {
    console.error('Session check failed', err);
    return NextResponse.json({ error: 'Your session may have expired - please sign in again.' }, { status: 401 });
  }

  try {
    const record = await prisma.attendanceRecord.findUnique({ where: { id: params.id } });
    if (!record) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });

    const formData = await request.formData();
    const image = formData.get('image');
    const orderRaw = formData.get('order');

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json({ error: 'No image received.' }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const order = orderRaw ? Number(orderRaw) : 0;
    const safeName = `${record.eventDate.toISOString().slice(0, 10)}_${record.activityType}_${record.id}_${order + 1}`.replace(
      /\s+/g,
      '-'
    );

    const [uploaded] = await uploadAttendanceImages({
      files: [{ buffer, mimeType: image.type || 'image/jpeg', fileName: safeName }],
      centre: record.centre,
      eventDate: record.eventDate
    });

    const saved = await prisma.recordImage.create({
      data: {
        recordId: record.id,
        driveFileId: uploaded.driveFileId,
        driveViewLink: uploaded.driveViewLink,
        driveFolderPath: uploaded.driveFolderPath,
        mimeType: uploaded.mimeType,
        order
      }
    });

    return NextResponse.json({ id: saved.id, driveViewLink: saved.driveViewLink }, { status: 201 });
  } catch (err) {
    console.error('Image upload failed', err);
    logAudit({
      action: 'DRIVE_UPLOAD_FAILED',
      entityType: 'AttendanceRecord',
      entityId: params.id,
      recordId: params.id,
      userId: session.userId,
      details: err instanceof Error ? err.message : 'Unknown error uploading to Google Drive',
      request
    }).catch(() => {});
    return NextResponse.json({ error: 'Could not back this image up to Google Drive. It was not saved - please try again.' }, { status: 502 });
  }
}
