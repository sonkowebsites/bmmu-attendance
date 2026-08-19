import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default async function MobileTabBar() {
  const session = await getSession();
  if (!session) return null;

  const items = [
    { href: '/dashboard', label: 'Home' },
    { href: '/records', label: 'Records' },
    { href: '/records/new', label: 'Scan' },
    ...(session.role === 'ADMIN' ? [{ href: '/admin/users', label: 'Staff' }] : [])
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-bmmu-black/10 dark:border-bmmu-cream/10 bg-bmmu-cream/60 dark:bg-bmmu-green-deep/60 backdrop-blur-xl md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 select-none py-3 text-center text-xs font-semibold text-bmmu-black/60 dark:text-bmmu-cream/60 transition-all duration-150 ease-out hover:text-bmmu-green dark:hover:text-bmmu-gold active:scale-90"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
