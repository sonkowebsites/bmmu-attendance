import Navbar from '@/components/Navbar';
import MobileTabBar from '@/components/MobileTabBar';
import { prisma } from '@/lib/db';
import NewUserForm from './NewUserForm';
import UserRow from './UserRow';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8 animate-fade-in">
        <h1 className="mb-1 text-3xl font-bold tracking-tight">Staff accounts</h1>
        <p className="mb-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          You control every account here — staff cannot sign themselves up. Create an account, assign a role, and
          optionally restrict it to specific centres. Need to add a new centre first?{' '}
          <a href="/admin/centres" className="font-semibold text-bmmu-green underline dark:text-bmmu-gold">
            Manage centres →
          </a>
        </p>

        <section className="card mb-8 p-5">
          <h2 className="eyebrow mb-4">Create a new account</h2>
          <NewUserForm />
        </section>

        <section className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-bmmu-black/10 dark:border-bmmu-cream/10 text-xs uppercase tracking-wide text-bmmu-black/50 dark:text-bmmu-cream/50">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Centres</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={{ id: u.id, name: u.name, username: u.username, role: u.role, centres: u.centres, active: u.active }}
                />
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <MobileTabBar />
    </div>
  );
}
