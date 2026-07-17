'use client';

import { useCallback, useEffect, useState } from 'react';
import { DocumentMetadata } from '@orc/shared';
import { listDocuments } from './api';
import { DocumentList } from './document-list';
import { UploadComponent } from './upload-component';

export function DocumentImportPage() {
  const [items, setItems] = useState<DocumentMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listDocuments();
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">MVI-001</p>
        <h1 className="text-3xl font-semibold text-slate-50">Document Import</h1>
        <p className="text-slate-400">
          Upload PDF/DOCX, store original, persist metadata. No OCR, AI, extraction, or
          transformation.
        </p>
      </header>

      <UploadComponent onUploaded={() => void refresh()} />

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-slate-100">Imported documents</h2>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <DocumentList items={items} onChanged={() => void refresh()} />
      </div>
    </section>
  );
}
