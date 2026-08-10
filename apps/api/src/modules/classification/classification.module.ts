import { DynamicModule, Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { ClassificationController } from './classification.controller';
import { ClassificationService } from './classification.service';
import { SessionStoreService } from './session-store.service';

/** Relies on global DocumentImport + KnowledgeExtraction + Evidence + Storage. */
@Module({})
export class ClassificationModule {
  static forRoot(): DynamicModule {
    return {
      module: ClassificationModule,
      imports: [StorageModule],
      controllers: [ClassificationController],
      providers: [SessionStoreService, ClassificationService],
      exports: [ClassificationService],
    };
  }
}
