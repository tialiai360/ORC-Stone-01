import { ExtractedAppendix, ExtractedLogicalTable } from '@orc/shared';
import { RULE_CATALOG } from '../rules/rule-catalog';

export function extractAppendices(text: string): ExtractedAppendix[] {
  const items: ExtractedAppendix[] = [];
  const pattern = RULE_CATALOG.appendices[0];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    items.push({
      label: (match[1] ?? match[0]).trim(),
      offset: match.index,
    });
  }
  return items.sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
}

export function extractLogicalTables(text: string): ExtractedLogicalTable[] {
  const rows: Array<{ line: string; index: number }> = [];
  const pattern = RULE_CATALOG.logicalTableRow;
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    rows.push({ line: match[0].trim(), index: match.index });
  }
  if (rows.length === 0) {
    return [];
  }

  const tables: ExtractedLogicalTable[] = [];
  let current: ExtractedLogicalTable = {
    rows: [rows[0].line],
    startOffset: rows[0].index,
  };

  for (let i = 1; i < rows.length; i += 1) {
    const prevEnd = rows[i - 1].index + rows[i - 1].line.length;
    if (rows[i].index - prevEnd <= 1) {
      current.rows.push(rows[i].line);
    } else {
      tables.push(current);
      current = { rows: [rows[i].line], startOffset: rows[i].index };
    }
  }
  tables.push(current);
  return tables;
}
