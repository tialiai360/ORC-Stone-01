import { Inject, Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  CLASSIFICATION_VERSION,
  ClassificationAssignment,
  ClassificationSession,
} from '@orc/shared';
import { STORAGE_PATHS, STORAGE_ROOT } from '../../common/storage/storage-root';

@Injectable()
export class SessionStoreService {
  constructor(@Inject(STORAGE_ROOT) private readonly storageRoot: string) {}

  private get sessionsDir(): string {
    return join(this.storageRoot, STORAGE_PATHS.sessions);
  }

  private pathFor(documentId: string): string {
    return join(this.sessionsDir, `${documentId}.json`);
  }

  async ensureReady(): Promise<void> {
    await mkdir(this.sessionsDir, { recursive: true });
  }

  async read(documentId: string): Promise<ClassificationSession | null> {
    try {
      const raw = await readFile(this.pathFor(documentId), 'utf8');
      return JSON.parse(raw) as ClassificationSession;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async write(session: ClassificationSession): Promise<ClassificationSession> {
    await this.ensureReady();
    const payload: ClassificationSession = {
      ...session,
      classificationVersion: session.classificationVersion || CLASSIFICATION_VERSION,
      updatedAt: new Date().toISOString(),
    };
    await writeFile(this.pathFor(session.documentId), JSON.stringify(payload, null, 2), 'utf8');
    return payload;
  }

  emptySession(documentId: string, reviewer = 'nguoi-duyet'): ClassificationSession {
    return {
      documentId,
      version: 0,
      assignments: [] as ClassificationAssignment[],
      updatedAt: new Date().toISOString(),
      reviewer,
      classificationVersion: CLASSIFICATION_VERSION,
    };
  }
}
