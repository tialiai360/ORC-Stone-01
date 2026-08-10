/**
 * Browser calls same-origin `/orc-api/*` (Next.js rewrite → Nest :3001).
 * Works for localhost and Cloudflare Tunnel without exposing :3001.
 */
export function apiBase(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? '/orc-api';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
}
