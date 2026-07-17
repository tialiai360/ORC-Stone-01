import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_DOCUMENT_SIZE_BYTES } from '@orc/shared';
import { DocumentImportService } from './document-import.service';

@Controller('documents')
export class DocumentImportController {
  constructor(private readonly documentImport: DocumentImportService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Headers('x-uploader-session') uploaderSessionHeader?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Multipart field "file" is required.');
    }

    const uploaderSession =
      uploaderSessionHeader?.trim() || 'anonymous-session';

    return this.documentImport.importDocument({
      originalFilename: file.originalname,
      buffer: file.buffer,
      declaredContentType: file.mimetype,
      uploaderSession,
    });
  }

  @Get()
  list() {
    return this.documentImport.listDocuments();
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentImport.getDocument(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentImport.deleteDocument(id);
  }
}
