import { BadRequestException } from '@nestjs/common';
import { assertValidExtractionForTransform } from './transformation.validation';

describe('transformation.validation', () => {
  it('rejects null or incomplete extraction', () => {
    expect(() => assertValidExtractionForTransform(null)).toThrow(BadRequestException);
    expect(() =>
      assertValidExtractionForTransform({
        id: '',
        documentId: '',
        payload: null,
      } as never),
    ).toThrow(BadRequestException);
  });
});
