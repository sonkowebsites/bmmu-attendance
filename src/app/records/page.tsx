import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function RecordsPage({ searchParams }: { searchParams: { q?: string; centre?: string } }) {
  const session = await getSession();
  if (!session) return null;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      ...(session.role === 'STAFF' && session.centres.length > 0 ? { centre: { in: session.centres } } : {}),
      ...(searchParams.centre ? { centre: searchParams.centre } : {}),
      ...(searchParams.q
        ? {
            OR: [
              { programmeName: { contains: searchParams.q, mode: 'insensitive' } },
              { sheikhName: { contains: searchParams.q, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    orderBy: { eventDate: 'desc' },
    include: { submittedBy: { select: { name: true } } },
    take: 200
  });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Attendance records</h1>
          <Link href="/records/new" className="btn-primary">+ New record</Link>
        </div>

        <form className="card mb-6 flex flex-wrap gap-3 p-4" method="get">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search by programme or sheikh name"
            className="input max-w-xs"
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-bmmu-black/10 dark:border-bmmu-cream/10 text-xs uppercase tracking-wide text-bmmu-black/50 dark:text-bmmu-cream/50">
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Centre</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Submitted by</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-bmmu-black/5 dark:border-bmmu-cream/5 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/5">
                  <td className="px-4 py-3">
                    <Link href={`/records/${r.id}`} className="font-medium">{r.programmeName}</Link>
                    <p className="text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">{r.activityType}</p>
                  </td>
                  <td className="px-4 py-3">{r.centre}</td>
                  <td className="px-4 py-3">{new Date(r.eventDate).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</td>
                  <td className="px-4 py-3">{r.submittedBy.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-bmmu-green/10 px-2.5 py-1 text-xs font-semibold text-bmmu-green dark:text-bmmu-gold">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-bmmu-black/60 dark:text-bmmu-cream/60">
                    No records match yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
