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

  async function editName() {
    const newName = window.prompt(`Full name for "${user.username}":`, user.name);
    if (newName === null) return; // cancelled
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      window.alert('Please enter a name with at least 2 characters.');
      return;
    }
    await patch({ name: trimmed });
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

  async function deleteAccount() {
    const confirmed = window.confirm(
      `Permanently delete "${user.username}"? Any records they submitted stay in the archive, but this login will stop existing. This can't be undone.`
    );
    if (!confirmed) return;
    setLoading(true);
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? 'Could not delete this account.');
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-b border-bmmu-black/5 dark:border-bmmu-cream/5">
      <td className="px-4 py-3 font-medium">
        <button
          disabled={loading}
          onClick={editName}
          className="text-left underline decoration-dotted underline-offset-4 transition-opacity hover:opacity-70"
          title="Click to edit name"
        >
          {user.name}
        </button>
      </td>
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
        <button
          disabled={loading}
          onClick={deleteAccount}
          className="rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 transition-all duration-150 hover:bg-red-500/10 hover:scale-105 active:scale-95"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
