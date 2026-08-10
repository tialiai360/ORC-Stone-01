import { BadRequestException } from '@nestjs/common';
import { KnowledgeExtractionResult } from '@orc/shared';

export function assertValidExtractionForTransform(
  extraction: KnowledgeExtractionResult | null | undefined,
): asserts extraction is KnowledgeExtractionResult {
  if (!extraction) {
    throw new BadRequestException('Extraction result is required for transformation.');
  }
  if (!extraction.id || !extraction.documentId || !extraction.payload) {
    throw new BadRequestException('Extraction result is incomplete.');
  }
}
