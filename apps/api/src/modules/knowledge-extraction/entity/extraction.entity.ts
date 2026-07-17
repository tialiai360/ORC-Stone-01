import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'knowledge_extractions' })
export class ExtractionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'extraction_version', type: 'varchar', length: 32 })
  extractionVersion!: string;

  @Column({ name: 'rule_version', type: 'varchar', length: 32 })
  ruleVersion!: string;

  @Column({ name: 'extraction_count', type: 'int' })
  extractionCount!: number;

  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
