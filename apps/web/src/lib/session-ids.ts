/** Stable local identities for Evidence / upload headers (browser only). */

export function reviewerId(): string {
  if (typeof window === 'undefined') {
    return 'nguoi-duyet';
  }
  const key = 'orc-reviewer';
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = `nguoi-duyet-${crypto.randomUUID().slice(0, 8)}`;
  window.localStorage.setItem(key, created);
  return created;
}

export function uploaderSessionId(): string {
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
