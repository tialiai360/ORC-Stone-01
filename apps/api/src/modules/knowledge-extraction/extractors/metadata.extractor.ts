import { ExtractedDocumentMetadata } from '@orc/shared';
import { RULE_CATALOG, firstMatch } from '../rules/rule-catalog';

function detectDocumentType(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const keyword of RULE_CATALOG.documentTypeKeywords) {
    if (normalized.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

export function extractMetadata(text: string): ExtractedDocumentMetadata {
  return {
    documentNumber: firstMatch(text, RULE_CATALOG.documentNumber),
    documentDate: firstMatch(text, RULE_CATALOG.documentDate),
    documentTitle: firstMatch(text, RULE_CATALOG.documentTitle),
    issuer: firstMatch(text, RULE_CATALOG.issuer),
    documentType: detectDocumentType(text),
    effectiveDate: firstMatch(text, RULE_CATALOG.effectiveDate),
  };
}
