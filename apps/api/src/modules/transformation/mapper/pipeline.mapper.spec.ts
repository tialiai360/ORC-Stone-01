import {
  EXTRACTION_VERSION,
  KnowledgeExtractionResult,
  RULE_VERSION,
  TRANSFORM_RULE_VERSION,
} from '@orc/shared';
import { mapExtractionToBranchModel } from './pipeline.mapper';
import { findSectionForText, makeTrace, traced } from './trace.helpers';

function sampleExtraction(
  overrides: Partial<KnowledgeExtractionResult['payload']> = {},
): KnowledgeExtractionResult {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    documentId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    extractionVersion: EXTRACTION_VERSION,
    ruleVersion: RULE_VERSION,
    createdAt: '2026-01-01T00:00:00.000Z',
    extractionCount: 10,
    payload: {
      metadata: {
        documentNumber: '01/TB-HO',
        documentDate: '15/01/2026',
        documentTitle: 'Thong bao trien khai',
        issuer: 'Head Office',
        documentType: 'thong bao',
        effectiveDate: '01/02/2026',
      },
      referencedDocuments: ['12/QD-HO', '99/CV-HO'],
      departments: ['Phong Ke toan'],
      responsibleUnits: ['Chi nhanh A', 'Chi nhanh B'],
      actionStatements: ['phai nop bao cao dinh ky', 'shall implement checklist'],
      deadlines: ['20/02/2026', '01/03/2026'],
      priorityIndicators: ['Khan', 'Urgent'],
      appendices: [{ label: 'Phu luc A', offset: 10 }],
      sections: [
        {
          heading: '1. Muc dich',
          startOffset: 0,
          endOffset: 80,
          body: 'phai nop bao cao dinh ky Truoc ngay 20/02/2026',
        },
      ],
      logicalTables: [],
      headings: ['1. Muc dich'],
      ...overrides,
    },
  };
}

describe('Transformation mapping unit tests (MVP-004)', () => {
  describe('Intent Mapping', () => {
    it('maps intent from document title with KE evidence path', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      expect(model.intent.value).toBe('Thong bao trien khai');
      expect(model.intent.trace.evidenceReference).toBe(
        'ke:payload.metadata.documentTitle',
      );
      expect(model.intent.trace.sourceDocumentId).toBe(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );
      expect(model.intent.trace.ruleVersion).toBe(TRANSFORM_RULE_VERSION);
    });

    it('maps null intent when title missing', () => {
      const { model } = mapExtractionToBranchModel(
        sampleExtraction({
          metadata: {
            documentNumber: null,
            documentDate: null,
            documentTitle: null,
            issuer: null,
            documentType: null,
            effectiveDate: null,
          },
        }),
      );
      expect(model.intent.value).toBeNull();
    });
  });

  describe('Action Mapping', () => {
    it('maps each action statement 1:1 with sorted order and trace', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      expect(model.actions.map((a) => a.value)).toEqual([
        'phai nop bao cao dinh ky',
        'shall implement checklist',
      ].sort((a, b) => a.localeCompare(b)));
      for (const action of model.actions) {
        expect(action.trace.evidenceReference).toMatch(
          /^ke:payload\.actionStatements\[\d+\]$/,
        );
        expect(action.trace.ruleVersion).toBe(TRANSFORM_RULE_VERSION);
      }
    });
  });

  describe('Deadline Mapping', () => {
    it('maps deadlines from KE with evidence references', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      expect(model.deadlines.map((d) => d.value).sort()).toEqual([
        '01/03/2026',
        '20/02/2026',
      ]);
      expect(model.deadlines[0].trace.evidenceReference).toContain(
        'ke:payload.deadlines',
      );
      expect(model.deadlines[0].trace.sourceDocumentId).toBe(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      );
    });
  });

  describe('Responsible Unit Mapping', () => {
    it('maps responsible units from KE', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      expect(model.responsibleUnits.map((u) => u.value).sort()).toEqual([
        'Chi nhanh A',
        'Chi nhanh B',
      ]);
      expect(model.responsibleUnits[0].trace.evidenceReference).toContain(
        'ke:payload.responsibleUnits',
      );
    });
  });

  describe('Reference Mapping', () => {
    it('maps referenced documents from KE', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      expect(model.references.map((r) => r.value).sort()).toEqual([
        '12/QD-HO',
        '99/CV-HO',
      ]);
      expect(model.references[0].trace.evidenceReference).toContain(
        'ke:payload.referencedDocuments',
      );
    });
  });

  describe('Priority Mapping', () => {
    it('selects first sorted priority indicator', () => {
      const { model } = mapExtractionToBranchModel(sampleExtraction());
      const expected = ['Khan', 'Urgent'].sort((a, b) => a.localeCompare(b))[0];
      expect(model.priority.value).toBe(expected);
      expect(model.priority.trace.evidenceReference).toBe(
        'ke:payload.priorityIndicators',
      );
    });

    it('maps null priority when indicators empty', () => {
      const { model } = mapExtractionToBranchModel(
        sampleExtraction({ priorityIndicators: [] }),
      );
      expect(model.priority.value).toBeNull();
    });
  });

  describe('Repeatability', () => {
    it('same extraction yields identical transformation model', () => {
      const sample = sampleExtraction();
      expect(mapExtractionToBranchModel(sample)).toEqual(
        mapExtractionToBranchModel(sample),
      );
    });
  });

  describe('trace helpers', () => {
    it('builds traces and resolves section for text', () => {
      const extraction = sampleExtraction();
      const trace = makeTrace(extraction.documentId, 'ke:x', '1. Muc dich', 'p');
      expect(trace.ruleVersion).toBe(TRANSFORM_RULE_VERSION);
      expect(traced('v', extraction.documentId, 'ke:y').value).toBe('v');
      expect(findSectionForText(extraction, 'phai nop bao cao dinh ky')).toBe(
        '1. Muc dich',
      );
      expect(findSectionForText(extraction, 'not-present')).toBeNull();
    });
  });
});
