'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteRecordRowButton({ recordId, programmeName }: { recordId: string; programmeName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete "${programmeName}"? This permanently removes the record, its images, and the backed-up files in Google Drive. This cannot be undone.`
      )
    )
      return;
    setLoading(true);
    await fetch(`/api/records/${recordId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="rounded-full border border-red-600/30 px-2.5 py-1 text-xs font-semibold text-red-600 transition-all duration-150 hover:scale-[1.04] hover:bg-red-600/10 active:scale-95 disabled:opacity-60"
    >
      {loading ? '…' : 'Delete'}
    </button>
  );
}
