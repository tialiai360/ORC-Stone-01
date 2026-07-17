'use client';

type UploadProgressProps = {
  percent: number;
  filename?: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
};

export function UploadProgress({ percent, filename, status, message }: UploadProgressProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>{filename ?? 'Upload'}</span>
        <span>{status === 'uploading' ? `${percent}%` : status}</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-slate-800">
        <div
          className="h-full bg-sky-400 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      {message ? <p className="mt-2 text-sm text-slate-400">{message}</p> : null}
    </div>
  );
}
