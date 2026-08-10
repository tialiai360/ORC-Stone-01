import { DynamicModule, Module } from '@nestjs/common';
import { StorageModule } from '../common/storage/storage.module';
import { DocumentIntelligenceController } from './document-intelligence.controller';
import { DocumentIntelligenceService } from './document-intelligence.service';
import { DilStoreService } from './dil-store.service';

/** Relies on global DocumentImport + Evidence + Storage modules. */
@Module({})
export class DocumentIntelligenceModule {
  static forRoot(): DynamicModule {
    return {
      module: DocumentIntelligenceModule,
      imports: [StorageModule],
      controllers: [DocumentIntelligenceController],
      providers: [DilStoreService, DocumentIntelligenceService],
      exports: [DocumentIntelligenceService],
    };
  }
}
