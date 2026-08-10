'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AUDIENCE_STORAGE_KEY,
  type WorkbenchAudience,
} from './audience';

function loadAudience(): WorkbenchAudience {
  if (typeof window === 'undefined') {
    return 'user';
  }
  try {
    const raw = window.localStorage.getItem(AUDIENCE_STORAGE_KEY);
    if (raw === 'developer' || raw === 'user') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return 'user';
}

/**
 * Persist Người dùng vs Lập trình. Default = user (avoid overload).
 */
export function useWorkbenchAudience() {
  const [audience, setAudienceState] = useState<WorkbenchAudience>('user');

  useEffect(() => {
    setAudienceState(loadAudience());
  }, []);

  const setAudience = useCallback((next: WorkbenchAudience) => {
    setAudienceState(next);
    try {
      window.localStorage.setItem(AUDIENCE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleAudience = useCallback(() => {
    setAudience(audience === 'user' ? 'developer' : 'user');
  }, [audience, setAudience]);

  return {
    audience,
    isDeveloper: audience === 'developer',
    isUser: audience === 'user',
    setAudience,
    toggleAudience,
  };
}
