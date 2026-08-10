import type { LayoutKind, PageDiagnostics, PageStructureModel } from './types';

export function buildDiagnostics(
  pageNumber: number,
  model: Omit<PageStructureModel, 'diagnostics'>,
  layout: LayoutKind,
): PageDiagnostics {
  const totalChars = model.items.reduce((n, i) => n + i.text.replace(/\s+/g, '').length, 0);
  const selectableChars = model.blocks
    .filter((b) => b.role !== 'watermark')
    .reduce((n, b) => n + b.text.replace(/\s+/g, '').length, 0);
  // Coverage vs non-invisible items
  const visibleChars = model.items
    .filter((i) => !i.flags?.invisible)
    .reduce((n, i) => n + i.text.replace(/\s+/g, '').length, 0);
  const coverage =
    visibleChars > 0 ? Math.min(100, Math.round((selectableChars / visibleChars) * 1000) / 10) : 0;

  const orphanText = model.items.filter((i) => i.flags?.orphan).length;
  const invisibleText = model.items.filter((i) => i.flags?.invisible).length;
  const watermarks = model.regions.filter((r) => r.kind === 'watermark').length;
  const headers = model.regions.filter((r) => r.kind === 'header').length;
  const footers = model.regions.filter((r) => r.kind === 'footer').length;
  const tables = model.regions.filter((r) => r.kind === 'table').length;
  const signatures = model.regions.filter((r) => r.kind === 'signature').length;

  let readingOrderConfidence: PageDiagnostics['readingOrderConfidence'] = 'HIGH';
  const notes: string[] = [];
  if (orphanText > 5 || coverage < 85) {
    readingOrderConfidence = 'LOW';
    notes.push('High orphan count or low selectable coverage');
  } else if (orphanText > 0 || coverage < 95 || layout === 'mixed') {
    readingOrderConfidence = 'MEDIUM';
    notes.push('Some structure uncertainty');
  }
  if (invisibleText > 0) {
    notes.push(`${invisibleText} invisible/off-viewport text items`);
  }
  if (watermarks > 0) {
    notes.push('Watermarks excluded from reading order');
  }
  if (totalChars === 0) {
    readingOrderConfidence = 'LOW';
    notes.push('No usable text layer');
  }

  return {
    pageNumber,
    textItems: model.items.length,
    lines: model.lines.length,
    paragraphs: model.paragraphs.length,
    tables,
    headers,
    footers,
    watermarks,
    signatures,
    selectionBlocks: model.blocks.length,
    orphanText,
    invisibleText,
    selectableCoverage: coverage,
    readingOrderConfidence,
    layout,
    notes,
  };
}
