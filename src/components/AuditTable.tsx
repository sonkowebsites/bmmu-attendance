type LogRow = {
  id: string;
  action: string;
  details: string | null;
  device: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user: { name: string; username: string } | null;
};

function actionLabel(action: string) {
  return action
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ');
}

export default function AuditTable({ logs }: { logs: LogRow[] }) {
  if (logs.length === 0) {
    return <p className="p-6 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">No activity recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-bmmu-black/10 dark:border-bmmu-cream/10 text-xs uppercase tracking-wide text-bmmu-black/50 dark:text-bmmu-cream/50">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Who</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Details</th>
            <th className="px-4 py-3">Device</th>
            <th className="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-bmmu-black/5 dark:border-bmmu-cream/5">
              <td className="whitespace-nowrap px-4 py-3 text-bmmu-black/70 dark:text-bmmu-cream/70">
                {new Date(log.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium">{log.user?.name ?? 'System'}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="rounded-full bg-bmmu-green/10 px-2.5 py-1 text-xs font-semibold text-bmmu-green dark:text-bmmu-gold">
                  {actionLabel(log.action)}
                </span>
              </td>
              <td className="px-4 py-3 text-bmmu-black/70 dark:text-bmmu-cream/70">{log.details ?? '—'}</td>
              <td className="px-4 py-3 text-bmmu-black/70 dark:text-bmmu-cream/70">{log.device ?? '—'}</td>
              <td className="px-4 py-3 text-bmmu-black/50 dark:text-bmmu-cream/50">{log.ipAddress ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
