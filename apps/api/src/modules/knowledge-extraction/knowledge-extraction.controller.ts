import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { KnowledgeExtractionService } from './knowledge-extraction.service';

@Controller('extraction')
export class KnowledgeExtractionController {
  constructor(private readonly extraction: KnowledgeExtractionService) {}

  @Post(':documentId')
  extract(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.extraction.extractForDocument(documentId);
  }

  @Get('document/:documentId')
  listForDocument(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.extraction.listByDocument(documentId);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.extraction.getById(id);
  }
}
