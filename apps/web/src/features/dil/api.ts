import { DilDocumentResult, DilCorrectionDecision, KnowledgePackId } from '@orc/shared';
import { apiGet, apiSend } from '../../lib/http';
import { reviewerId } from '../../lib/session-ids';

export async function getDilResult(documentId: string): Promise<DilDocumentResult> {
  return apiGet<DilDocumentResult>(`/dil/${documentId}`, 'Không tải được DIL');
}

export async function runDilAnalyze(
  documentId: string,
  force = false,
): Promise<DilDocumentResult> {
  const q = force ? '?force=1' : '';
  return apiSend<DilDocumentResult>(`/dil/${documentId}${q}`, {
    method: 'POST',
    fallbackError: 'Phân tích DIL thất bại',
  });
}

export async function decideDilCorrection(input: {
  documentId: string;
  blockId: string;
  original: string;
  suggested: string;
  decision: DilCorrectionDecision;
  packId: KnowledgePackId | string;
  packVersion: string;
}): Promise<{ result: DilDocumentResult }> {
  return apiSend<{ result: DilDocumentResult }>(`/dil/${input.documentId}/corrections`, {
    method: 'POST',
    body: {
      ...input,
      reviewer: reviewerId(),
    },
    fallbackError: 'Ghi nhận chỉnh sửa DIL thất bại',
  });
}
