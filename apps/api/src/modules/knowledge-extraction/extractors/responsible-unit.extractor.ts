import { allMatches, RULE_CATALOG } from '../rules/rule-catalog';

export function extractResponsibleUnits(text: string): string[] {
  return allMatches(text, RULE_CATALOG.responsibleUnits);
}
