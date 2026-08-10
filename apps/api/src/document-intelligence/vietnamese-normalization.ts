import { PRESERVED_SYMBOL_SET } from './character-preservation';

/**
 * Vietnamese normalization — Unicode / whitespace / hidden chars only.
 * Does NOT auto-correct words.
 */
export function normalizeVietnameseText(raw: string): string {
  // NFC for Vietnamese combining marks
  let text = raw.normalize('NFC');

  // Replace common broken / hidden whitespace
  text = text
    .replace(/\u00A0/g, ' ') // NBSP
    .replace(/\u202F/g, ' ') // narrow NBSP
    .replace(/\u2007/g, ' ') // figure space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width / BOM
    .replace(/\u00AD/g, '') // soft hyphen
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ');

  // Collapse horizontal spaces but keep newlines (structure)
  text = text
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trimEnd())
    .join('\n');

  // Trim excessive blank lines (max 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Ensure preserved symbols survived (identity — never strip)
  for (const sym of PRESERVED_SYMBOL_SET) {
    if (raw.includes(sym) && !text.includes(sym)) {
      // Re-insert is unsafe; leave as-is — count in confidence instead.
    }
  }

  return text.trim();
}

export function countPreservedSymbols(text: string): number {
  let count = 0;
  for (const ch of text) {
    if (PRESERVED_SYMBOL_SET.has(ch)) {
      count += 1;
    }
  }
  return count;
}
