import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft-delete: keeps past records' activityType field intact and lets it
  // be re-added later without losing history.
  const activityType = await prisma.activityType.update({ where: { id: params.id }, data: { active: false } });

  await logAudit({
    action: 'ACTIVITY_TYPE_REMOVED',
    entityType: 'ActivityType',
    entityId: activityType.id,
    userId: session.userId,
    details: `Removed activity type "${activityType.name}" from the active list`,
    request
  });

  return NextResponse.json({ ok: true });
}
