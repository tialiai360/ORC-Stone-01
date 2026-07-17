import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_BYTES,
  PRODUCT_CODE,
  PRODUCT_NAME,
  EXTRACTION_VERSION,
  RULE_VERSION,
  countExtractionItems,
} from './index';

describe('@orc/shared bootstrap', () => {
  it('exposes product identity constants', () => {
    assert.equal(PRODUCT_CODE, 'STONE-01');
    assert.equal(PRODUCT_NAME, 'HO Notice Assistant');
  });
});

describe('@orc/shared document import constants', () => {
  it('allows only pdf and docx', () => {
    assert.deepEqual([...ALLOWED_DOCUMENT_EXTENSIONS], ['pdf', 'docx']);
  });

  it('caps uploads at 50 MB', () => {
    assert.equal(MAX_DOCUMENT_SIZE_BYTES, 50 * 1024 * 1024);
  });
});

describe('@orc/shared knowledge extraction', () => {
  it('pins extraction and rule versions', () => {
    assert.equal(EXTRACTION_VERSION, '1.0.0');
    assert.equal(RULE_VERSION, '1.0.0');
  });

  it('counts extraction items deterministically', () => {
    const count = countExtractionItems({
      metadata: {
        documentNumber: '01/TB',
        documentDate: null,
        documentTitle: 'Title',
        issuer: null,
        documentType: null,
        effectiveDate: null,
      },
      referencedDocuments: ['A'],
      departments: [],
      responsibleUnits: ['U'],
      actionStatements: [],
      deadlines: [],
      priorityIndicators: [],
      appendices: [],
      sections: [],
      logicalTables: [],
      headings: ['H1'],
    });
    assert.equal(count, 5);
  });
});
