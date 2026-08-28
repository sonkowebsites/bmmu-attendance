import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import { prisma } from '@/lib/db';
import NewActivityTypeForm from './NewActivityTypeForm';
import ActivityTypeRow from './ActivityTypeRow';

export default async function AdminActivityTypesPage() {
  const activityTypes = await prisma.activityType.findMany({ where: { active: true }, orderBy: { name: 'asc' } });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-in">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Activity types</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          These are the types of activity staff can pick from when submitting a record (e.g. Friday Prayers, Sports
          Event).
        </p>

        <section className="card mb-8 p-5">
          <h2 className="eyebrow mb-4">Add an activity type</h2>
          <NewActivityTypeForm />
        </section>

        <section className="card overflow-hidden">
          <ul className="divide-y divide-bmmu-black/5 dark:divide-bmmu-cream/5 stagger">
            {activityTypes.map((t) => (
              <ActivityTypeRow key={t.id} activityType={{ id: t.id, name: t.name }} />
            ))}
            {activityTypes.length === 0 && (
              <li className="p-5 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
                No activity types yet — add your first one above.
              </li>
            )}
          </ul>
        </section>
      </main>
      <MobileTabBar />
    </div>
  );
}
