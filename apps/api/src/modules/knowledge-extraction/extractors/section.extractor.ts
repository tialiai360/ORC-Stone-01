import { ExtractedSection } from '@orc/shared';
import { RULE_CATALOG } from '../rules/rule-catalog';

export function extractSections(text: string): ExtractedSection[] {
  const matches: Array<{ heading: string; index: number }> = [];
  RULE_CATALOG.numberedHeading.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RULE_CATALOG.numberedHeading.exec(text)) !== null) {
    matches.push({ heading: match[1].trim(), index: match.index });
  }

  const sections: ExtractedSection[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).replace(matches[i].heading, '').trim();
    sections.push({
      heading: matches[i].heading,
      startOffset: start,
      endOffset: end,
      body,
    });
  }
  return sections;
}
