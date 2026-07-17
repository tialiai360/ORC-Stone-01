import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DocumentImportController } from './document-import.controller';
import { DocumentImportService } from './document-import.service';

describe('DocumentImportController', () => {
  const documentImport = {
    importDocument: jest.fn(),
    listDocuments: jest.fn(),
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
  };

  let controller: DocumentImportController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [DocumentImportController],
      providers: [{ provide: DocumentImportService, useValue: documentImport }],
    }).compile();
    controller = module.get(DocumentImportController);
  });

  it('rejects missing file', async () => {
    await expect(controller.upload(undefined)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads with session header', async () => {
    documentImport.importDocument.mockResolvedValue({ id: 'x' });
    const file = {
      originalname: 'a.pdf',
      buffer: Buffer.from('%PDF'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;
    await controller.upload(file, 'sess-9');
    expect(documentImport.importDocument).toHaveBeenCalledWith({
      originalFilename: 'a.pdf',
      buffer: file.buffer,
      declaredContentType: 'application/pdf',
      uploaderSession: 'sess-9',
    });
  });

  it('defaults uploader session when header missing', async () => {
    documentImport.importDocument.mockResolvedValue({ id: 'y' });
    const file = {
      originalname: 'a.pdf',
      buffer: Buffer.from('%PDF'),
      mimetype: 'application/pdf',
    } as Express.Multer.File;
    await controller.upload(file, '   ');
    expect(documentImport.importDocument).toHaveBeenCalledWith(
      expect.objectContaining({ uploaderSession: 'anonymous-session' }),
    );
  });

  it('lists gets and deletes', async () => {
    documentImport.listDocuments.mockResolvedValue({ items: [], total: 0 });
    documentImport.getDocument.mockResolvedValue({ id: '1' });
    documentImport.deleteDocument.mockResolvedValue({ id: '1', deleted: true });
    await expect(controller.list()).resolves.toEqual({ items: [], total: 0 });
    await expect(controller.getOne('11111111-1111-1111-1111-111111111111')).resolves.toEqual({
      id: '1',
    });
    await expect(
      controller.remove('11111111-1111-1111-1111-111111111111'),
    ).resolves.toEqual({ id: '1', deleted: true });
  });
});
