import { Suspense } from 'react';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import LoginForm from './LoginForm';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const googleConfigured = Boolean(process.env.GOOGLE_LOGIN_CLIENT_ID);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="dome-backdrop" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} showText={false} />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">BMMU Attendance Archive</h1>
          <p className="eyebrow mt-1">Bilal Muslim Mission Uganda</p>
        </div>

        {searchParams.error && (
          <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{searchParams.error}</p>
        )}

        <div className="card space-y-4 p-6">
          <Suspense fallback={<p className="text-sm text-center">Loading…</p>}>
            <LoginForm />
          </Suspense>

          {googleConfigured && (
            <>
              <div className="flex items-center gap-3 text-xs text-bmmu-black/40 dark:text-bmmu-cream/40">
                <span className="h-px flex-1 bg-bmmu-black/10 dark:bg-bmmu-cream/10" />
                or
                <span className="h-px flex-1 bg-bmmu-black/10 dark:bg-bmmu-cream/10" />
              </div>
              <a href="/api/auth/google/start" className="btn-secondary w-full">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.87-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.12-6.74-4.96H1.27v3.11A12 12 0 0 0 12 24z" />
                  <path fill="#FBBC05" d="M5.26 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.75l3.99-3.11z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l3.99 3.1C6.21 6.88 8.87 4.75 12 4.75z" />
                </svg>
                Continue with Google
              </a>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">
          Accounts are created by the administrator. Contact your office admin if you need access.
        </p>
      </div>
    </div>
  );
}
