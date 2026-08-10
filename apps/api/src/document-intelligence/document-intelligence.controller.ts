import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { DilCorrectionDecision, KnowledgePackId } from '@orc/shared';
import { DocumentIntelligenceService } from './document-intelligence.service';

class DilDecisionDto {
  blockId!: string;
  original!: string;
  suggested!: string;
  decision!: DilCorrectionDecision;
  reviewer!: string;
  packId!: KnowledgePackId | string;
  packVersion!: string;
}

@Controller('dil')
export class DocumentIntelligenceController {
  constructor(private readonly dil: DocumentIntelligenceService) {}

  @Get('packs')
  packs() {
    return { items: this.dil.listPacks() };
  }

  @Post(':documentId')
  analyze(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query('force') force?: string,
  ) {
    return this.dil.analyze(documentId, force === '1' || force === 'true');
  }

  @Get(':documentId')
  get(@Param('documentId', ParseUUIDPipe) documentId: string) {
    return this.dil.get(documentId);
  }

  @Post(':documentId/corrections')
  decide(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() body: DilDecisionDto,
  ) {
    return this.dil.decideCorrection({
      documentId,
      blockId: body.blockId,
      original: body.original,
      suggested: body.suggested,
      decision: body.decision,
      reviewer: body.reviewer?.trim() || 'nguoi-duyet',
      packId: body.packId,
      packVersion: body.packVersion,
    });
  }
}
