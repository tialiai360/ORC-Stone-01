import { KnowledgeExtractionController } from './knowledge-extraction.controller';
import { KnowledgeExtractionService } from './knowledge-extraction.service';

describe('KnowledgeExtractionController', () => {
  const extraction = {
    extractForDocument: jest.fn(),
    getById: jest.fn(),
    listByDocument: jest.fn(),
  };

  let controller: KnowledgeExtractionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new KnowledgeExtractionController(
      extraction as unknown as KnowledgeExtractionService,
    );
  });

  it('delegates extract/get/list', async () => {
    extraction.extractForDocument.mockResolvedValue({ id: 'e1' });
    extraction.getById.mockResolvedValue({ id: 'e1' });
    extraction.listByDocument.mockResolvedValue({ items: [], total: 0 });

    await expect(
      controller.extract('11111111-1111-1111-1111-111111111111'),
    ).resolves.toEqual({ id: 'e1' });
    await expect(
      controller.getOne('22222222-2222-2222-2222-222222222222'),
    ).resolves.toEqual({ id: 'e1' });
    await expect(
      controller.listForDocument('11111111-1111-1111-1111-111111111111'),
    ).resolves.toEqual({ items: [], total: 0 });
  });
});
