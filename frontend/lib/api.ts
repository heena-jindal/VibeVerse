// lib/api.ts
// Central API helper — all fetch calls go through here
// credentials: 'include' sends the session cookie with every request

// HARDCODED FIX: Directly routing to your Hugging Face backend space
const BASE_URL = 'https://heena033-vibeverse-backend.hf.space';

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