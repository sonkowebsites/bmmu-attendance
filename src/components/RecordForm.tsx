'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CameraCapture from './CameraCapture';
import { safeJson } from '@/lib/safe-json';

export default function RecordForm({
  centreOptions,
  activityTypeOptions
}: {
  centreOptions: string[];
  activityTypeOptions: string[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError('Please capture a photo or upload at least one scanned attendance sheet before saving.');
      return;
    }

    const form = e.currentTarget;
    const raw = new FormData(form);
    const metadata = {
      programmeName: String(raw.get('programmeName') ?? '').trim(),
      centre: String(raw.get('centre') ?? '').trim(),
      activityType: String(raw.get('activityType') ?? '').trim(),
      eventDate: String(raw.get('eventDate') ?? ''),
      sheikhName: String(raw.get('sheikhName') ?? '').trim(),
      facilitatorName: String(raw.get('facilitatorName') ?? '').trim(),
      numberOfAttendees: String(raw.get('numberOfAttendees') ?? ''),
      notes: String(raw.get('notes') ?? '').trim()
    };

    setSubmitting(true);
    setProgress({ done: 0, total: files.length });

    try {
      // 1) Create the record itself (fast - metadata only, no images yet).
      const createRes = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata)
      });
      const { ok: createOk, data: created } = await safeJson<{ id: string }>(createRes);
      if (!createOk || !('id' in created)) {
        throw new Error('error' in created ? created.error : 'Something went wrong while saving the record.');
      }

      // 2) Upload each image as its own small request - keeps every request
      // well under the hosting platform's size limit, no matter how many
      // photos were captured, and one failure doesn't lose the others.
      let failures = 0;
      for (let i = 0; i < files.length; i++) {
        try {
          const imgForm = new FormData();
          imgForm.append('image', files[i]);
          imgForm.append('order', String(i));
          const res = await fetch(`/api/records/${created.id}/images`, { method: 'POST', body: imgForm });
          if (!res.ok) failures++;
        } catch {
          // A network hiccup on one image shouldn't stop the rest from trying.
          failures++;
        }
        setProgress({ done: i + 1, total: files.length });
      }

      if (failures > 0) {
        setError(
          `Saved, but ${failures} of ${files.length} image${files.length === 1 ? '' : 's'} failed to back up to Drive. Open the record to check, and re-add any missing pages if needed.`
        );
      }

      router.push(`/records/${created.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 stagger">
      <section className="card p-5">
        <h2 className="eyebrow mb-4">1. Attendance sheet(s)</h2>
        <CameraCapture onFilesChange={setFiles} />
      </section>

      <section className="card space-y-5 p-5">
        <h2 className="eyebrow">2. Programme details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="programmeName">Programme / event name *</label>
            <input id="programmeName" name="programmeName" required className="input" placeholder="e.g. Friday Majlis" />
          </div>

          <div>
            <label className="label" htmlFor="centre">Centre *</label>
            <select id="centre" name="centre" required className="input">
              <option value="">Select a centre</option>
              {centreOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="activityType">Type of activity *</label>
            <select id="activityType" name="activityType" required className="input">
              <option value="">Select a type</option>
              {activityTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="eventDate">Date of programme *</label>
            <input id="eventDate" name="eventDate" type="date" required className="input" />
          </div>

          <div>
            <label className="label" htmlFor="sheikhName">Sheikh / officiant name</label>
            <input id="sheikhName" name="sheikhName" className="input" placeholder="e.g. Sheikh ..." />
          </div>

          <div>
            <label className="label" htmlFor="facilitatorName">Recorded / verified by</label>
            <input id="facilitatorName" name="facilitatorName" className="input" placeholder="Name of person who filled the sheet" />
          </div>

          <div>
            <label className="label" htmlFor="numberOfAttendees">Number of attendees</label>
            <input id="numberOfAttendees" name="numberOfAttendees" type="number" min={0} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" rows={3} className="input" placeholder="Anything else worth recording about this session" />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
        {submitting
          ? progress
            ? `Saving… (${progress.done}/${progress.total} images)`
            : 'Saving…'
          : 'Save attendance record'}
      </button>
    </form>
  );
}
