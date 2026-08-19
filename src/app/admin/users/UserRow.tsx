'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type U = { id: string; name: string; username: string; role: string; centres: string[]; active: boolean };

export default function UserRow({ user }: { user: U }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(body: object) {
    setLoading(true);
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    router.refresh();
    setLoading(false);
  }

  async function resetPassword() {
    const newPassword = window.prompt(`New temporary password for ${user.username} (min 8 characters):`);
    if (!newPassword) return;
    if (newPassword.length < 8) {
      window.alert('Password must be at least 8 characters.');
      return;
    }
    await patch({ newPassword });
    window.alert('Password reset. Share the new password with the staff member securely.');
  }

  return (
    <tr className="border-b border-bmmu-black/5 dark:border-bmmu-cream/5">
      <td className="px-4 py-3 font-medium">{user.name}</td>
      <td className="px-4 py-3">{user.username}</td>
      <td className="px-4 py-3">
        <select
          disabled={loading}
          value={user.role}
          onChange={(e) => patch({ role: e.target.value })}
          className="input w-auto py-1.5 text-xs"
        >
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </td>
      <td className="px-4 py-3 text-xs text-bmmu-black/60 dark:text-bmmu-cream/60">
        {user.centres.length > 0 ? user.centres.join(', ') : 'All centres'}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? 'bg-bmmu-green/10 text-bmmu-green dark:text-bmmu-gold' : 'bg-red-500/10 text-red-600'}`}>
          {user.active ? 'Active' : 'Deactivated'}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
        <button disabled={loading} onClick={resetPassword} className="btn-secondary px-3 py-1 text-xs">
          Reset password
        </button>
        <button
          disabled={loading}
          onClick={() => patch({ active: !user.active })}
          className="btn-secondary px-3 py-1 text-xs"
        >
          {user.active ? 'Deactivate' : 'Reactivate'}
        </button>
      </td>
    </tr>
  );
}
