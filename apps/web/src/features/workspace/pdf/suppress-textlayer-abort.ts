/**
 * react-pdf logs AbortException via `warning()` whenever a TextLayer task is
 * cancelled (page change, scale, unmount). Handlers cannot silence that log.
 * Filter only this known benign noise while PdfViewer is mounted.
 */

function isTextLayerAbortNoise(args: unknown[]): boolean {
  const text = args
    .map((a) => {
      if (typeof a === 'string') {
        return a;
      }
      if (a && typeof a === 'object' && 'message' in a) {
        return String((a as { message: unknown }).message);
      }
      return String(a ?? '');
    })
    .join(' ');
  return (
    /AbortException/i.test(text) &&
    (/TextLayer task cancelled/i.test(text) || /Rendering cancelled/i.test(text))
  );
}

export function installTextLayerAbortFilter(): () => void {
  if (typeof console === 'undefined') {
    return () => undefined;
  }
  const origError = console.error.bind(console);
  const origWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    if (isTextLayerAbortNoise(args)) {
      return;
    }
    origError(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (isTextLayerAbortNoise(args)) {
      return;
    }
    origWarn(...args);
  };

  return () => {
    console.error = origError;
    console.warn = origWarn;
  };
}
