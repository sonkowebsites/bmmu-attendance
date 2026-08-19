import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await logAudit({ action: 'LOGOUT', entityType: 'Auth', userId: session.userId, request });
  }
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
