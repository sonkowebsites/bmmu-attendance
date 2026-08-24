import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!['SUBMITTED', 'VERIFIED', 'FLAGGED'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.update({
    where: { id: params.id },
    data: { status: body.status }
  });

  await logAudit({
    action: 'RECORD_STATUS_CHANGED',
    entityType: 'AttendanceRecord',
    entityId: record.id,
    recordId: record.id,
    userId: session.userId,
    details: `Status set to ${body.status}`,
    request
  });

  return NextResponse.json({ ok: true });
}
