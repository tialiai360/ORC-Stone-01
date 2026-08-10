import { ClassificationAssignment } from '@orc/shared';

export type AssignmentCorrection = {
  nodeId: string;
  before: string | null;
  after: string | null;
  originalClassification?: string | null;
  newClassification?: string | null;
  reason?: string | null;
};

export function cloneAssignments(
  list: ClassificationAssignment[],
): ClassificationAssignment[] {
  return list.map((a) => ({ ...a }));
}

function nodeTextBlob(list: ClassificationAssignment[], nodeId: string): string | null {
  const texts = list.filter((a) => a.nodeId === nodeId).map((a) => a.text);
  return texts.length === 0 ? null : texts.join('\n---\n');
}

/** Diff assignment blobs per knowledge node for StructureCorrected evidence. */
export function diffCorrections(
  before: ClassificationAssignment[],
  after: ClassificationAssignment[],
): AssignmentCorrection[] {
  const nodeIds = new Set([...before.map((a) => a.nodeId), ...after.map((a) => a.nodeId)]);
  const out: AssignmentCorrection[] = [];
  for (const nodeId of nodeIds) {
    const bList = before.filter((a) => a.nodeId === nodeId);
    const a = nodeTextBlob(after, nodeId);
    const b = nodeTextBlob(before, nodeId);
    if (b !== a) {
      const orig =
        bList.find((x) => x.source === 'auto')?.nodeId ?? (bList[0] ? nodeId : null);
      out.push({
        nodeId,
        before: b,
        after: a,
        originalClassification: orig,
        newClassification: nodeId,
        reason: null,
      });
    }
  }
  return out;
}
