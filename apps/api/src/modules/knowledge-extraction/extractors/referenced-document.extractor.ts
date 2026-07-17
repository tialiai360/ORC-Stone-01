import { allMatches, RULE_CATALOG } from '../rules/rule-catalog';

export function extractReferencedDocuments(text: string): string[] {
  return allMatches(text, RULE_CATALOG.referencedDocuments);
}
