import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Uses Neon's serverless driver adapter, which is the recommended way to
// talk to Neon from serverless platforms like Vercel - it avoids exhausting
// Neon's connection limit the way many short-lived TCP connections would.
const connectionString = process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });

// Prevent creating a new Prisma Client on every hot-reload in development,
// and keep a single instance in serverless production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
