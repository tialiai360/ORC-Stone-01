import { DocumentListResponse, DocumentMetadata } from '@orc/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function sessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-session';
  }
  const key = 'orc-uploader-session';
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export async function listDocuments(): Promise<DocumentListResponse> {
  const res = await fetch(`${API_BASE}/documents`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`List failed (${res.status})`);
  }
  return res.json() as Promise<DocumentListResponse>;
}

export async function uploadDocument(file: File): Promise<DocumentMetadata> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: {
      'x-uploader-session': sessionId(),
    },
    body,
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Upload failed (${res.status})`);
  }
  return res.json() as Promise<DocumentMetadata>;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Delete failed (${res.status})`);
  }
}
