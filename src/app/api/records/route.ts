import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { uploadAttendanceImage } from '@/lib/drive';

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
    include: { submittedBy: { select: { name: true } } },
    take: 200
  });

  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const image = formData.get('image');

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

  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: 'Please attach a photo or scanned copy of the attendance sheet.' }, { status: 400 });
  }

  // Restrict staff to their assigned centres, if any are set.
  if (session.role === 'STAFF' && session.centres.length > 0 && !session.centres.includes(centre)) {
    return NextResponse.json({ error: 'You are not authorised to submit records for that centre.' }, { status: 403 });
  }

  const eventDate = new Date(eventDateRaw);
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

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
      imageMimeType: image.type,
      submittedById: session.userId
    }
  });

  // Upload to Google Drive. If Drive isn't configured yet, keep the record
  // (so nothing is lost) and surface a clear note instead of failing hard.
  try {
    const safeName = `${eventDate.toISOString().slice(0, 10)}_${activityType}_${record.id}`.replace(/\s+/g, '-');
    const uploadResult = await uploadAttendanceImage({
      buffer,
      mimeType: image.type || 'image/jpeg',
      fileName: safeName,
      centre,
      eventDate
    });

    await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: uploadResult
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
    details: `${activityType} — ${programmeName} (${centre})`,
    request
  });

  return NextResponse.json({ id: record.id }, { status: 201 });
}
