import {
  ClassificationAssignment,
  ClassificationSession,
  DocumentMetadata,
  StructureCorrectedEvidence,
} from '@orc/shared';
import { apiGet, apiSend, apiUrl } from '../../lib/http';

export { reviewerId } from '../../lib/session-ids';

export async function getDocument(id: string): Promise<DocumentMetadata> {
  return apiGet<DocumentMetadata>(`/documents/${id}`, 'Không tải được tài liệu');
}

export function documentFileUrl(id: string): string {
  return apiUrl(`/documents/${id}/file`);
}

export async function getClassificationSession(
  documentId: string,
): Promise<ClassificationSession> {
  return apiGet<ClassificationSession>(
    `/classification/${documentId}`,
    'Không tải được phiên phân loại',
  );
}

export type SaveSessionResult = {
  session: ClassificationSession;
  evidence: StructureCorrectedEvidence[];
};

export async function saveClassificationSession(
  documentId: string,
  input: {
    assignments: ClassificationAssignment[];
    reviewer: string;
    corrections: Array<{
      nodeId: string;
      before: string | null;
      after: string | null;
      originalClassification?: string | null;
      newClassification?: string | null;
      reason?: string | null;
    }>;
  },
): Promise<SaveSessionResult> {
  return apiSend<SaveSessionResult>(`/classification/${documentId}`, {
    method: 'PUT',
    body: input,
    fallbackError: 'Lưu thất bại',
  });
}

export async function listStructureEvidence(
  documentId: string,
): Promise<StructureCorrectedEvidence[]> {
  return apiGet<StructureCorrectedEvidence[]>(
    `/classification/${documentId}/evidence`,
    'Không tải được bằng chứng',
  );
}
