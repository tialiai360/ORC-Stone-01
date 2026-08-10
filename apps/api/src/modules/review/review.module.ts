import { Module } from '@nestjs/common';
import { StorageModule } from '../../common/storage/storage.module';
import { ReviewController } from './review.controller';
import { ReviewPackageStore } from './review-package.store';

/** LAB-001 — Evidence Review Package store (ZIP under storage/review/). */
@Module({
  imports: [StorageModule],
  controllers: [ReviewController],
  providers: [ReviewPackageStore],
  exports: [ReviewPackageStore],
})
export class ReviewModule {}
