import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EXTRACTION_VERSION,
  KnowledgeExtractionResult,
  RULE_VERSION,
} from '@orc/shared';
import { DocumentImportService } from '../document-import/document-import.service';
import { LocalFileStorageService } from '../document-import/storage/local-file-storage.service';
import { EvidenceService } from '../evidence/evidence.service';
import { runDeterministicExtraction } from './extractors/pipeline';
import { extractPlainText } from './extractors/text-reader';
import { ExtractionRepository } from './repository/extraction.repository';
import { assertExtractableExtension } from './validation/extraction.validation';

export const EXTRACTION_REPOSITORY = Symbol('EXTRACTION_REPOSITORY');

@Injectable()
export class KnowledgeExtractionService {
  constructor(
    private readonly documents: DocumentImportService,
    private readonly storage: LocalFileStorageService,
    @Inject(EXTRACTION_REPOSITORY)
    private readonly extractions: ExtractionRepository,
    private readonly evidence: EvidenceService,
  ) {}

  async extractForDocument(documentId: string): Promise<KnowledgeExtractionResult> {
    const started = Date.now();
    const document = await this.documents.getDocument(documentId);
    const extension = assertExtractableExtension(document.extension);
    const buffer = await this.storage.readOriginal(document.storagePath);
    const text = await extractPlainText(buffer, extension);
    const { payload, extractionCount } = runDeterministicExtraction(text);

    const createdAt = new Date();
    const result: KnowledgeExtractionResult = {
      id: randomUUID(),
      documentId: document.id,
      extractionVersion: EXTRACTION_VERSION,
      ruleVersion: RULE_VERSION,
      createdAt: createdAt.toISOString(),
      payload,
      extractionCount,
    };

    const saved = await this.extractions.save(result);
    await this.evidence.recordKnowledgeExtracted({
      extractionId: saved.id,
      documentId: saved.documentId,
      extractionVersion: saved.extractionVersion,
      ruleVersion: saved.ruleVersion,
      extractionDurationMs: Math.max(0, Date.now() - started),
      extractionCount: saved.extractionCount,
      timestamp: createdAt,
    });
    return saved;
  }

  async getById(id: string): Promise<KnowledgeExtractionResult> {
    const row = await this.extractions.findById(id);
    if (!row) {
      throw new NotFoundException(`Extraction ${id} not found.`);
    }
    return row;
  }

  async listByDocument(documentId: string): Promise<{
    items: KnowledgeExtractionResult[];
    total: number;
  }> {
    await this.documents.getDocument(documentId);
    const items = await this.extractions.findByDocumentId(documentId);
    return { items, total: items.length };
  }
}
