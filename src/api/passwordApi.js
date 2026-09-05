const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function sha1Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * k-Anonymity password check: the password is hashed right here in the
 * browser and never sent anywhere. Only the first 5 hex characters of the
 * hash go to our server, which forwards just that prefix onward — see
 * passwordService.js on the backend for the full explanation. This
 * function then checks locally whether the full hash suffix is among the
 * (many) results that come back for that shared prefix.
 */
export async function checkPasswordExposure(password) {
  const fullHash = await sha1Hex(password);
  const prefix = fullHash.slice(0, 5);
  const suffix = fullHash.slice(5);

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/api/check-password/${prefix}`);
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) throw new ApiError(data?.error || `Server returned status ${res.status}.`, res.status);

  const match = (data.matches || []).find((m) => m.suffix === suffix);
  return match ? { exposed: true, count: match.count } : { exposed: false, count: 0 };
}
