import { TransformationController } from './transformation.controller';
import { TransformationService } from './transformation.service';

describe('TransformationController', () => {
  const transformation = {
    transformExtraction: jest.fn(),
    getById: jest.fn(),
    listByExtraction: jest.fn(),
  };

  let controller: TransformationController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TransformationController(
      transformation as unknown as TransformationService,
    );
  });

  it('delegates transform/get/list', async () => {
    transformation.transformExtraction.mockResolvedValue({ id: 't1' });
    transformation.getById.mockResolvedValue({ id: 't1' });
    transformation.listByExtraction.mockResolvedValue({ items: [], total: 0 });

    await expect(
      controller.transform('11111111-1111-1111-1111-111111111111'),
    ).resolves.toEqual({ id: 't1' });
    await expect(
      controller.getOne('22222222-2222-2222-2222-222222222222'),
    ).resolves.toEqual({ id: 't1' });
    await expect(
      controller.listForExtraction('11111111-1111-1111-1111-111111111111'),
    ).resolves.toEqual({ items: [], total: 0 });
  });
});
