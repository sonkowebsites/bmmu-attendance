import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [total, thisMonth, byCentre, recent] = await Promise.all([
    prisma.attendanceRecord.count(),
    prisma.attendanceRecord.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.attendanceRecord.groupBy({ by: ['centre'], _count: { _all: true } }),
    prisma.attendanceRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { submittedBy: { select: { name: true } } }
    })
  ]);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-8 animate-fade-in">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{session.name}</h1>
          </div>
          <Link href="/records/new" className="btn-primary">
            + New attendance record
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3 stagger">
          <div className="card card-hover p-5">
            <p className="eyebrow">Total records archived</p>
            <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">{total}</p>
          </div>
          <div className="card card-hover p-5">
            <p className="eyebrow">Added this month</p>
            <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">{thisMonth}</p>
          </div>
          <div className="card card-hover p-5">
            <p className="eyebrow">Centres reporting</p>
            <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">{byCentre.length}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-bmmu-black/10 dark:border-bmmu-cream/10 p-5">
              <h2 className="font-display text-lg font-bold">Recently added</h2>
              <Link href="/records" className="text-sm font-medium text-bmmu-green dark:text-bmmu-gold transition-transform duration-150 hover:scale-105 inline-block">
                View all →
              </Link>
            </div>
            <ul className="divide-y divide-bmmu-black/5 dark:divide-bmmu-cream/5">
              {recent.length === 0 && (
                <li className="p-5 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
                  No records yet — the first scan you save will show up here.
                </li>
              )}
              {recent.map((r) => (
                <li key={r.id} className="p-5 transition-colors duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/5">
                  <Link href={`/records/${r.id}`} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{r.programmeName}</p>
                      <p className="text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
                        {r.centre} · {new Date(r.eventDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })} · submitted by {r.submittedBy?.name ?? r.submittedByName}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-bmmu-green/10 px-3 py-1 text-xs font-semibold text-bmmu-green dark:text-bmmu-gold">
                      {r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg font-bold">Records by centre</h2>
            <ul className="mt-4 space-y-3">
              {byCentre
                .sort((a, b) => b._count._all - a._count._all)
                .map((c) => (
                  <li key={c.centre} className="flex items-center justify-between text-sm">
                    <span>{c.centre}</span>
                    <span className="font-semibold">{c._count._all}</span>
                  </li>
                ))}
              {byCentre.length === 0 && (
                <li className="text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">No data yet.</li>
              )}
            </ul>
          </section>
        </div>
      </main>

      <MobileTabBar />
    </div>
  );
}
