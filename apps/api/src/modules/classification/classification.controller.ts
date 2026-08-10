import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { SaveSessionDto } from './dto/save-session.dto';

@Controller('classification')
export class ClassificationController {
  constructor(private readonly classification: ClassificationService) {}

  @Get(':documentId/evidence')
  listEvidence(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.classification.listEvidence(documentId);
  }

  @Get(':documentId')
  getSession(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.classification.getSession(documentId);
  }

  @Put(':documentId')
  saveSession(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: SaveSessionDto,
  ) {
    return this.classification.saveSession(documentId, body);
  }
}
