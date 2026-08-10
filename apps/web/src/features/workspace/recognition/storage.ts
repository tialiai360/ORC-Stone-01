import type { ObjectCorrection } from './types';

const PREFIX = 'orc.recognition.corrections.v1:';

function key(documentId: string): string {
  return `${PREFIX}${documentId}`;
}

export function loadCorrections(documentId: string): ObjectCorrection[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key(documentId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (c): c is ObjectCorrection =>
        Boolean(c) &&
        typeof c === 'object' &&
        typeof (c as ObjectCorrection).fingerprint === 'string' &&
        typeof (c as ObjectCorrection).objectId === 'string' &&
        typeof (c as ObjectCorrection).action === 'string',
    );
  } catch {
    return [];
  }
}

export function saveCorrections(documentId: string, corrections: ObjectCorrection[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key(documentId), JSON.stringify(corrections));
  } catch {
    // quota / private mode — progressive learning best-effort
  }
}

export function clearCorrections(documentId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key(documentId));
  } catch {
    // ignore
  }
}
