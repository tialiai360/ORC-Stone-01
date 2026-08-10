import { TRANSFORM_RULE_VERSION } from '@orc/shared';

/** Deterministic transform rule catalog — single SoT. No inference. */
export const TRANSFORM_RULES = {
  version: TRANSFORM_RULE_VERSION,
  /** Intent maps from KE title (subject signal) as-is. */
  intentEvidencePath: 'ke:payload.metadata.documentTitle',
  intentRuleId: 'TR-INTENT-01',
  /** Actions map 1:1 from KE action statements. */
  actionEvidencePath: 'ke:payload.actionStatements',
  actionRuleId: 'TR-ACTION-01',
  responsibleEvidencePath: 'ke:payload.responsibleUnits',
  responsibleRuleId: 'TR-RESP-01',
  /** Target audience maps from KE departments. */
  targetEvidencePath: 'ke:payload.departments',
  targetRuleId: 'TR-TARGET-01',
  priorityEvidencePath: 'ke:payload.priorityIndicators',
  priorityRuleId: 'TR-PRIORITY-01',
  deadlineEvidencePath: 'ke:payload.deadlines',
  deadlineRuleId: 'TR-DEADLINE-01',
  /** Deliverables: action statements matching deliverable keywords OR appendix labels. */
  deliverableKeywords: [
    'nộp',
    'nop',
    'báo cáo',
    'bao cao',
    'report',
    'submit',
    'deliverable',
    'gửi',
    'gui',
  ],
  deliverableFromActionPath: 'ke:payload.actionStatements',
  deliverableFromAppendixPath: 'ke:payload.appendices',
  deliverableRuleId: 'TR-DELIV-01',
  referenceEvidencePath: 'ke:payload.referencedDocuments',
  referenceRuleId: 'TR-REF-01',
  attachmentEvidencePath: 'ke:payload.appendices',
  attachmentRuleId: 'TR-ATT-01',
  businessContextRuleId: 'TR-CTX-01',
} as const;

export function matchesDeliverableKeyword(text: string): boolean {
  const normalized = text.toLowerCase();
  return TRANSFORM_RULES.deliverableKeywords.some((kw) => normalized.includes(kw));
}
