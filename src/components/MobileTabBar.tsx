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
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-bmmu-black/10 dark:border-bmmu-cream/10 bg-bmmu-cream/95 dark:bg-bmmu-green-deep/95 backdrop-blur-sm md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 py-3 text-center text-xs font-medium text-bmmu-black/70 dark:text-bmmu-cream/70"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
