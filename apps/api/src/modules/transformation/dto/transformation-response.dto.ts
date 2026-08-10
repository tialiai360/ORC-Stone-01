import { TransformationResult } from '@orc/shared';

export type TransformationResponseDto = TransformationResult;

export interface TransformationListResponseDto {
  items: TransformationResult[];
  total: number;
}
