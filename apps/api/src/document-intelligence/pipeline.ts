import { randomUUID } from 'node:crypto';
import {
  DilDocumentResult,
  DilTextBlock,
  DIL_VERSION,
} from '@orc/shared';
import { detectSuspicious, evaluateConfidence } from './confidence';
import { findPackSuggestions } from './knowledge-pack';
import { recoverDocumentStructure } from './structure-recovery';
import {
  countPreservedSymbols,
  normalizeVietnameseText,
} from './vietnamese-normalization';

/** Full DIL pipeline — raw preserved separately from normalized. */
export function runDocumentIntelligencePipeline(
  documentId: string,
  rawText: string,
): DilDocumentResult {
  const normalizedText = normalizeVietnameseText(rawText);
  const structure = recoverDocumentStructure(rawText);

  const blocks: DilTextBlock[] = structure.map((draft) => {
    const normalized = normalizeVietnameseText(draft.rawText);
    const { confidence, factors } = evaluateConfidence({
      rawText: draft.rawText,
      normalizedText: normalized,
      structureRole: draft.structureRole,
    });
    const sus = detectSuspicious(draft.rawText, normalized);
    const suggestions = findPackSuggestions(draft.rawText);
    // Lower confidence when suspicious or has suggestions pending review
    const adjusted =
      sus.suspicious || suggestions.length > 0
        ? Math.min(confidence, sus.suspicious ? 88 : 94)
        : confidence;

    return {
      id: randomUUID(),
      index: draft.index,
      rawText: draft.rawText,
      normalizedText: normalized,
      confidence: adjusted,
      factors,
      suspicious: sus.suspicious || suggestions.length > 0,
      suspiciousReasons: sus.reasons,
      suggestions,
      structureRole: draft.structureRole,
    };
  });

  const overallConfidence =
    blocks.length === 0
      ? 0
      : Math.round(blocks.reduce((s, b) => s + b.confidence, 0) / blocks.length);

  return {
    documentId,
    dilVersion: DIL_VERSION,
    createdAt: new Date().toISOString(),
    rawText,
    normalizedText,
    blocks,
    overallConfidence,
    stats: {
      blockCount: blocks.length,
      lowConfidenceCount: blocks.filter((b) => b.confidence < 95).length,
      suspiciousCount: blocks.filter((b) => b.suspicious).length,
      suggestionCount: blocks.reduce((s, b) => s + b.suggestions.length, 0),
      preservedSymbolCount: countPreservedSymbols(rawText),
    },
  };
}
