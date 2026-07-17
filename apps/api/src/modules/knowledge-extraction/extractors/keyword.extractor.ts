import { allMatches, RULE_CATALOG } from '../rules/rule-catalog';

export function extractDepartments(text: string): string[] {
  return allMatches(text, RULE_CATALOG.departments);
}

export function extractActionStatements(text: string): string[] {
  return allMatches(text, RULE_CATALOG.actionStatements, 0);
}

export function extractPriorityIndicators(text: string): string[] {
  return allMatches(text, RULE_CATALOG.priorityIndicators, 0);
}
