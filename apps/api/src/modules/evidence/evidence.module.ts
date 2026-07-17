import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvidenceEntity } from './entity/evidence.entity';
import { EvidenceService, EVIDENCE_REPOSITORY } from './evidence.service';
import { InMemoryEvidenceRepository } from './repository/in-memory-evidence.repository';
import { TypeOrmEvidenceRepository } from './repository/typeorm-evidence.repository';
import { EvidenceRepository } from './repository/evidence.repository';

const memoryRepo = new InMemoryEvidenceRepository();

@Module({})
export class EvidenceModule {
  static forRoot(mode: 'postgres' | 'memory' = 'postgres'): DynamicModule {
    if (mode === 'memory') {
      return {
        module: EvidenceModule,
        global: true,
        providers: [
          { provide: EVIDENCE_REPOSITORY, useValue: memoryRepo },
          {
            provide: EvidenceService,
            useFactory: (repo: EvidenceRepository) => new EvidenceService(repo),
            inject: [EVIDENCE_REPOSITORY],
          },
        ],
        exports: [EvidenceService, EVIDENCE_REPOSITORY],
      };
    }

    return {
      module: EvidenceModule,
      global: true,
      imports: [TypeOrmModule.forFeature([EvidenceEntity])],
      providers: [
        TypeOrmEvidenceRepository,
        {
          provide: EVIDENCE_REPOSITORY,
          useExisting: TypeOrmEvidenceRepository,
        },
        {
          provide: EvidenceService,
          useFactory: (repo: EvidenceRepository) => new EvidenceService(repo),
          inject: [EVIDENCE_REPOSITORY],
        },
      ],
      exports: [EvidenceService, EVIDENCE_REPOSITORY],
    };
  }
}
