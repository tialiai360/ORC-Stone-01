import { BadRequestException } from '@nestjs/common';
import { assertExtractableExtension } from './extraction.validation';

describe('extraction.validation', () => {
  it('allows pdf and docx', () => {
    expect(assertExtractableExtension('pdf')).toBe('pdf');
    expect(assertExtractableExtension('DOCX')).toBe('docx');
  });

  it('rejects unsupported extensions', () => {
    expect(() => assertExtractableExtension('txt')).toThrow(BadRequestException);
  });
});
