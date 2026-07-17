import { BadRequestException } from '@nestjs/common';
import { AllowedDocumentExtension } from '@orc/shared';

const SUPPORTED: AllowedDocumentExtension[] = ['pdf', 'docx'];

export function assertExtractableExtension(extension: string): AllowedDocumentExtension {
  const ext = extension.toLowerCase() as AllowedDocumentExtension;
  if (!SUPPORTED.includes(ext)) {
    throw new BadRequestException(
      `Knowledge Extraction supports only pdf/docx. Received: ${extension}`,
    );
  }
  return ext;
}
