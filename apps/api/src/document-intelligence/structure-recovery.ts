import { CLAUSE_MARKER_RE, ROMAN_ARTICLE_RE } from './character-preservation';
import type { DilTextBlock } from '@orc/shared';

export type StructureBlockDraft = {
  index: number;
  rawText: string;
  structureRole: NonNullable<DilTextBlock['structureRole']>;
};

/** Recover coarse document structure from plain text lines. */
export function recoverDocumentStructure(rawText: string): StructureBlockDraft[] {
  const lines = rawText.split(/\n/);
  const blocks: StructureBlockDraft[] = [];
  let index = 0;
  let buffer: string[] = [];

  const flushParagraph = () => {
    const joined = buffer.join('\n').trim();
    buffer = [];
    if (!joined) {
      return;
    }
    blocks.push({
      index: index++,
      rawText: joined,
      structureRole: classifyRole(joined),
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    // Standalone structural lines become their own blocks
    if (
      ROMAN_ARTICLE_RE.test(trimmed) ||
      CLAUSE_MARKER_RE.test(trimmed) ||
      looksLikeTableRow(trimmed) ||
      trimmed.length < 80
    ) {
      flushParagraph();
      blocks.push({
        index: index++,
        rawText: trimmed,
        structureRole: classifyRole(trimmed),
      });
      continue;
    }
    buffer.push(trimmed);
  }
  flushParagraph();
  return blocks;
}

function looksLikeTableRow(line: string): boolean {
  return (line.match(/[│┃|]/g) ?? []).length >= 2 || /\t/.test(line);
}

function classifyRole(text: string): NonNullable<DilTextBlock['structureRole']> {
  if (ROMAN_ARTICLE_RE.test(text) && /^(Điều|Khoản|Mục|Chương|Phần)\b/i.test(text)) {
    return 'article';
  }
  if (CLAUSE_MARKER_RE.test(text)) {
    return 'clause';
  }
  if (looksLikeTableRow(text)) {
    return 'table-row';
  }
  if (text === text.toUpperCase() && text.length > 8 && text.length < 120) {
    return 'heading';
  }
  if (/^[-–—•●▪✓➜→←①②③]/.test(text)) {
    return 'list-item';
  }
  return 'paragraph';
}
