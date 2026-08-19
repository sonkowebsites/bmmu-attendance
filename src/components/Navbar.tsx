import Link from 'next/link';
import { getSession } from '@/lib/auth';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SignOutButton from './SignOutButton';

export default async function Navbar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-bmmu-black/10 dark:border-bmmu-cream/10 bg-bmmu-cream/70 dark:bg-bmmu-green-deep/70 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/dashboard">
          <Logo size={38} />
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
            Dashboard
          </Link>
          <Link href="/records" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
            Records
          </Link>
          <Link href="/records/new" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
            New Record
          </Link>
          {session.role === 'ADMIN' && (
            <>
              <Link href="/admin/users" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
                Staff Accounts
              </Link>
              <Link href="/admin/centres" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
                Centres
              </Link>
              <Link href="/admin/logs" className="rounded-full px-3 py-1.5 transition-all duration-150 hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/10 hover:scale-[1.04] active:scale-95">
                Activity Log
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight sm:block">
            <p className="font-medium">{session.name}</p>
            <p className="text-bmmu-black/50 dark:text-bmmu-cream/50">{session.role === 'ADMIN' ? 'Administrator' : 'Staff'}</p>
          </div>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
