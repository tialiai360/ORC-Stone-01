import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns bootstrap health payload', () => {
    expect(controller.getHealth()).toEqual({
      status: 'ok',
      product: 'STONE-01',
      service: 'api',
    });
  });
});
