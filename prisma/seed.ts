import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CENTRES = ['BMMU HQ', 'Jinja', 'Nakalanga', 'Tirinyi', 'Nwanzu / Iganga', 'Kibundaire'];

const DEFAULT_ACTIVITY_TYPES = [
  'Sheikh Attendance Verification',
  'Majlis / Religious Gathering',
  'Shuyuk Seminar',
  'Elder Members Assembly',
  'Friday Prayers',
  'Qurbani / Distribution',
  'Sports Event',
  'Other'
];

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.SEED_ADMIN_NAME || 'BMMU Administrator';

  for (const centreName of DEFAULT_CENTRES) {
    await prisma.centre.upsert({
      where: { name: centreName },
      update: {},
      create: { name: centreName }
    });
  }
  console.log(`Ensured ${DEFAULT_CENTRES.length} default centres exist.`);

  for (const typeName of DEFAULT_ACTIVITY_TYPES) {
    await prisma.activityType.upsert({
      where: { name: typeName },
      update: {},
      create: { name: typeName }
    });
  }
  console.log(`Ensured ${DEFAULT_ACTIVITY_TYPES.length} default activity types exist.`);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin account "${username}" already exists - nothing more to do.`);
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
