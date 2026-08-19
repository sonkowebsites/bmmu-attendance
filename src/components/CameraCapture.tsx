'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  onFileReady: (file: File | null) => void;
};

export default function CameraCapture({ onFileReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'idle' | 'starting' | 'camera'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setError(null);
    setMode('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        // Some mobile browsers need an explicit play() call once metadata is ready,
        // and won't render frames (blank screen) until this resolves.
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });
        await video.play();
      }
      setMode('camera');
    } catch (err) {
      setMode('idle');
      setError('Could not access the camera. Check browser permissions, or upload a file instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMode('idle');
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `attendance-${Date.now()}.jpg`, { type: 'image/jpeg' });
        applyFile(file);
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  }

  function applyFile(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    onFileReady(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  function reset() {
    setPreviewUrl(null);
    onFileReady(null);
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {!previewUrl && mode === 'idle' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={startCamera} className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Use camera
          </button>

          <label className="btn-secondary cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
            Upload scanned copy
            <input type="file" accept="image/*,.pdf" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      )}

      {mode === 'starting' && (
        <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-bmmu-black/10 dark:border-bmmu-cream/10 bg-black/5 dark:bg-white/5 text-sm text-bmmu-black/60 dark:text-bmmu-cream/60">
          Starting camera…
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-bmmu-black/10 dark:border-bmmu-cream/10 bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={capturePhoto} className="btn-primary">
              Capture photo
            </button>
            <button type="button" onClick={stopCamera} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="space-y-3 animate-rise">
          <div className="overflow-hidden rounded-2xl border border-bmmu-black/10 dark:border-bmmu-cream/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Attendance sheet preview" className="max-h-[420px] w-full object-contain bg-black/5" />
          </div>
          <button type="button" onClick={reset} className="btn-secondary">
            Retake / choose another
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
