'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CameraCapture from './CameraCapture';

const ACTIVITY_TYPES = [
  'Sheikh Attendance Verification',
  'Majlis / Religious Gathering',
  'Shuyuk Seminar',
  'Elder Members Assembly',
  'Friday Prayers',
  'Qurbani / Distribution',
  'Sports Event',
  'Other'
];

export default function RecordForm({ centreOptions }: { centreOptions: string[] }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError('Please capture a photo or upload at least one scanned attendance sheet before saving.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.delete('images');
    files.forEach((file) => formData.append('images', file));

    setSubmitting(true);
    try {
      const res = await fetch('/api/records', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong while saving the record.');
      router.push(`/records/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
      setSubmitting(false);
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
              {ACTIVITY_TYPES.map((t) => (
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
        {submitting ? 'Saving…' : 'Save attendance record'}
      </button>
    </form>
  );
}
