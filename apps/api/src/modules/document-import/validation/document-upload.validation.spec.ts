import { BadRequestException } from '@nestjs/common';
import { MAX_DOCUMENT_SIZE_BYTES } from '@orc/shared';
import {
  normalizeExtension,
  validateUploadBuffer,
} from './document-upload.validation';

describe('document-upload.validation', () => {
  it('accepts pdf and docx', () => {
    expect(validateUploadBuffer('a.pdf', 100).extension).toBe('pdf');
    expect(validateUploadBuffer('b.docx', 100).extension).toBe('docx');
  });

  it('rejects wrong extension', () => {
    expect(() => validateUploadBuffer('note.txt', 10)).toThrow(BadRequestException);
    expect(() => validateUploadBuffer('scan.png', 10)).toThrow(BadRequestException);
  });

  it('rejects oversized files', () => {
    expect(() =>
      validateUploadBuffer('big.pdf', MAX_DOCUMENT_SIZE_BYTES + 1),
    ).toThrow(BadRequestException);
  });

  it('rejects empty filename and empty size', () => {
    expect(() => validateUploadBuffer('  ', 10)).toThrow(BadRequestException);
    expect(() => validateUploadBuffer('a.pdf', 0)).toThrow(BadRequestException);
  });

  it('normalizes extension', () => {
    expect(normalizeExtension('Report.PDF')).toBe('pdf');
  });

  it('rejects mismatched content types', () => {
    expect(() =>
      validateUploadBuffer(
        'a.pdf',
        10,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toThrow(BadRequestException);
    expect(() => validateUploadBuffer('a.docx', 10, 'application/pdf')).toThrow(
      BadRequestException,
    );
  });

  it('accepts octet-stream and matching mime', () => {
    expect(validateUploadBuffer('a.pdf', 10, 'application/octet-stream').contentType).toBe(
      'application/pdf',
    );
    expect(validateUploadBuffer('a.pdf', 10, 'application/pdf').contentType).toBe(
      'application/pdf',
    );
  });
});
