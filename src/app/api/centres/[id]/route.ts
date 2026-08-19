import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft-delete: keeps past records' centre field intact and lets it be
  // re-added later without losing history.
  const centre = await prisma.centre.update({ where: { id: params.id }, data: { active: false } });

  await logAudit({
    action: 'CENTRE_REMOVED',
    entityType: 'User',
    entityId: centre.id,
    userId: session.userId,
    details: `Removed centre "${centre.name}" from the active list`,
    request
  });

  return NextResponse.json({ ok: true });
}
