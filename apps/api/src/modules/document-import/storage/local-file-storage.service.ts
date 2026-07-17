import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile, access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class LocalFileStorageService {
  constructor(private readonly storageRoot: string) {}

  get documentsDir(): string {
    return join(this.storageRoot, 'uploads', 'documents');
  }

  async ensureReady(): Promise<void> {
    await mkdir(this.documentsDir, { recursive: true });
  }

  buildStoragePath(documentId: string, extension: string): string {
    return join('uploads', 'documents', `${documentId}.${extension}`);
  }

  absolutePath(relativeStoragePath: string): string {
    return join(this.storageRoot, relativeStoragePath);
  }

  async saveOriginal(
    relativeStoragePath: string,
    buffer: Buffer,
  ): Promise<void> {
    await this.ensureReady();
    const abs = this.absolutePath(relativeStoragePath);
    await mkdir(join(abs, '..'), { recursive: true });
    await writeFile(abs, buffer);
  }

  async readOriginal(relativeStoragePath: string): Promise<Buffer> {
    return readFile(this.absolutePath(relativeStoragePath));
  }

  async deleteOriginal(relativeStoragePath: string): Promise<void> {
    const abs = this.absolutePath(relativeStoragePath);
    try {
      await unlink(abs);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(relativeStoragePath: string): Promise<boolean> {
    try {
      await access(this.absolutePath(relativeStoragePath), constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
