// lib/api.ts
// Central API helper — all fetch calls go through here
// credentials: 'include' sends the session cookie with every request

// Fallback dynamically to localhost if the environment variable isn't active
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',   // ← this is the key fix
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  return res
}