import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { deleteDriveFile } from '@/lib/drive';

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

// Deletion is restricted to administrators - this permanently removes the
// record, its images (including the actual files in Google Drive), and
// cannot be undone. Restricting it to admins keeps this in line with every
// other destructive action in the app (removing a centre, an activity type,
// a staff account).
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can delete a record.' }, { status: 403 });
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: params.id },
    include: { images: true }
  });

  if (!record) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
  }

  // Best-effort cleanup of the actual files in Drive - a failure here
  // shouldn't block deleting the record itself.
  for (const image of record.images) {
    if (!image.driveFileId) continue;
    try {
      await deleteDriveFile(image.driveFileId);
    } catch (err) {
      console.error('Could not delete Drive file while deleting record', record.id, image.id, err);
    }
  }

  // RecordImage rows cascade-delete automatically (see schema.prisma).
  await prisma.attendanceRecord.delete({ where: { id: record.id } });

  await logAudit({
    action: 'RECORD_DELETED',
    entityType: 'AttendanceRecord',
    entityId: record.id,
    userId: session.userId,
    details: `Deleted record "${record.programmeName}" (${record.centre}, ${record.activityType})`,
    request
  });

  return NextResponse.json({ ok: true });
}
