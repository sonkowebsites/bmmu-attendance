'use client';

/**
 * Reads a fetch Response as JSON without throwing a confusing
 * "Unexpected end of JSON input" error when the body is empty or cut off
 * (e.g. the request timed out partway through). Always resolves to an
 * object with at least an `error` field to show the user, and `ok`
 * reflecting the HTTP status.
 */
export async function safeJson<T = any>(res: Response): Promise<{ ok: boolean; data: T | { error: string } }> {
  const text = await res.text();
  if (!text) {
    return {
      ok: false,
      data: { error: 'The server took too long to respond. Please check your connection and try again.' } as any
    };
  }
  try {
    return { ok: res.ok, data: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      data: { error: 'Something unexpected happened on the server. Please try again.' } as any
    };
  }
}
