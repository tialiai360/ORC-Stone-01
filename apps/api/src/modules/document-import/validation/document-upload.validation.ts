import {
  AllowedDocumentExtension,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_BYTES,
} from '@orc/shared';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';

const EXT_TO_CONTENT: Record<AllowedDocumentExtension, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export interface ValidatedUpload {
  originalFilename: string;
  contentType: string;
  extension: AllowedDocumentExtension;
  sizeBytes: number;
}

export function normalizeExtension(filename: string): string {
  return extname(filename).replace(/^\./, '').toLowerCase();
}

export function isAllowedExtension(ext: string): ext is AllowedDocumentExtension {
  return (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}

export function resolveContentType(
  filename: string,
  declaredContentType?: string,
): { extension: AllowedDocumentExtension; contentType: string } {
  const extension = normalizeExtension(filename);
  if (!isAllowedExtension(extension)) {
    throw new BadRequestException(
      `Unsupported file extension ".${extension || '(none)'}". Allowed: pdf, docx.`,
    );
  }

  const expected = EXT_TO_CONTENT[extension];
  if (
    declaredContentType &&
    declaredContentType !== 'application/octet-stream' &&
    declaredContentType !== expected
  ) {
    throw new BadRequestException(
      `Content-Type "${declaredContentType}" does not match extension ".${extension}".`,
    );
  }

  return {
    extension,
    contentType:
      declaredContentType && declaredContentType !== 'application/octet-stream'
        ? declaredContentType
        : expected,
  };
}

export function validateUploadBuffer(
  filename: string,
  sizeBytes: number,
  declaredContentType?: string,
): ValidatedUpload {
  if (!filename || !filename.trim()) {
    throw new BadRequestException('Original filename is required.');
  }

  if (sizeBytes <= 0) {
    throw new BadRequestException('Empty file is not allowed.');
  }

  if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw new BadRequestException(
      `File exceeds maximum size of ${MAX_DOCUMENT_SIZE_BYTES} bytes (50 MB).`,
    );
  }

  const { extension, contentType } = resolveContentType(filename, declaredContentType);

  return {
    originalFilename: filename.trim(),
    contentType,
    extension,
    sizeBytes,
  };
}
