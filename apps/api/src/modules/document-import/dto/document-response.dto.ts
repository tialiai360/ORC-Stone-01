import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class DocumentResponseDto {
  @IsUUID()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  originalFilename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsString()
  extension!: string;

  @IsString()
  storagePath!: string;

  @IsISO8601()
  uploadedAt!: string;
}

export class DocumentListResponseDto {
  items!: DocumentResponseDto[];
  total!: number;
}
