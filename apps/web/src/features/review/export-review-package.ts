import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { apiUpload } from '../../lib/http';
import {
  buildEnvironment,
  buildEvidence,
  buildHighlights,
  buildKnowledgeTree,
  buildPerformance,
  buildReadme,
  buildSession,
} from './builders';
import type { ReviewExportInput } from './types';
import { replaceUnsupportedColorFns } from './sanitize-css-colors';

function installComputedStyleSanitizer(): () => void {
  const original = window.getComputedStyle.bind(window);

  window.getComputedStyle = ((elt: Element, pseudoElt?: string | null) => {
    const style = original(elt, pseudoElt ?? undefined);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return (property: string) =>
            replaceUnsupportedColorFns(target.getPropertyValue(property));
        }
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'string') {
          return replaceUnsupportedColorFns(value);
        }
        if (typeof value === 'function') {
          return (value as (...args: unknown[]) => unknown).bind(target);
        }
        return value;
      },
    });
  }) as typeof window.getComputedStyle;

  return () => {
    window.getComputedStyle = original;
  };
}

function sanitizeClonedTree(root: ParentNode): void {
  const elements = root.querySelectorAll<HTMLElement>('*');
  for (const el of elements) {
    const inline = el.getAttribute('style');
    if (inline) {
      const cleaned = replaceUnsupportedColorFns(inline);
      if (cleaned !== inline) {
        el.setAttribute('style', cleaned);
      }
    }
  }
}

function placeholderPng(message: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f3f2f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#323130';
    ctx.font = '16px Segoe UI';
    ctx.fillText(message, 24, 40);
    ctx.fillStyle = '#605e5c';
    ctx.font = '13px Segoe UI';
    ctx.fillText('JSON evidence / highlights vẫn đầy đủ trong gói.', 24, 68);
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG fail'))), 'image/png');
  });
}

async function captureWorkspacePng(root: HTMLElement | null): Promise<Blob> {
  if (!root) {
    return placeholderPng('Workspace snapshot unavailable');
  }

  const restore = installComputedStyleSanitizer();
  try {
    const canvas = await html2canvas(root, {
      backgroundColor: '#f3f2f1',
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      windowWidth: root.scrollWidth,
      windowHeight: root.scrollHeight,
      onclone: (clonedDoc: Document) => {
        sanitizeClonedTree(clonedDoc);
      },
    } as Parameters<typeof html2canvas>[1]);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG fail'))), 'image/png');
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/oklab|oklch|unsupported color/i.test(msg)) {
      return placeholderPng('Snapshot bỏ qua (CSS màu hiện đại)');
    }
    return placeholderPng(`Snapshot lỗi: ${msg.slice(0, 80)}`);
  } finally {
    restore();
  }
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export type ReviewExportResult = {
  filename: string;
  storagePath: string;
  sizeBytes: number;
};

export async function exportReviewPackage(
  input: ReviewExportInput,
): Promise<ReviewExportResult> {
  const zip = new JSZip();
  const folder = zip.folder('review-package');
  if (!folder) {
    throw new Error('Không tạo được thư mục ZIP.');
  }

  const png = await captureWorkspacePng(input.rootElement);
  folder.file('workspace.png', png);
  folder.file(
    'knowledge-tree.json',
    JSON.stringify(buildKnowledgeTree(input.assignments), null, 2),
  );
  folder.file(
    'highlight.json',
    JSON.stringify(buildHighlights(input.assignments), null, 2),
  );
  folder.file('evidence.json', JSON.stringify(buildEvidence(input.evidence), null, 2));
  folder.file('session.json', JSON.stringify(buildSession(input), null, 2));
  folder.file(
    'performance.json',
    JSON.stringify(buildPerformance(input), null, 2),
  );
  folder.file('environment.json', JSON.stringify(buildEnvironment(), null, 2));
  folder.file('README.txt', buildReadme());

  if (input.dil) {
    folder.file(
      'raw-text.json',
      JSON.stringify(
        {
          documentId: input.dil.documentId,
          dilVersion: input.dil.dilVersion,
          rawText: input.dil.rawText,
        },
        null,
        2,
      ),
    );
    folder.file(
      'normalized-text.json',
      JSON.stringify(
        {
          documentId: input.dil.documentId,
          dilVersion: input.dil.dilVersion,
          normalizedText: input.dil.normalizedText,
        },
        null,
        2,
      ),
    );
    folder.file(
      'confidence.json',
      JSON.stringify(
        {
          overallConfidence: input.dil.overallConfidence,
          stats: input.dil.stats,
          blocks: input.dil.blocks.map((b) => ({
            id: b.id,
            index: b.index,
            confidence: b.confidence,
            factors: b.factors,
            structureRole: b.structureRole,
          })),
        },
        null,
        2,
      ),
    );
    folder.file(
      'suspicious.json',
      JSON.stringify(
        {
          items: input.dil.blocks
            .filter((b) => b.suspicious)
            .map((b) => ({
              id: b.id,
              rawText: b.rawText,
              normalizedText: b.normalizedText,
              reasons: b.suspiciousReasons,
              suggestions: b.suggestions,
            })),
        },
        null,
        2,
      ),
    );
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const filename = `review-${input.document.id.slice(0, 8)}-${stamp()}.zip`;

  // Local download for reviewer convenience
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  // Persist under storage/review/ via API
  const body = new FormData();
  body.append('file', blob, filename);
  return apiUpload<{
    filename: string;
    storagePath: string;
    sizeBytes: number;
  }>('/review/packages', {
    body,
    fallbackError: 'Lưu gói Review thất bại',
  });
}
