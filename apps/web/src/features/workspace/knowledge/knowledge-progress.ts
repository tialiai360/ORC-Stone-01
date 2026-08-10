import { ClassificationAssignment, KNOWLEDGE_NODES } from '@orc/shared';

export type KnowledgeProgress = {
  totalNodes: number;
  mappedNodes: number;
  assignmentCount: number;
  missingNodeIds: string[];
  coverageRatio: number;
  autoCount: number;
  manualCount: number;
};

export function computeKnowledgeProgress(
  assignments: ClassificationAssignment[],
): KnowledgeProgress {
  const mapped = new Set(assignments.map((a) => a.nodeId));
  const missingNodeIds = KNOWLEDGE_NODES.filter((n) => !mapped.has(n.id)).map((n) => n.id);
  const mappedNodes = KNOWLEDGE_NODES.length - missingNodeIds.length;
  const autoCount = assignments.filter((a) => a.source === 'auto').length;
  const manualCount = assignments.length - autoCount;
  return {
    totalNodes: KNOWLEDGE_NODES.length,
    mappedNodes,
    assignmentCount: assignments.length,
    missingNodeIds,
    coverageRatio: KNOWLEDGE_NODES.length === 0 ? 0 : mappedNodes / KNOWLEDGE_NODES.length,
    autoCount,
    manualCount,
  };
}
