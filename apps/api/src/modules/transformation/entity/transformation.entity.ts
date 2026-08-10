import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'transformations' })
export class TransformationEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'extraction_id', type: 'uuid' })
  extractionId!: string;

  @Index()
  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  @Column({ name: 'transform_version', type: 'varchar', length: 32 })
  transformVersion!: string;

  @Column({ name: 'rule_version', type: 'varchar', length: 32 })
  ruleVersion!: string;

  @Column({ name: 'field_count', type: 'int' })
  fieldCount!: number;

  @Column({ type: 'text' })
  model!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
