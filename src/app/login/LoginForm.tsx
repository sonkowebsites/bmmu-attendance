'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  google_invalid: 'Something went wrong with Google sign-in. Please try again.',
  google_not_configured: 'Google sign-in is not set up yet. Use your username and password instead.',
  google_failed: 'Google sign-in failed. Please try again, or use your username and password.',
  google_unverified: 'That Google account\'s email is not verified. Please use a verified Google account.',
  google_no_account:
    'No staff account is linked to that Google email yet. Contact your administrator to get access, or sign in with your username and password.'
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.68-3.86 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    searchParams.get('error') ? GOOGLE_ERROR_MESSAGES[searchParams.get('error') as string] ?? 'Sign in failed.' : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Sign in failed.');
      router.push(searchParams.get('next') || '/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Sign in failed.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <a
        href="/api/auth/google"
        className="btn-secondary flex w-full items-center justify-center gap-2.5"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="flex items-center gap-3 text-xs text-bmmu-black/40 dark:text-bmmu-cream/40">
        <div className="h-px flex-1 bg-bmmu-black/10 dark:bg-bmmu-cream/10" />
        or sign in with username
        <div className="h-px flex-1 bg-bmmu-black/10 dark:bg-bmmu-cream/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
