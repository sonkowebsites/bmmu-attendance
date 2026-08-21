import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { uploadAttendanceImages } from '@/lib/drive';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const centre = searchParams.get('centre') ?? undefined;
  const q = searchParams.get('q') ?? undefined;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(centre ? { centre } : {}),
      ...(session.role === 'STAFF' && session.centres.length > 0 ? { centre: { in: session.centres } } : {}),
      ...(q
        ? {
            OR: [
              { programmeName: { contains: q, mode: 'insensitive' } },
              { sheikhName: { contains: q, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    orderBy: { eventDate: 'desc' },
    include: { submittedBy: { select: { name: true } }, images: true },
    take: 200
  });

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  // Support both the "images" (multiple) field and a legacy single "image" field.
  const images = [...formData.getAll('images'), ...formData.getAll('image')].filter(
    (f): f is File => f instanceof File && f.size > 0
  );

  const programmeName = String(formData.get('programmeName') ?? '').trim();
  const centre = String(formData.get('centre') ?? '').trim();
  const activityType = String(formData.get('activityType') ?? '').trim();
  const eventDateRaw = String(formData.get('eventDate') ?? '');
  const sheikhName = String(formData.get('sheikhName') ?? '').trim() || null;
  const facilitatorName = String(formData.get('facilitatorName') ?? '').trim() || null;
  const numberOfAttendeesRaw = formData.get('numberOfAttendees');
  const notes = String(formData.get('notes') ?? '').trim() || null;

  if (!programmeName || !centre || !activityType || !eventDateRaw) {
    return NextResponse.json({ error: 'Please fill in all required programme details.' }, { status: 400 });
  }

  if (images.length === 0) {
    return NextResponse.json({ error: 'Please attach at least one photo or scanned copy of the attendance sheet.' }, { status: 400 });
  }
  if (images.length > 12) {
    return NextResponse.json({ error: 'Please attach 12 images or fewer per record.' }, { status: 400 });
  }

  // Restrict staff to their assigned centres, if any are set.
  if (session.role === 'STAFF' && session.centres.length > 0 && !session.centres.includes(centre)) {
    return NextResponse.json({ error: 'You are not authorised to submit records for that centre.' }, { status: 403 });
  }

  const eventDate = new Date(eventDateRaw);

  const record = await prisma.attendanceRecord.create({
    data: {
      programmeName,
      centre,
      activityType,
      eventDate,
      sheikhName,
      facilitatorName,
      numberOfAttendees: numberOfAttendeesRaw ? Number(numberOfAttendeesRaw) : null,
      notes,
      submittedById: session.userId,
      submittedByName: session.name
    }
  });

  // Upload every page to Google Drive. If Drive isn't configured yet, keep
  // the record (so nothing is lost) and surface a clear note instead of
  // failing the whole submission.
  try {
    const preparedFiles = await Promise.all(
      images.map(async (image, index) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const safeName = `${eventDate.toISOString().slice(0, 10)}_${activityType}_${record.id}_${index + 1}`.replace(/\s+/g, '-');
        return { buffer, mimeType: image.type || 'image/jpeg', fileName: safeName };
      })
    );

    const uploadResults = await uploadAttendanceImages({ files: preparedFiles, centre, eventDate });

    await prisma.recordImage.createMany({
      data: uploadResults.map((r, index) => ({
        recordId: record.id,
        driveFileId: r.driveFileId,
        driveViewLink: r.driveViewLink,
        driveFolderPath: r.driveFolderPath,
        mimeType: r.mimeType,
        order: index
      }))
    });
  } catch (err) {
    console.error('Google Drive upload failed', err);
    await logAudit({
      action: 'DRIVE_UPLOAD_FAILED',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      recordId: record.id,
      userId: session.userId,
      details: err instanceof Error ? err.message : 'Unknown error uploading to Google Drive',
      request
    });
  }

  await logAudit({
    action: 'RECORD_CREATED',
    entityType: 'AttendanceRecord',
    entityId: record.id,
    recordId: record.id,
    userId: session.userId,
    details: `${activityType} — ${programmeName} (${centre}) — ${images.length} image${images.length === 1 ? '' : 's'}`,
    request
  });

  return NextResponse.json({ id: record.id }, { status: 201 });
}
