import { apiBase } from './api-base';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Json = Record<string, unknown> | unknown[] | null;

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const payload = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  if (!payload?.message) {
    return `${fallback} (${res.status})`;
  }
  return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
}

function url(path: string): string {
  const base = apiBase().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/** GET JSON — consistent cache/error handling. */
export async function apiGet<T>(path: string, fallbackError: string): Promise<T> {
  const res = await fetch(url(path), { cache: 'no-store' });
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res, fallbackError), res.status);
  }
  return res.json() as Promise<T>;
}

/** JSON body request (POST/PUT/PATCH/DELETE). */
export async function apiSend<T>(
  path: string,
  init: {
    method: string;
    body?: Json;
    headers?: Record<string, string>;
    fallbackError: string;
  },
): Promise<T> {
  const headers: Record<string, string> = { ...init.headers };
  let body: string | undefined;
  if (init.body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    body = JSON.stringify(init.body);
  }
  const res = await fetch(url(path), {
    method: init.method,
    headers,
    body,
  });
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res, init.fallbackError), res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

/** multipart / binary body — do not set Content-Type (browser sets boundary). */
export async function apiUpload<T>(
  path: string,
  init: {
    method?: string;
    body: FormData | Blob;
    headers?: Record<string, string>;
    fallbackError: string;
  },
): Promise<T> {
  const res = await fetch(url(path), {
    method: init.method ?? 'POST',
    headers: init.headers,
    body: init.body,
  });
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res, init.fallbackError), res.status);
  }
  return res.json() as Promise<T>;
}

export function apiUrl(path: string): string {
  return url(path);
}
