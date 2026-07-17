/**
 * Stone-01 shared types — Document Import + Knowledge Extraction + Evidence.
 * No OCR, AI, LLM, transformation, or draft generation.
 */

export * from './knowledge-types/index';

export const PRODUCT_CODE = 'STONE-01' as const;
export const PRODUCT_NAME = 'HO Notice Assistant' as const;

export type HealthStatus = 'ok' | 'degraded';

export interface HealthPayload {
  status: HealthStatus;
  product: typeof PRODUCT_CODE;
  service: string;
}

/** Allowed document extensions for import. */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'docx'] as const;
export type AllowedDocumentExtension = (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number];

/** Maximum upload size in bytes (50 MB). */
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export interface DocumentMetadata {
  id: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  extension: AllowedDocumentExtension;
  storagePath: string;
  uploadedAt: string;
}

export interface DocumentListResponse {
  items: DocumentMetadata[];
  total: number;
}

export type EvidenceType = 'DocumentImported' | 'KnowledgeExtracted';

export interface DocumentImportedEvidence {
  type: 'DocumentImported';
  documentId: string;
  filename: string;
  contentType: string;
  timestamp: string;
  fileSize: number;
  uploaderSession: string;
}

export interface KnowledgeExtractedEvidence {
  type: 'KnowledgeExtracted';
  extractionId: string;
  documentId: string;
  timestamp: string;
  extractionVersion: string;
  ruleVersion: string;
  extractionDurationMs: number;
  extractionCount: number;
}

export type EvidenceRecord =
  | (DocumentImportedEvidence & { id: string })
  | (KnowledgeExtractedEvidence & { id: string });
