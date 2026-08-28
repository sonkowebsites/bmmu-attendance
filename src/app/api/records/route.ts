import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const maxDuration = 30;

export async function GET(request: Request) {
  try {
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
  } catch (err) {
    console.error('Failed to list records', err);
    return NextResponse.json({ error: 'Could not load records right now. Please try again in a moment.' }, { status: 500 });
  }
}

/**
 * A free-tier Neon database "sleeps" after a few minutes of inactivity and
 * takes a moment to wake back up - the very first request after a quiet
 * spell can occasionally hit that wake-up window and fail. Retrying once
 * after a short pause resolves this transparently instead of surfacing it
 * to the person saving a record.
 */
type NewRecordData = {
  programmeName: string;
  centre: string;
  activityType: string;
  eventDate: Date;
  sheikhName: string | null;
  facilitatorName: string | null;
  numberOfAttendees: number | null;
  notes: string | null;
  submittedById: string;
  submittedByName: string;
};

async function createRecordWithRetry(data: NewRecordData) {
  try {
    return await prisma.attendanceRecord.create({ data });
  } catch (err) {
    console.warn('First attempt to save record failed, retrying once...', err);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return await prisma.attendanceRecord.create({ data });
  }
}

// Creates the record itself (metadata only, no images - JSON body). Images
// are uploaded one at a time afterwards via /api/records/[id]/images, so
// each request stays small regardless of how many photos are attached.
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Could not read the form data submitted. Please try again.' }, { status: 400 });
    }

    const programmeName = String(body.programmeName ?? '').trim();
    const centre = String(body.centre ?? '').trim();
    const activityType = String(body.activityType ?? '').trim();
    const eventDateRaw = String(body.eventDate ?? '');
    const sheikhName = String(body.sheikhName ?? '').trim() || null;
    const facilitatorName = String(body.facilitatorName ?? '').trim() || null;
    const numberOfAttendees = body.numberOfAttendees ? Number(body.numberOfAttendees) : null;
    const notes = String(body.notes ?? '').trim() || null;

    if (!programmeName || !centre || !activityType || !eventDateRaw) {
      return NextResponse.json({ error: 'Please fill in all required programme details.' }, { status: 400 });
    }

    // Restrict staff to their assigned centres, if any are set.
    if (session.role === 'STAFF' && session.centres.length > 0 && !session.centres.includes(centre)) {
      return NextResponse.json({ error: 'You are not authorised to submit records for that centre.' }, { status: 403 });
    }

    const record = await createRecordWithRetry({
      programmeName,
      centre,
      activityType,
      eventDate: new Date(eventDateRaw),
      sheikhName,
      facilitatorName,
      numberOfAttendees,
      notes,
      submittedById: session.userId,
      submittedByName: session.name
    });

    logAudit({
      action: 'RECORD_CREATED',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      recordId: record.id,
      userId: session.userId,
      details: `${activityType} — ${programmeName} (${centre})`,
      request
    }).catch((err) => console.error('Audit log failed (record was still saved)', err));

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (err) {
    console.error('Failed to save record', err);
    return NextResponse.json(
      { error: 'Could not save the record - the database may be waking up from being idle. Please wait a few seconds and try again.' },
      { status: 503 }
    );
  }
}
