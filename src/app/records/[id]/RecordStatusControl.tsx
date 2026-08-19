'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RecordStatusControl({ recordId, status }: { recordId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(e) => updateStatus(e.target.value)}
      className="input w-auto"
    >
      <option value="SUBMITTED">Submitted</option>
      <option value="VERIFIED">Verified</option>
      <option value="FLAGGED">Flagged</option>
    </select>
  );
}
