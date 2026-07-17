import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'evidence' })
export class EvidenceEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ name: 'document_id', type: 'uuid' })
  documentId!: string;

  /** JSON payload for type-specific evidence fields. */
  @Column({ type: 'text' })
  payload!: string;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp!: Date;
}
