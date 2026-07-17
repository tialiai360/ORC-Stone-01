import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtractionEntity } from './entity/extraction.entity';
import { KnowledgeExtractionController } from './knowledge-extraction.controller';
import {
  EXTRACTION_REPOSITORY,
  KnowledgeExtractionService,
} from './knowledge-extraction.service';
import { InMemoryExtractionRepository } from './repository/in-memory-extraction.repository';
import { TypeOrmExtractionRepository } from './repository/typeorm-extraction.repository';

const memoryExtractions = new InMemoryExtractionRepository();

@Module({})
export class KnowledgeExtractionModule {
  static forRoot(mode: 'postgres' | 'memory' = 'postgres'): DynamicModule {
    if (mode === 'memory') {
      return {
        module: KnowledgeExtractionModule,
        controllers: [KnowledgeExtractionController],
        providers: [
          { provide: EXTRACTION_REPOSITORY, useValue: memoryExtractions },
          KnowledgeExtractionService,
        ],
        exports: [KnowledgeExtractionService, EXTRACTION_REPOSITORY],
      };
    }

    return {
      module: KnowledgeExtractionModule,
      imports: [TypeOrmModule.forFeature([ExtractionEntity])],
      controllers: [KnowledgeExtractionController],
      providers: [
        TypeOrmExtractionRepository,
        {
          provide: EXTRACTION_REPOSITORY,
          useExisting: TypeOrmExtractionRepository,
        },
        KnowledgeExtractionService,
      ],
      exports: [KnowledgeExtractionService, EXTRACTION_REPOSITORY],
    };
  }
}
