/**
 * Characters / markers that must never be discarded by normalization.
 * DIL-001 character preservation catalog.
 */
export const PRESERVED_SYMBOLS = [
  '•',
  '●',
  '▪',
  '✓',
  '➜',
  '→',
  '←',
  '①',
  '②',
  '③',
  '④',
  '⑤',
  '⑥',
  '⑦',
  '⑧',
  '⑨',
  '⑩',
  '│',
  '┃',
  '─',
  '━',
  '┌',
  '┐',
  '└',
  '┘',
  '├',
  '┤',
  '┬',
  '┴',
  '┼',
  '║',
  '═',
  '※',
  '§',
  '¶',
] as const;

export const PRESERVED_SYMBOL_SET = new Set<string>(PRESERVED_SYMBOLS);

export const ROMAN_ARTICLE_RE =
  /^(?:Mục|Điều|Khoản|Điểm|Chương|Phần|I{1,3}|IV|VI{0,3}|IX|X{0,3})\b/i;

export const CLAUSE_MARKER_RE = /^(?:[a-z]\)|\d+[.)]|[-–—•●▪✓➜→←]|[①②③④⑤⑥⑦⑧⑨⑩])\s+/;
