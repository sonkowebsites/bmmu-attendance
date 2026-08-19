import { Suspense } from 'react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="dome-backdrop" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} showText={false} />
          <h1 className="mt-4 font-display text-2xl font-semibold">BMMU Attendance Archive</h1>
          <p className="eyebrow mt-1">Bilal Muslim Mission Uganda</p>
        </div>

        <div className="card p-6">
          <Suspense fallback={<p className="text-sm text-center">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">
          Accounts are created by the administrator. Contact your office admin if you need access.
        </p>
      </div>
    </div>
  );
}
