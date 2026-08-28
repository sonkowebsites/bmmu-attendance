'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteRecordButton({ recordId, programmeName }: { recordId: string; programmeName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        `Delete "${programmeName}"? This permanently removes the record, its images, and the backed-up files in Google Drive. This cannot be undone.`
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({ error: 'Something unexpected happened. Please try again.' }));
      if (!res.ok) throw new Error(data.error ?? 'Could not delete this record.');
      router.push('/records');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Could not delete this record.');
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={loading}
        onClick={remove}
        className="rounded-full border border-red-600/30 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all duration-150 hover:scale-[1.04] hover:bg-red-600/10 active:scale-95 disabled:opacity-60"
      >
        {loading ? 'Deleting…' : 'Delete record'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
