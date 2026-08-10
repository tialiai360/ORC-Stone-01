import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { TransformationService } from './transformation.service';

@Controller('transformation')
export class TransformationController {
  constructor(private readonly transformation: TransformationService) {}

  @Post(':extractionId')
  transform(@Param('extractionId', ParseUUIDPipe) extractionId: string) {
    return this.transformation.transformExtraction(extractionId);
  }

  @Get('extraction/:extractionId')
  listForExtraction(@Param('extractionId', ParseUUIDPipe) extractionId: string) {
    return this.transformation.listByExtraction(extractionId);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transformation.getById(id);
  }
}
