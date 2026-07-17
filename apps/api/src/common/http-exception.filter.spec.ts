import { HttpException, HttpStatus, PayloadTooLargeException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  function mockHost(statusFn = jest.fn(), jsonFn = jest.fn()) {
    return {
      switchToHttp: () => ({
        getResponse: () => ({ status: statusFn.mockReturnValue({ json: jsonFn }) }),
      }),
    } as never;
  }

  it('maps multer LIMIT_FILE_SIZE to 413', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    status.mockReturnValue({ json });
    const filter = new HttpExceptionFilter();
    filter.catch({ name: 'MulterError', code: 'LIMIT_FILE_SIZE' }, {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as never);
    expect(status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
  });

  it('serializes HttpException', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    status.mockReturnValue({ json });
    const filter = new HttpExceptionFilter();
    filter.catch(new HttpException('nope', 400), {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as never);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('serializes unknown errors as 500', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    status.mockReturnValue({ json });
    const filter = new HttpExceptionFilter();
    filter.catch(new Error('boom'), {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as never);
    expect(status).toHaveBeenCalledWith(500);
    void PayloadTooLargeException;
    void mockHost;
  });
});
