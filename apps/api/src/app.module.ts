import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { DocumentEntity } from './modules/document-import/entity/document.entity';
import { DocumentImportModule } from './modules/document-import/document-import.module';
import { EvidenceEntity } from './modules/evidence/entity/evidence.entity';
import { ExtractionEntity } from './modules/knowledge-extraction/entity/extraction.entity';
import { KnowledgeExtractionModule } from './modules/knowledge-extraction/knowledge-extraction.module';

function metadataMode(): 'postgres' | 'memory' {
  const explicit = process.env.METADATA_STORE?.toLowerCase();
  if (explicit === 'memory') {
    return 'memory';
  }
  if (explicit === 'postgres') {
    return 'postgres';
  }
  return process.env.DATABASE_URL ? 'postgres' : 'memory';
}

const mode = metadataMode();

const imports =
  mode === 'postgres'
    ? [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres' as const,
            url:
              config.get<string>('DATABASE_URL') ??
              'postgresql://orc:orc_dev_change_me@127.0.0.1:5432/orc_stone01',
            entities: [DocumentEntity, EvidenceEntity, ExtractionEntity],
            synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
            logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
          }),
        }),
        DocumentImportModule.forRoot('postgres'),
        KnowledgeExtractionModule.forRoot('postgres'),
      ]
    : [
        ConfigModule.forRoot({ isGlobal: true }),
        DocumentImportModule.forRoot('memory'),
        KnowledgeExtractionModule.forRoot('memory'),
      ];

@Module({
  imports,
  controllers: [HealthController],
})
export class AppModule {
  static readonly metadataMode = mode;
}
