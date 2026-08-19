import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import AuditTable from '@/components/AuditTable';
import { prisma } from '@/lib/db';

export default async function AdminLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { user: { select: { name: true, username: true } } }
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-8 animate-fade-in">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Activity log</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          Every sign-in, record submission, status change, and account change — with the device and time it happened.
        </p>
        <section className="card overflow-hidden">
          <AuditTable logs={logs} />
        </section>
      </main>
      <MobileTabBar />
    </div>
  );
}
