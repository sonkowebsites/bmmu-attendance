import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  const changeSummary: string[] = [];

  if (typeof body.name === 'string' && body.name.trim().length >= 2) {
    data.name = body.name.trim();
    changeSummary.push(`name changed to "${data.name}"`);
  }
  if (typeof body.active === 'boolean') {
    data.active = body.active;
    changeSummary.push(body.active ? 'reactivated' : 'deactivated');
  }
  if (body.role === 'ADMIN' || body.role === 'STAFF') {
    data.role = body.role;
    changeSummary.push(`role set to ${body.role}`);
  }
  if (Array.isArray(body.centres)) {
    data.centres = body.centres;
    changeSummary.push('centre access updated');
  }
  if (typeof body.newPassword === 'string' && body.newPassword.length >= 8) {
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
    changeSummary.push('password reset');
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  // Prevent an admin from locking themselves out entirely.
  if (params.id === session.userId && data.role === 'STAFF') {
    return NextResponse.json({ error: 'You cannot remove your own admin access.' }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data });

  await logAudit({
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: updated.id,
    userId: session.userId,
    details: `Updated "${updated.username}": ${changeSummary.join(', ')}`,
    request
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (params.id === session.userId) {
    return NextResponse.json({ error: 'You cannot delete your own account while signed in as it.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  // Records this person submitted keep a permanent name snapshot
  // (submittedByName), so deleting the account never erases archive history.
  await prisma.user.delete({ where: { id: params.id } });

  await logAudit({
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: params.id,
    userId: session.userId,
    details: `Deleted account "${target.username}"`,
    request
  });

  return NextResponse.json({ ok: true });
}
