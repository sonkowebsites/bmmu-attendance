'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Img = { id: string; driveViewLink: string | null };

export default function RecordImages({
  recordId,
  images,
  canDelete
}: {
  recordId: string;
  images: Img[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function removeImage(imageId: string) {
    if (!window.confirm('Remove this image? This also deletes the backed-up file in Google Drive. This cannot be undone.')) return;
    setDeletingId(imageId);
    await fetch(`/api/records/${recordId}/images/${imageId}`, { method: 'DELETE' });
    router.refresh();
    setDeletingId(null);
  }

  if (images.length === 0) {
    return (
      <div className="p-5 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
        This record's images have not finished backing up to Google Drive yet. They're still safe — check the
        activity log below, or ask your admin to confirm the Drive connection.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-3 stagger">
      {images.map((img, i) => (
        <div
          key={img.id}
          className="group relative flex aspect-square items-center justify-center rounded-xl border border-bmmu-black/10 dark:border-bmmu-cream/10 bg-black/5 text-center text-xs dark:bg-white/5"
        >
          {img.driveViewLink ? (
            <a
              href={img.driveViewLink}
              target="_blank"
              rel="noreferrer"
              className="flex h-full w-full items-center justify-center rounded-xl transition-transform duration-150 hover:scale-[1.03]"
            >
              Page {i + 1}
              <br />
              Open in Drive ↗
            </a>
          ) : (
            <span className="text-bmmu-black/50 dark:text-bmmu-cream/50">
              Page {i + 1}
              <br />
              Backing up…
            </span>
          )}

          {canDelete && (
            <button
              onClick={() => removeImage(img.id)}
              disabled={deletingId === img.id}
              aria-label={`Remove page ${i + 1}`}
              className="absolute right-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100 disabled:opacity-70"
            >
              {deletingId === img.id ? '…' : 'Remove'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
