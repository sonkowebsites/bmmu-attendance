import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const centres = await prisma.centre.findMany({
    where: { active: true },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ centres });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can add centres.' }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name ?? '').trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter a valid centre name.' }, { status: 400 });
  }

  const existing = await prisma.centre.findUnique({ where: { name } });
  if (existing) {
    if (existing.active) {
      return NextResponse.json({ error: 'That centre already exists.' }, { status: 409 });
    }
    // Re-activate a previously removed centre instead of creating a duplicate.
    await prisma.centre.update({ where: { id: existing.id }, data: { active: true } });
    await logAudit({
      action: 'CENTRE_REACTIVATED',
      entityType: 'User',
      entityId: existing.id,
      userId: session.userId,
      details: `Re-added centre "${name}"`,
      request
    });
    return NextResponse.json({ id: existing.id }, { status: 201 });
  }

  const centre = await prisma.centre.create({ data: { name } });

  await logAudit({
    action: 'CENTRE_CREATED',
    entityType: 'User',
    entityId: centre.id,
    userId: session.userId,
    details: `Added centre "${name}"`,
    request
  });

  return NextResponse.json({ id: centre.id }, { status: 201 });
}
