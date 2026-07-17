import { NotFoundException } from '@nestjs/common';
import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import JSZip from 'jszip';
import { DocumentImportService } from '../document-import/document-import.service';
import { InMemoryDocumentRepository } from '../document-import/repository/in-memory-document.repository';
import { LocalFileStorageService } from '../document-import/storage/local-file-storage.service';
import { EvidenceService } from '../evidence/evidence.service';
import { InMemoryEvidenceRepository } from '../evidence/repository/in-memory-evidence.repository';
import { KnowledgeExtractionService } from './knowledge-extraction.service';
import { InMemoryExtractionRepository } from './repository/in-memory-extraction.repository';
import { SAMPLE_NOTICE_TEXT } from './testing/sample-text';

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

describe('KnowledgeExtractionService', () => {
  let root: string;
  let documentService: DocumentImportService;
  let extractionService: KnowledgeExtractionService;
  let evidenceRepo: InMemoryEvidenceRepository;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'orc-ke-'));
    const documents = new InMemoryDocumentRepository();
    const storage = new LocalFileStorageService(root);
    evidenceRepo = new InMemoryEvidenceRepository();
    const evidence = new EvidenceService(evidenceRepo);
    documentService = new DocumentImportService(documents, storage, evidence);
    extractionService = new KnowledgeExtractionService(
      documentService,
      storage,
      new InMemoryExtractionRepository(),
      evidence,
    );
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('extracts, persists, and emits KnowledgeExtracted evidence', async () => {
    const doc = await documentService.importDocument({
      originalFilename: 'notice.docx',
      buffer: await buildDocx(SAMPLE_NOTICE_TEXT),
      uploaderSession: 'ke-test',
    });

    const first = await extractionService.extractForDocument(doc.id);
    const second = await extractionService.extractForDocument(doc.id);
    expect(first.payload).toEqual(second.payload);
    expect(first.extractionCount).toEqual(second.extractionCount);
    expect(first.id).not.toBe(second.id);

    const loaded = await extractionService.getById(first.id);
    expect(loaded.payload.metadata.documentNumber).toBe('01/TB-HO');

    const listed = await extractionService.listByDocument(doc.id);
    expect(listed.total).toBe(2);

    const evidenceRows = await evidenceRepo.findByDocumentId(doc.id);
    expect(evidenceRows.some((e) => e.type === 'KnowledgeExtracted')).toBe(true);
  });

  it('throws when extraction id missing', async () => {
    await expect(
      extractionService.getById('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
