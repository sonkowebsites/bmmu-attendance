import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const activityTypes = await prisma.activityType.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ activityTypes });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can add activity types.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter a valid activity type name.' }, { status: 400 });
  }

  const existing = await prisma.activityType.findUnique({ where: { name } });
  if (existing) {
    if (existing.active) {
      return NextResponse.json({ error: 'That activity type already exists.' }, { status: 409 });
    }
    // Re-activate a previously removed type instead of creating a duplicate.
    await prisma.activityType.update({ where: { id: existing.id }, data: { active: true } });
    await logAudit({
      action: 'ACTIVITY_TYPE_REACTIVATED',
      entityType: 'ActivityType',
      entityId: existing.id,
      userId: session.userId,
      details: `Re-added activity type "${name}"`,
      request
    });
    return NextResponse.json({ id: existing.id }, { status: 201 });
  }

  const activityType = await prisma.activityType.create({ data: { name } });

  await logAudit({
    action: 'ACTIVITY_TYPE_CREATED',
    entityType: 'ActivityType',
    entityId: activityType.id,
    userId: session.userId,
    details: `Added activity type "${name}"`,
    request
  });

  return NextResponse.json({ id: activityType.id }, { status: 201 });
}
