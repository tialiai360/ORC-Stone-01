/**
 * DIL-001 — Document Intelligence Layer shared types.
 * Deterministic text quality layer — no OCR / AI / LLM.
 */

export const DIL_VERSION = '1.0.0' as const;
export const DIL_PACK_INTERFACE_VERSION = '1.0.0' as const;

export type KnowledgePackId =
  | 'vietnamese-official-documents'
  | 'banking'
  | 'bidv'
  | 'legal-documents'
  | 'government-documents';

/** Interface only — packs may be empty until later waves. */
export interface VietnameseKnowledgePack {
  id: KnowledgePackId;
  name: string;
  version: string;
  /** Verified original → suggested corrections (never auto-applied). */
  corrections: ReadonlyArray<{
    original: string;
    suggested: string;
    note?: string;
  }>;
}

export interface DilTextBlock {
  id: string;
  /** Line/paragraph index in recovered structure. */
  index: number;
  rawText: string;
  normalizedText: string;
  confidence: number;
  factors: {
    characterQuality: number;
    unicodeValidity: number;
    structureValidity: number;
    specialSymbolPreservation: number;
    suspiciousWordRatio: number;
  };
  suspicious: boolean;
  suspiciousReasons: string[];
  suggestions: Array<{
    original: string;
    suggested: string;
    packId: KnowledgePackId;
    packVersion: string;
  }>;
  structureRole?:
    | 'heading'
    | 'article'
    | 'clause'
    | 'list-item'
    | 'table-row'
    | 'paragraph'
    | 'unknown';
}

export interface DilDocumentResult {
  documentId: string;
  dilVersion: typeof DIL_VERSION | string;
  createdAt: string;
  rawText: string;
  normalizedText: string;
  blocks: DilTextBlock[];
  overallConfidence: number;
  stats: {
    blockCount: number;
    lowConfidenceCount: number;
    suspiciousCount: number;
    suggestionCount: number;
    preservedSymbolCount: number;
  };
}

export type DilCorrectionDecision = 'accepted' | 'rejected';

export interface DilTextCorrectedEvidence {
  type: 'DilTextCorrected';
  documentId: string;
  blockId: string;
  original: string;
  suggested: string;
  decision: DilCorrectionDecision;
  reviewer: string;
  timestamp: string;
  packId: KnowledgePackId | string;
  packVersion: string;
}
