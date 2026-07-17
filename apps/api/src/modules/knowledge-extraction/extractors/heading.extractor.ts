import { RULE_CATALOG, uniqueSorted } from '../rules/rule-catalog';

export function extractHeadings(text: string): string[] {
  const headings: string[] = [];
  RULE_CATALOG.headingLine.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RULE_CATALOG.headingLine.exec(text)) !== null) {
    headings.push(match[0].trim());
  }
  return uniqueSorted(headings);
}
