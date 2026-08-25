'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'STAFF' });
  const [centres, setCentres] = useState<string[]>([]);
  const [availableCentres, setAvailableCentres] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/centres')
      .then((res) => res.json())
      .then((data) => setAvailableCentres((data.centres ?? []).map((c: { name: string }) => c.name)))
      .catch(() => setAvailableCentres([]));
  }, []);

  function toggleCentre(c: string) {
    setCentres((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, centres })
      });
      const data = await res.json().catch(() => ({ error: 'Something unexpected happened. Please try again.' }));
      if (!res.ok) throw new Error(data.error ?? 'Could not create the account.');
      setSuccess(`Account "${form.username}" created.`);
      setForm({ name: '', username: '', email: '', password: '', role: 'STAFF' });
      setCentres([]);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Could not create the account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Username</label>
          <input required className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div>
          <label className="label">Email (optional)</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input required minLength={8} type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Restrict to centres (leave blank for all centres)</label>
        <div className="flex flex-wrap gap-2">
          {availableCentres.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggleCentre(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95 ${
                centres.includes(c)
                  ? 'border-bmmu-green bg-bmmu-green text-white'
                  : 'border-bmmu-black/15 dark:border-bmmu-cream/20'
              }`}
            >
              {c}
            </button>
          ))}
          {availableCentres.length === 0 && (
            <p className="text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">
              No centres set up yet — add some on the Centres page first.
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-bmmu-green dark:text-bmmu-gold">{success}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
}
