import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME || 'BMMU Administrator';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin account "${username}" already exists - nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, username, passwordHash, role: 'ADMIN', centres: [] }
  });

  console.log(`Created first admin account:
  username: ${username}
  password: ${password}

Sign in and change this password immediately by creating a fresh account
and deactivating this one, or by wiring up a "change password" flow.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
