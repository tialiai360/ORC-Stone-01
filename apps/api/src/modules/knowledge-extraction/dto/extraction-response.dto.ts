import { KnowledgeExtractionResult } from '@orc/shared';

export type ExtractionResponseDto = KnowledgeExtractionResult;

export interface ExtractionListResponseDto {
  items: KnowledgeExtractionResult[];
  total: number;
}
