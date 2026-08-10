import { Inject, Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DilDocumentResult } from '@orc/shared';
import { STORAGE_PATHS, STORAGE_ROOT } from '../common/storage/storage-root';

@Injectable()
export class DilStoreService {
  constructor(@Inject(STORAGE_ROOT) private readonly storageRoot: string) {}

  private get dir(): string {
    return join(this.storageRoot, STORAGE_PATHS.dil);
  }

  private pathFor(documentId: string): string {
    return join(this.dir, `${documentId}.json`);
  }

  async ensureReady(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async read(documentId: string): Promise<DilDocumentResult | null> {
    try {
      const raw = await readFile(this.pathFor(documentId), 'utf8');
      return JSON.parse(raw) as DilDocumentResult;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async write(result: DilDocumentResult): Promise<DilDocumentResult> {
    await this.ensureReady();
    await writeFile(this.pathFor(result.documentId), JSON.stringify(result, null, 2), 'utf8');
    return result;
  }
}
