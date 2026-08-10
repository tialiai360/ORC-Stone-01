import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AssignmentDto {
  @IsString()
  id!: string;

  @IsString()
  nodeId!: string;

  @IsString()
  text!: string;

  @IsInt()
  @Min(1)
  pageNumber!: number;

  @IsString()
  createdAt!: string;

  @IsOptional()
  @IsString()
  source?: 'auto' | 'manual';
}

export class CorrectionDto {
  @IsString()
  nodeId!: string;

  @IsOptional()
  @IsString()
  before!: string | null;

  @IsOptional()
  @IsString()
  after!: string | null;

  @IsOptional()
  @IsString()
  originalClassification?: string | null;

  @IsOptional()
  @IsString()
  newClassification?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;
}

export class SaveSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentDto)
  assignments!: AssignmentDto[];

  @IsString()
  reviewer!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectionDto)
  corrections!: CorrectionDto[];

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
