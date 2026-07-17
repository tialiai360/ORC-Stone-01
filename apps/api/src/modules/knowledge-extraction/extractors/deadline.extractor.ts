import { allMatches, RULE_CATALOG } from '../rules/rule-catalog';

export function extractDeadlines(text: string): string[] {
  return allMatches(text, RULE_CATALOG.deadlines);
}
