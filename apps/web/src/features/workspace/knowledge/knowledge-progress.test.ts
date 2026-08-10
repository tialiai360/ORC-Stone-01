import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ClassificationAssignment } from '@orc/shared';
import { computeKnowledgeProgress } from './knowledge-progress';

describe('knowledge progress', () => {
  it('reports missing nodes and coverage', () => {
    const assignments: ClassificationAssignment[] = [
      {
        id: '1',
        nodeId: 'don-vi-ban-hanh',
        text: 'Ngân hàng A',
        pageNumber: 1,
        createdAt: new Date().toISOString(),
        source: 'manual',
      },
      {
        id: '2',
        nodeId: 'trich-yeu',
        text: 'V/v test',
        pageNumber: 1,
        createdAt: new Date().toISOString(),
        source: 'auto',
      },
    ];
    const p = computeKnowledgeProgress(assignments);
    assert.equal(p.assignmentCount, 2);
    assert.equal(p.mappedNodes, 2);
    assert.equal(p.manualCount, 1);
    assert.equal(p.autoCount, 1);
    assert.ok(p.missingNodeIds.includes('noi-dung'));
    assert.ok(p.coverageRatio > 0 && p.coverageRatio < 1);
  });
});
