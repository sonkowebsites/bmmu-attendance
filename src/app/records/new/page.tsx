import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import RecordForm from '@/components/RecordForm';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function NewRecordPage() {
  const session = await getSession();
  if (!session) return null;

  const activeCentres = await prisma.centre.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { name: true }
  });
  const allNames = activeCentres.map((c) => c.name);

  // If this staff account is restricted to specific centres, only offer those.
  const centreOptions = session.centres.length > 0 ? session.centres : allNames;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-in">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">New attendance record</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          Capture or upload the physical sheet, then fill in the programme details below. It's saved to the archive and
          backed up to Google Drive automatically.
        </p>
        <RecordForm centreOptions={centreOptions} />
      </main>
      <MobileTabBar />
    </div>
  );
}
