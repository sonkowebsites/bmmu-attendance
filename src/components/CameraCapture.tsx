'use client';

import { useEffect, useRef, useState } from 'react';

type Shot = { id: string; file: File; previewUrl: string };

type Props = {
  onFilesChange: (files: File[]) => void;
};

export default function CameraCapture({ onFilesChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the stream only once the <video> element actually exists in the
  // DOM. Doing this any earlier is what caused a black screen - the element
  // wasn't mounted yet, so srcObject was silently dropped. We also wait for
  // the 'playing' event (real decoded frames), not just 'loadedmetadata'
  // (which can fire before there's anything visible to paint yet).
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    setVideoReady(false);

    const markReady = () => setVideoReady(true);
    const tryPlay = () => video.play().catch(() => {});

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('playing', markReady);
    tryPlay();

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('playing', markReady);
    };
  }, [stream]);

  async function startCamera() {
    setError(null);
    setCameraOpen(true); // mount the <video> element first
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = newStream;
      setStream(newStream);
    } catch (err) {
      setCameraOpen(false);
      setError('Could not access the camera. Check browser permissions, or upload a file instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setVideoReady(false);
    setCameraOpen(false);
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
        addShots([file]);
      },
      'image/jpeg',
      0.92
    );
  }

  function addShots(files: File[]) {
    setShots((prev) => {
      const next = [
        ...prev,
        ...files.map((file) => ({ id: `${Date.now()}-${Math.random()}`, file, previewUrl: URL.createObjectURL(file) }))
      ];
      onFilesChange(next.map((s) => s.file));
      return next;
    });
  }

  function removeShot(id: string) {
    setShots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      onFilesChange(next.map((s) => s.file));
      return next;
    });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addShots(files);
    e.target.value = ''; // allow re-selecting the same file(s) again if needed
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={cameraOpen ? stopCamera : startCamera} className="btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
          {cameraOpen ? 'Close camera' : 'Use camera'}
        </button>

        <label className="btn-secondary cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          Upload scanned copies
          <input type="file" accept="image/*,.pdf" multiple onChange={handleFileInput} className="hidden" />
        </label>
      </div>

      {cameraOpen && (
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
            {!videoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                Starting camera…
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={capturePhoto} disabled={!videoReady} className="btn-primary">
              Capture photo {shots.length > 0 && `(${shots.length} taken)`}
            </button>
            <button type="button" onClick={stopCamera} className="btn-secondary">
              Done
            </button>
          </div>
          <p className="text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">
            The camera stays open so you can capture several pages in a row — tap "Capture photo" for each one, then "Done".
          </p>
        </div>
      )}

      {shots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 stagger">
          {shots.map((shot) => (
            <div key={shot.id} className="group relative aspect-square overflow-hidden rounded-xl border border-bmmu-black/10 dark:border-bmmu-cream/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.previewUrl} alt="Captured attendance sheet page" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeShot(shot.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white transition-transform duration-150 hover:scale-110"
                aria-label="Remove this image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {shots.length === 0 && !cameraOpen && (
        <p className="text-xs text-bmmu-black/50 dark:text-bmmu-cream/50">
          You can add more than one page — capture or upload as many as this record needs.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
