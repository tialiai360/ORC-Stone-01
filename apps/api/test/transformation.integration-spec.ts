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
import { TransformationController } from '../src/modules/transformation/transformation.controller';
import {
  TRANSFORMATION_REPOSITORY,
  TransformationService,
} from '../src/modules/transformation/transformation.service';
import { InMemoryTransformationRepository } from '../src/modules/transformation/repository/in-memory-transformation.repository';
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

describe('Transformation integration (MVP-004)', () => {
  let app: INestApplication;
  let storageRoot: string;
  let transformationRepo: InMemoryTransformationRepository;
  let evidenceRepo: InMemoryEvidenceRepository;

  beforeEach(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'orc-tr-int-'));
    const documents = new InMemoryDocumentRepository();
    evidenceRepo = new InMemoryEvidenceRepository();
    const storage = new LocalFileStorageService(storageRoot);
    const evidenceService = new EvidenceService(evidenceRepo);
    const documentService = new DocumentImportService(
      documents,
      storage,
      evidenceService,
    );
    const extractionRepo = new InMemoryExtractionRepository();
    const extractionService = new KnowledgeExtractionService(
      documentService,
      storage,
      extractionRepo,
      evidenceService,
    );
    transformationRepo = new InMemoryTransformationRepository();
    const transformationService = new TransformationService(
      extractionService,
      transformationRepo,
      evidenceService,
    );

    const module = await Test.createTestingModule({
      controllers: [
        DocumentImportController,
        KnowledgeExtractionController,
        TransformationController,
      ],
      providers: [
        { provide: DOCUMENT_REPOSITORY, useValue: documents },
        { provide: LocalFileStorageService, useValue: storage },
        { provide: EvidenceService, useValue: evidenceService },
        { provide: DocumentImportService, useValue: documentService },
        { provide: EXTRACTION_REPOSITORY, useValue: extractionRepo },
        { provide: KnowledgeExtractionService, useValue: extractionService },
        { provide: TRANSFORMATION_REPOSITORY, useValue: transformationRepo },
        { provide: TransformationService, useValue: transformationService },
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

  it('Import → Extraction → Transformation → Persistence → Read + repeatability', async () => {
    const docx = await buildDocx(SAMPLE_NOTICE_TEXT);

    const uploaded = await request(app.getHttpServer())
      .post('/documents')
      .attach('file', docx, 'notice.docx')
      .expect(201);

    const extracted = await request(app.getHttpServer())
      .post(`/extraction/${uploaded.body.id}`)
      .expect(201);

    const first = await request(app.getHttpServer())
      .post(`/transformation/${extracted.body.id}`)
      .expect(201);

    const second = await request(app.getHttpServer())
      .post(`/transformation/${extracted.body.id}`)
      .expect(201);

    expect(first.body.model).toEqual(second.body.model);
    expect(first.body.fieldCount).toEqual(second.body.fieldCount);
    expect(first.body.id).not.toBe(second.body.id);

    expect(first.body.model.intent.trace.sourceDocumentId).toBe(uploaded.body.id);
    expect(first.body.model.intent.trace.evidenceReference).toBe(
      'ke:payload.metadata.documentTitle',
    );
    expect(first.body.model.intent.trace.ruleVersion).toBe('1.0.0');

    const byId = await request(app.getHttpServer())
      .get(`/transformation/${first.body.id}`)
      .expect(200);
    expect(byId.body.id).toBe(first.body.id);
    expect(byId.body.model).toEqual(first.body.model);

    const byExtraction = await request(app.getHttpServer())
      .get(`/transformation/extraction/${extracted.body.id}`)
      .expect(200);
    expect(byExtraction.body.total).toBe(2);

    const persisted = await transformationRepo.findById(first.body.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.model).toEqual(first.body.model);

    const trEvidence = (await evidenceRepo.findByDocumentId(uploaded.body.id)).filter(
      (e) => e.type === 'TransformationCompleted',
    );
    expect(trEvidence.length).toBe(2);
    if (trEvidence[0].type === 'TransformationCompleted') {
      expect(trEvidence[0].transformationId).toBeTruthy();
      expect(trEvidence[0].extractionId).toBe(extracted.body.id);
      expect(trEvidence[0].documentId).toBe(uploaded.body.id);
      expect(trEvidence[0].ruleVersion).toBe('1.0.0');
      expect(trEvidence[0].sourceTraceCount).toBeGreaterThan(0);
      expect(trEvidence[0].durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});
