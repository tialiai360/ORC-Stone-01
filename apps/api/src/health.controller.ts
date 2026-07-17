import { Controller, Get } from '@nestjs/common';
import { PRODUCT_CODE, type HealthPayload } from '@orc/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthPayload {
    return {
      status: 'ok',
      product: PRODUCT_CODE,
      service: 'api',
    };
  }
}
