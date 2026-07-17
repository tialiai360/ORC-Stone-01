import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 512 })
  originalFilename!: string;

  @Column({ name: 'content_type', type: 'varchar', length: 255 })
  contentType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ type: 'varchar', length: 16 })
  extension!: string;

  @Index({ unique: true })
  @Column({ name: 'storage_path', type: 'varchar', length: 1024 })
  storagePath!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;
}
