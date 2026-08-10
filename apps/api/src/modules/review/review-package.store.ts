import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PATHS, STORAGE_ROOT } from '../../common/storage/storage-root';

export type SavedReviewPackage = {
  ok: true;
  filename: string;
  storagePath: string;
  sizeBytes: number;
  sha256: string;
};

@Injectable()
export class ReviewPackageStore {
  constructor(@Inject(STORAGE_ROOT) private readonly storageRoot: string) {}

  private get reviewDir(): string {
    return join(this.storageRoot, STORAGE_PATHS.review);
  }

  async ensureReady(): Promise<void> {
    await mkdir(this.reviewDir, { recursive: true });
  }

  async saveZip(input: {
    originalFilename: string;
    buffer: Buffer;
  }): Promise<SavedReviewPackage> {
    await this.ensureReady();
    const name = (input.originalFilename || 'review-package.zip').replace(
      /[^\w.\-]+/g,
      '_',
    );
    const safeName = name.toLowerCase().endsWith('.zip') ? name : `${name}.zip`;
    const absolutePath = join(this.reviewDir, safeName);
    await writeFile(absolutePath, input.buffer);
    const sha256 = createHash('sha256').update(input.buffer).digest('hex');
    return {
      ok: true,
      filename: safeName,
      storagePath: `${STORAGE_PATHS.review}/${safeName}`,
      sizeBytes: input.buffer.byteLength,
      sha256,
    };
  }
}
