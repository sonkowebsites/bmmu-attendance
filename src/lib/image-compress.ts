'use client';

/**
 * Resizes and re-compresses an image file entirely in the browser before it
 * ever leaves the phone. This keeps uploads small (faster on weak wifi) and,
 * combined with per-image upload requests, avoids hitting the hosting
 * platform's per-request size limit.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.75): Promise<File> {
  // Non-image files (e.g. an uploaded PDF) pass through untouched.
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // fall back to the original if decoding fails

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;

  // Only use the compressed version if it's actually smaller.
  if (blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}
