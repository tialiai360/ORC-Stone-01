import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import JSZip from 'jszip';
import { DocumentImportController } from '../src/modules/document-import/document-import.controller';
import {
  DOCUMENT_REPOSITORY,
  DocumentImportService,
} from '../src/modules/document-import/document-import.service';
import { InMemoryDocumentRepository } from '../src/modules/document-import/repository/in-memory-document.repository';
import { LocalFileStorageService } from '../src/modules/document-import/storage/local-file-storage.service';
import { EvidenceService } from '../src/modules/evidence/evidence.service';
import { InMemoryEvidenceRepository } from '../src/modules/evidence/repository/in-memory-evidence.repository';
import { KnowledgeExtractionController } from '../src/modules/knowledge-extraction/knowledge-extraction.controller';
import {
  EXTRACTION_REPOSITORY,
  KnowledgeExtractionService,
} from '../src/modules/knowledge-extraction/knowledge-extraction.service';
import { InMemoryExtractionRepository } from '../src/modules/knowledge-extraction/repository/in-memory-extraction.repository';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { SAMPLE_NOTICE_TEXT } from '../src/modules/knowledge-extraction/testing/sample-text';

async function buildDocx(text: string): Promise<Buffer> {
  const zip = new JSZip();
  const body = text
    .split('\n')
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${line}</w:t></w:r></w:p>`)
    .join('');
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('Knowledge Extraction integration (MVP-003)', () => {
  let app: INestApplication;
  let storageRoot: string;
  let evidence: InMemoryEvidenceRepository;

  beforeEach(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'orc-ke-int-'));
    const documents = new InMemoryDocumentRepository();
    evidence = new InMemoryEvidenceRepository();
    const storage = new LocalFileStorageService(storageRoot);
    const evidenceService = new EvidenceService(evidence);
    const documentService = new DocumentImportService(
      documents,
      storage,
      evidenceService,
    );
    const extractionService = new KnowledgeExtractionService(
      documentService,
      storage,
      new InMemoryExtractionRepository(),
      evidenceService,
    );

    const module = await Test.createTestingModule({
      controllers: [DocumentImportController, KnowledgeExtractionController],
      providers: [
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        { provide: LocalFileStorageService, useValue: storage },
        { provide: EvidenceService, useValue: evidenceService },
        { provide: DocumentImportService, useValue: documentService },
        { provide: EXTRACTION_REPOSITORY, useValue: new InMemoryExtractionRepository() },
        { provide: KnowledgeExtractionService, useValue: extractionService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('imports → extracts → persists → reads with repeatable payload', async () => {
    const docx = await buildDocx(SAMPLE_NOTICE_TEXT);
    const uploaded = await request(app.getHttpServer())
      .post('/documents')
      .attach('file', docx, 'notice.docx')
      .expect(201);

    const first = await request(app.getHttpServer())
      .post(`/extraction/${uploaded.body.id}`)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post(`/extraction/${uploaded.body.id}`)
      .expect(201);

    expect(first.body.payload).toEqual(second.body.payload);
    expect(first.body.extractionCount).toEqual(second.body.extractionCount);

    const byId = await request(app.getHttpServer())
      .get(`/extraction/${first.body.id}`)
      .expect(200);
    expect(byId.body.id).toBe(first.body.id);

    const byDoc = await request(app.getHttpServer())
      .get(`/extraction/document/${uploaded.body.id}`)
      .expect(200);
    expect(byDoc.body.total).toBe(2);

    const keEvidence = (await evidence.findByDocumentId(uploaded.body.id)).filter(
      (e) => e.type === 'KnowledgeExtracted',
    );
    expect(keEvidence.length).toBe(2);
    expect(keEvidence[0]).toEqual(
      expect.objectContaining({
        type: 'KnowledgeExtracted',
        extractionVersion: '1.0.0',
        ruleVersion: '1.0.0',
      }),
    );
  });
});
