import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DilCorrectionDecision,
  DilDocumentResult,
  DilTextCorrectedEvidence,
  KnowledgePackId,
} from '@orc/shared';
import { DocumentImportService } from '../modules/document-import/document-import.service';
import { LocalFileStorageService } from '../modules/document-import/storage/local-file-storage.service';
import { EvidenceService } from '../modules/evidence/evidence.service';
import { extractPlainText } from '../modules/knowledge-extraction/extractors/text-reader';
import { listKnowledgePacks } from './knowledge-pack';
import { runDocumentIntelligencePipeline } from './pipeline';
import { DilStoreService } from './dil-store.service';

@Injectable()
export class DocumentIntelligenceService {
  constructor(
    private readonly documents: DocumentImportService,
    private readonly storage: LocalFileStorageService,
    private readonly store: DilStoreService,
    private readonly evidence: EvidenceService,
  ) {}

  async analyze(documentId: string, force = false): Promise<DilDocumentResult> {
    const doc = await this.documents.getDocument(documentId);
    if (!force) {
      const existing = await this.store.read(documentId);
      if (existing) {
        return existing;
      }
    }
    const buffer = await this.storage.readOriginal(doc.storagePath);
    const rawText = await extractPlainText(buffer, doc.extension);
    const result = runDocumentIntelligencePipeline(documentId, rawText);
    return this.store.write(result);
  }

  async get(documentId: string): Promise<DilDocumentResult> {
    await this.documents.getDocument(documentId);
    const existing = await this.store.read(documentId);
    if (existing) {
      return existing;
    }
    return this.analyze(documentId);
  }

  listPacks() {
    return listKnowledgePacks();
  }

  async decideCorrection(input: {
    documentId: string;
    blockId: string;
    original: string;
    suggested: string;
    decision: DilCorrectionDecision;
    reviewer: string;
    packId: KnowledgePackId | string;
    packVersion: string;
  }): Promise<{
    evidence: DilTextCorrectedEvidence;
    result: DilDocumentResult;
  }> {
    const result = await this.get(input.documentId);
    const block = result.blocks.find((b) => b.id === input.blockId);
    if (!block) {
      throw new NotFoundException(`Block ${input.blockId} not found.`);
    }

    const evidence = await this.evidence.recordDilTextCorrected({
      documentId: input.documentId,
      blockId: input.blockId,
      original: input.original,
      suggested: input.suggested,
      decision: input.decision,
      reviewer: input.reviewer,
      packId: input.packId,
      packVersion: input.packVersion,
    });

    if (input.decision === 'accepted') {
      // Apply only on normalized text of this block — never overwrite rawText.
      block.normalizedText = block.normalizedText.split(input.original).join(input.suggested);
      block.suggestions = block.suggestions.filter(
        (s) => !(s.original === input.original && s.suggested === input.suggested),
      );
      block.suspiciousReasons = block.suspiciousReasons.filter(
        (r) => r !== input.original,
      );
      block.suspicious = block.suspiciousReasons.length > 0 || block.suggestions.length > 0;
      block.confidence = Math.min(100, block.confidence + 5);
      result.normalizedText = result.blocks.map((b) => b.normalizedText).join('\n');
      result.stats.suggestionCount = result.blocks.reduce(
        (s, b) => s + b.suggestions.length,
        0,
      );
      result.stats.suspiciousCount = result.blocks.filter((b) => b.suspicious).length;
      result.stats.lowConfidenceCount = result.blocks.filter((b) => b.confidence < 95).length;
      await this.store.write(result);
    } else {
      block.suggestions = block.suggestions.filter(
        (s) => !(s.original === input.original && s.suggested === input.suggested),
      );
      block.suspicious = block.suspiciousReasons.length > 0 || block.suggestions.length > 0;
      result.stats.suggestionCount = result.blocks.reduce(
        (s, b) => s + b.suggestions.length,
        0,
      );
      result.stats.suspiciousCount = result.blocks.filter((b) => b.suspicious).length;
      await this.store.write(result);
    }

    if (evidence.type !== 'DilTextCorrected') {
      throw new Error('Unexpected evidence type');
    }
    return { evidence, result };
  }
}
