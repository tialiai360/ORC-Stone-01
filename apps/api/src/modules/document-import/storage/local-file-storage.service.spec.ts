import { join } from 'node:path';
import { mkdtemp, rm, chmod, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { LocalFileStorageService } from './local-file-storage.service';

describe('LocalFileStorageService', () => {
  let root: string;
  let storage: LocalFileStorageService;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'orc-storage-'));
    storage = new LocalFileStorageService(root);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('stores, reads, and deletes original files', async () => {
    const rel = storage.buildStoragePath('11111111-1111-1111-1111-111111111111', 'pdf');
    await storage.saveOriginal(rel, Buffer.from('%PDF-test'));
    expect(await storage.exists(rel)).toBe(true);
    expect((await storage.readOriginal(rel)).toString('utf8')).toContain('%PDF-test');
    await storage.deleteOriginal(rel);
    expect(await storage.exists(rel)).toBe(false);
  });

  it('ignores missing file on delete', async () => {
    await expect(
      storage.deleteOriginal('uploads/documents/missing.pdf'),
    ).resolves.toBeUndefined();
  });

  it('surfaces non-ENOENT delete errors', async () => {
    if (process.platform === 'win32') {
      // Windows file-lock semantics differ; assert exists false path already covered.
      expect(await storage.exists('uploads/documents/nope.pdf')).toBe(false);
      return;
    }
    const rel = 'uploads/documents/locked.pdf';
    const abs = storage.absolutePath(rel);
    await mkdir(join(abs, '..'), { recursive: true });
    await writeFile(abs, 'x');
    await chmod(join(abs, '..'), 0o555);
    await expect(storage.deleteOriginal(rel)).rejects.toBeTruthy();
    await chmod(join(abs, '..'), 0o755);
  });
});
