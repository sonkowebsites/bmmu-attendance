import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import AuditTable from '@/components/AuditTable';
import RecordStatusControl from './RecordStatusControl';
import DeleteRecordButton from './DeleteRecordButton';
import RecordImages from './RecordImages';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function RecordDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return null;

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: params.id },
    include: {
      submittedBy: { select: { name: true, username: true } },
      images: { orderBy: { order: 'asc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, username: true } } } }
    }
  });

  if (!record) notFound();

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-8 animate-fade-in">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{record.activityType}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{record.programmeName}</h1>
            <p className="mt-1 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
              {record.centre} · {new Date(record.eventDate).toLocaleDateString('en-GB', { dateStyle: 'long' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {session.role === 'ADMIN' && <RecordStatusControl recordId={record.id} status={record.status} />}
            {session.role === 'ADMIN' && <DeleteRecordButton recordId={record.id} programmeName={record.programmeName} />}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="card overflow-hidden">
            <RecordImages
              recordId={record.id}
              images={record.images.map((img) => ({ id: img.id, driveViewLink: img.driveViewLink }))}
              canDelete={session.role === 'ADMIN'}
            />
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="eyebrow">Programme details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-bmmu-black/60 dark:text-bmmu-cream/60">Sheikh / officiant</dt><dd>{record.sheikhName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-bmmu-black/60 dark:text-bmmu-cream/60">Recorded by</dt><dd>{record.facilitatorName || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-bmmu-black/60 dark:text-bmmu-cream/60">Attendees</dt><dd>{record.numberOfAttendees ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-bmmu-black/60 dark:text-bmmu-cream/60">Submitted by</dt><dd>{record.submittedBy?.name ?? record.submittedByName}</dd></div>
              <div className="flex justify-between"><dt className="text-bmmu-black/60 dark:text-bmmu-cream/60">Submitted on</dt><dd>{new Date(record.createdAt).toLocaleString('en-GB')}</dd></div>
            </dl>
            {record.notes && (
              <div className="pt-2">
                <p className="text-bmmu-black/60 dark:text-bmmu-cream/60 text-sm">Notes</p>
                <p className="text-sm">{record.notes}</p>
              </div>
            )}
          </section>
        </div>

        <section className="card mt-6 overflow-hidden">
          <h2 className="border-b border-bmmu-black/10 dark:border-bmmu-cream/10 p-5 font-display text-lg font-semibold">
            Change history for this record
          </h2>
          <AuditTable logs={record.auditLogs} />
        </section>
      </main>
      <MobileTabBar />
    </div>
  );
}
