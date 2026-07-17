import { join } from 'node:path';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceModule } from '../evidence/evidence.module';
import { DocumentImportController } from './document-import.controller';
import {
  DOCUMENT_REPOSITORY,
  DocumentImportService,
} from './document-import.service';
import { DocumentEntity } from './entity/document.entity';
import { InMemoryDocumentRepository } from './repository/in-memory-document.repository';
import { TypeOrmDocumentRepository } from './repository/typeorm-document.repository';
import { LocalFileStorageService } from './storage/local-file-storage.service';

export const STORAGE_ROOT = Symbol('STORAGE_ROOT');

function defaultStorageRoot(): string {
  return process.env.STORAGE_ROOT ?? join(process.cwd(), '..', '..', 'storage');
}

const memoryDocuments = new InMemoryDocumentRepository();

@Module({})
export class DocumentImportModule {
  static forRoot(mode: 'postgres' | 'memory' = 'postgres'): DynamicModule {
    const storageProviders = [
      {
        provide: STORAGE_ROOT,
        useFactory: () => defaultStorageRoot(),
      },
      {
        provide: LocalFileStorageService,
        useFactory: (root: string) => new LocalFileStorageService(root),
        inject: [STORAGE_ROOT],
      },
    ];

    if (mode === 'memory') {
      return {
        module: DocumentImportModule,
        global: true,
        imports: [EvidenceModule.forRoot('memory')],
        controllers: [DocumentImportController],
        providers: [
          ...storageProviders,
          { provide: DOCUMENT_REPOSITORY, useValue: memoryDocuments },
          DocumentImportService,
        ],
        exports: [DocumentImportService, LocalFileStorageService, DOCUMENT_REPOSITORY],
      };
    }

    return {
      module: DocumentImportModule,
      global: true,
      imports: [
        TypeOrmModule.forFeature([DocumentEntity]),
        EvidenceModule.forRoot('postgres'),
      ],
      controllers: [DocumentImportController],
      providers: [
        ...storageProviders,
        TypeOrmDocumentRepository,
        {
          provide: DOCUMENT_REPOSITORY,
          useExisting: TypeOrmDocumentRepository,
        },
        DocumentImportService,
      ],
      exports: [DocumentImportService, LocalFileStorageService, DOCUMENT_REPOSITORY],
    };
  }
}
