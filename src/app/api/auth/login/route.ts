import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });

  if (!user || !user.active) {
    await logAudit({ action: 'LOGIN_FAILED', entityType: 'Auth', details: `Unknown or inactive username: ${username}`, request });
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await logAudit({ action: 'LOGIN_FAILED', entityType: 'Auth', userId: user.id, details: 'Incorrect password', request });
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    centres: user.centres
  });

  await logAudit({ action: 'LOGIN_SUCCESS', entityType: 'Auth', userId: user.id, request });

  return NextResponse.json({ ok: true });
}
