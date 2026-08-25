'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewCentreForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/centres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json().catch(() => ({ error: 'Something unexpected happened. Please try again.' }));
      if (!res.ok) throw new Error(data.error ?? 'Could not add that centre.');
      setName('');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Could not add that centre.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Mbale"
        required
        className="input max-w-xs"
      />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Adding…' : 'Add centre'}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
