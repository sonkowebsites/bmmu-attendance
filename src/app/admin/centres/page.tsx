import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import { prisma } from '@/lib/db';
import NewCentreForm from './NewCentreForm';
import CentreRow from './CentreRow';

export default async function AdminCentresPage() {
  const centres = await prisma.centre.findMany({ where: { active: true }, orderBy: { name: 'asc' } });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 animate-fade-in">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Centres</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          These are the centres staff can pick from when submitting a record, and when you restrict a staff
          account to specific centres.
        </p>

        <section className="card mb-8 p-5">
          <h2 className="eyebrow mb-4">Add a centre</h2>
          <NewCentreForm />
        </section>

        <section className="card overflow-hidden">
          <ul className="divide-y divide-bmmu-black/5 dark:divide-bmmu-cream/5 stagger">
            {centres.map((c) => (
              <CentreRow key={c.id} centre={{ id: c.id, name: c.name }} />
            ))}
            {centres.length === 0 && (
              <li className="p-5 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">No centres yet — add your first one above.</li>
            )}
          </ul>
        </section>
      </main>
      <MobileTabBar />
    </div>
  );
}
