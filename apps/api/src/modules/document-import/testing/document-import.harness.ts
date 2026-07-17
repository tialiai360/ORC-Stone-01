import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DocumentImportController } from '../document-import.controller';
import {
  DOCUMENT_REPOSITORY,
  DocumentImportService,
} from '../document-import.service';
import { InMemoryDocumentRepository } from '../repository/in-memory-document.repository';
import { LocalFileStorageService } from '../storage/local-file-storage.service';
import { EvidenceService } from '../../evidence/evidence.service';
import { InMemoryEvidenceRepository } from '../../evidence/repository/in-memory-evidence.repository';
import { HttpExceptionFilter } from '../../../common/http-exception.filter';

export interface DocumentImportTestHarness {
  app: INestApplication;
  module: TestingModule;
  documents: InMemoryDocumentRepository;
  evidence: InMemoryEvidenceRepository;
  storageRoot: string;
  storage: LocalFileStorageService;
  service: DocumentImportService;
  evidenceService: EvidenceService;
  cleanup: () => Promise<void>;
}

export async function createDocumentImportHarness(): Promise<DocumentImportTestHarness> {
  const storageRoot = await mkdtemp(join(tmpdir(), 'orc-doc-import-'));
  const documents = new InMemoryDocumentRepository();
  const evidence = new InMemoryEvidenceRepository();
  const storage = new LocalFileStorageService(storageRoot);
  const evidenceService = new EvidenceService(evidence);
  const service = new DocumentImportService(documents, storage, evidenceService);

  const module = await Test.createTestingModule({
    controllers: [DocumentImportController],
    providers: [
      { provide: DOCUMENT_REPOSITORY, useValue: documents },
      { provide: LocalFileStorageService, useValue: storage },
      { provide: EvidenceService, useValue: evidenceService },
      { provide: DocumentImportService, useValue: service },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  return {
    app,
    module,
    documents,
    evidence,
    storageRoot,
    storage,
    service,
    evidenceService,
    cleanup: async () => {
      await app.close();
      await rm(storageRoot, { recursive: true, force: true });
    },
  };
}
