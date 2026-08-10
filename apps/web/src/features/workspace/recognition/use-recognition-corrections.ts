'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ObjectInsight } from '../pdf/viewer-types';
import { applyObjectCorrections, objectFingerprint } from './apply-corrections';
import { clearCorrections, loadCorrections, saveCorrections } from './storage';
import type { CorrectionAction, ObjectCorrection } from './types';

/**
 * Human Correction Layer + Progressive Learning (localStorage).
 * Presentation-only — never mutates engine snapshots.
 */
export function useRecognitionCorrections(documentId: string) {
  const [corrections, setCorrections] = useState<ObjectCorrection[]>([]);

  useEffect(() => {
    setCorrections(loadCorrections(documentId));
  }, [documentId]);

  const persist = useCallback(
    (next: ObjectCorrection[]) => {
      setCorrections(next);
      saveCorrections(documentId, next);
    },
    [documentId],
  );

  const upsert = useCallback(
    (partial: {
      object: ObjectInsight & { originalClass?: string };
      action: CorrectionAction;
      class?: string;
    }) => {
      const { object: o, action, class: nextClass } = partial;
      // Fingerprint always from first-seen engine class so progressive match survives reclass.
      const baseClass = o.originalClass || o.class;
      const fingerprint = objectFingerprint(o.pageNumber, baseClass, o.textPreview);
      const entry: ObjectCorrection = {
        fingerprint,
        objectId: o.id,
        pageNumber: o.pageNumber,
        action,
        originalClass: baseClass,
        class: action === 'reclass' ? nextClass : undefined,
        textPreview: o.textPreview,
        updatedAt: new Date().toISOString(),
      };
      persist([
        ...corrections.filter(
          (c) => c.objectId !== o.id && c.fingerprint !== fingerprint,
        ),
        entry,
      ]);
    },
    [corrections, persist],
  );

  const confirmObject = useCallback(
    (o: ObjectInsight) => upsert({ object: o, action: 'confirm' }),
    [upsert],
  );

  const rejectObject = useCallback(
    (o: ObjectInsight) => upsert({ object: o, action: 'reject' }),
    [upsert],
  );

  const reclassObject = useCallback(
    (o: ObjectInsight, nextClass: string) =>
      upsert({ object: o, action: 'reclass', class: nextClass }),
    [upsert],
  );

  const clearObjectCorrection = useCallback(
    (o: ObjectInsight & { originalClass?: string }) => {
      const baseClass = o.originalClass || o.class;
      const fp = objectFingerprint(o.pageNumber, baseClass, o.textPreview);
      persist(corrections.filter((c) => c.objectId !== o.id && c.fingerprint !== fp));
    },
    [corrections, persist],
  );

  const clearAll = useCallback(() => {
    clearCorrections(documentId);
    setCorrections([]);
  }, [documentId]);

  const applyTo = useCallback(
    (objects: ObjectInsight[]) => applyObjectCorrections(objects, corrections),
    [corrections],
  );

  return useMemo(
    () => ({
      corrections,
      correctionCount: corrections.length,
      confirmObject,
      rejectObject,
      reclassObject,
      clearObjectCorrection,
      clearAll,
      applyTo,
    }),
    [
      corrections,
      confirmObject,
      rejectObject,
      reclassObject,
      clearObjectCorrection,
      clearAll,
      applyTo,
    ],
  );
}
