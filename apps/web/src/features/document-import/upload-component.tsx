'use client';

import { useState } from 'react';
import { MAX_DOCUMENT_SIZE_BYTES } from '@orc/shared';
import { uploadDocument } from './api';
import { UploadProgress } from './upload-progress';

type UploadComponentProps = {
  onUploaded: () => void;
};

export function UploadComponent({ onUploaded }: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | undefined>();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('Choose a PDF or DOCX file.');
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setStatus('error');
      setMessage('File exceeds 50 MB limit.');
      return;
    }

    setStatus('uploading');
    setPercent(15);
    setMessage('Uploading…');
    try {
      setPercent(55);
      const doc = await uploadDocument(file);
      setPercent(100);
      setStatus('success');
      setMessage(`Imported ${doc.id}`);
      setFile(null);
      onUploaded();
    } catch (error) {
      setStatus('error');
      setPercent(0);
      setMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">PDF or DOCX (max 50 MB)</span>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setStatus('idle');
            setMessage(undefined);
          }}
          className="block w-full text-sm text-slate-200 file:mr-4 file:rounded file:border-0 file:bg-sky-500 file:px-3 file:py-2 file:text-slate-950"
        />
      </label>
      <button
        type="submit"
        className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
        disabled={status === 'uploading'}
      >
        Upload
      </button>
      <UploadProgress
        percent={percent}
        filename={file?.name}
        status={status}
        message={message}
      />
    </form>
  );
}
