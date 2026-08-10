'use client';

type ReviewExportButtonProps = {
  exporting: boolean;
  onExport: () => void;
};

export function ReviewExportButton({ exporting, onExport }: ReviewExportButtonProps) {
  return (
    <button
      type="button"
      className="orc-btn"
      disabled={exporting}
      onClick={onExport}
    >
      {exporting ? 'Đang xuất…' : 'Xuất gói Review'}
    </button>
  );
}
