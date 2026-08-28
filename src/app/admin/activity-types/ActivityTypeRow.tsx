'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ActivityTypeRow({ activityType }: { activityType: { id: string; name: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm(`Remove "${activityType.name}" from the list of activity types? Past records keep this name either way.`)) return;
    setLoading(true);
    await fetch(`/api/activity-types/${activityType.id}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  }

  return (
    <li className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-bmmu-black/5 dark:hover:bg-bmmu-cream/5">
      <span className="font-medium">{activityType.name}</span>
      <button disabled={loading} onClick={remove} className="btn-secondary px-3 py-1 text-xs">
        Remove
      </button>
    </li>
  );
}
