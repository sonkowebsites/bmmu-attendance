import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import RecordForm from '@/components/RecordForm';
import { getSession } from '@/lib/auth';

export default async function NewRecordPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="mb-1 text-3xl font-semibold">New attendance record</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          Capture or upload the physical sheet, then fill in the programme details below. It's saved to the archive and
          backed up to Google Drive automatically.
        </p>
        <RecordForm allowedCentres={session.centres} />
      </main>
      <MobileTabBar />
    </div>
  );
}
