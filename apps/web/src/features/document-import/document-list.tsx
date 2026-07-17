'use client';

import { DocumentMetadata } from '@orc/shared';
import { deleteDocument } from './api';

type DocumentListProps = {
  items: DocumentMetadata[];
  onChanged: () => void;
};

export function DocumentList({ items, onChanged }: DocumentListProps) {
  async function onDelete(id: string) {
    await deleteDocument(id);
    onChanged();
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">No documents imported yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
      {items.map((doc) => (
        <li key={doc.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-100">{doc.originalFilename}</p>
            <p className="text-xs text-slate-400">
              {doc.id} · {doc.contentType} · {doc.sizeBytes} bytes · {doc.uploadedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onDelete(doc.id)}
            className="shrink-0 rounded border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
