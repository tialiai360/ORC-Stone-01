import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ReviewPackageStore } from './review-package.store';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewStore: ReviewPackageStore) {}

  @Post('packages')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 80 * 1024 * 1024 },
    }),
  )
  async savePackage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Multipart field "file" (ZIP) is required.');
    }
    return this.reviewStore.saveZip({
      originalFilename: file.originalname || 'review-package.zip',
      buffer: file.buffer,
    });
  }
}
