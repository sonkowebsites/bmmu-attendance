import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const createUserSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9._-]+$/i, 'Use letters, numbers, dots, dashes or underscores only'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'STAFF']),
  centres: z.array(z.string()).default([])
});

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, username: true, email: true, role: true, centres: true, active: true, createdAt: true
    }
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only an administrator can create accounts.' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { name, username, email, password, role, centres } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email: email || null,
      passwordHash,
      role,
      centres,
      createdById: session.userId
    }
  });

  await logAudit({
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    userId: session.userId,
    details: `Created ${role.toLowerCase()} account "${user.username}"`,
    request
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
