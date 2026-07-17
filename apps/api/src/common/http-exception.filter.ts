import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';

function isMulterFileSizeError(exception: unknown): boolean {
  const err = exception as { name?: string; code?: string };
  return err?.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (isMulterFileSizeError(exception)) {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: 'File exceeds maximum size of 52428800 bytes (50 MB).',
        error: 'Payload Too Large',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Internal Server Error',
    });
  }
}
