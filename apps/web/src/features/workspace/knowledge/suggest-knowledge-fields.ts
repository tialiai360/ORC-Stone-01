/**
 * Deterministic Knowledge field suggestions from page corpora.
 * Suggest ≠ commit — human must Accept (G3 gate).
 * No OCR / AI.
 */

import type { ClassificationAssignment, KnowledgeNodeId } from '@orc/shared';

export type FieldSuggestion = {
  id: string;
  nodeId: KnowledgeNodeId;
  text: string;
  pageNumber: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
};

type PageCorpus = Record<number, string>;

function clean(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function isPlausibleSoVanBan(text: string): boolean {
  const t = clean(text);
  if (t.length < 4) return false;
  // Reject «V/v» / «Về việc» tokens mistaken for document numbers (EC-001).
  if (/^V\/v\b/i.test(t)) return false;
  if (/^Về\s*việc\b/i.test(t)) return false;
  if (/^(thông báo|quyết định|công văn)\b/i.test(t)) return false;
  // Require a real Số pattern: digits + slash + unit code (or clear Số: capture with digit).
  if (!/\d{2,}\//.test(t) && !/^\d{2,}[A-ZÁÀẢÃẠÂĂĐÉÈẺẼẸÊÍÌỈĨỊÓÒỎÕỌÔƠÚÙỦŨỤƯÝỲỶỸỴ]/i.test(t)) {
    return false;
  }
  return true;
}

function firstGroup(text: string, re: RegExp): string | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  if (!m) {
    return null;
  }
  return clean(m[1] ?? m[0]);
}

function scanPages(
  pages: PageCorpus,
  tryOne: (corpus: string) => string | null,
): { text: string; pageNumber: number } | null {
  const nums = Object.keys(pages)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  for (const p of nums) {
    const corpus = pages[p] ?? '';
    if (!corpus.trim()) {
      continue;
    }
    const hit = tryOne(corpus);
    if (hit && hit.length >= 2) {
      return { text: hit, pageNumber: p };
    }
  }
  return null;
}

/** Nodes that accept multiple separate dossier entries (each dòng = một VB/mục). */
const MULTI_VALUE_NODES = new Set<KnowledgeNodeId>([
  'can-cu',
  'noi-nhan',
  'van-ban-lien-quan',
  'bieu-mau',
]);

/** Exported for unit tests. */
export function extractCanCuItems(corpus: string): string[] {
  const lines = corpus.split(/\n+/).map((l) => clean(l)).filter(Boolean);
  const out: string[] = [];
  const isCanCuLine = (s: string) => /^(?:[-–•*]\s*)?Căn\s*cứ(?=\s|[:：]|$)/iu.test(s);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const m = /^(?:[-–•*]\s*)?Căn\s*cứ\s*[:：]?\s*(.*)$/iu.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    let body = clean(m[1] ?? '');
    // Avoid swallowing the next «Căn cứ …» line
    if (isCanCuLine(body)) {
      body = '';
    }
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? '';
      if (isCanCuLine(next)) {
        break;
      }
      if (/^(Về việc|Nơi nhận|Điều|Khoản|Yêu cầu)\b/iu.test(next)) {
        break;
      }
      if (body.length < 40 || /[,;…]$/.test(body) || /^(số|ngày|của|và)\b/iu.test(next)) {
        body = clean(`${body} ${next}`);
        i += 1;
        continue;
      }
      break;
    }
    const text =
      body.length >= 8
        ? body.match(/^Căn\s*cứ/iu)
          ? body
          : `Căn cứ ${body}`
        : line.replace(/^[-–•*]\s*/, '');
    if (clean(text).length >= 8) {
      out.push(clean(text));
    }
  }
  const seen = new Set<string>();
  return out.filter((t) => {
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Core-field heuristics for VN administrative / HO notices. */
export function suggestKnowledgeFields(
  pages: PageCorpus,
  assignments: ClassificationAssignment[],
): FieldSuggestion[] {
  const filled = new Set(assignments.map((a) => a.nodeId));
  const assignedText = new Set(
    assignments.map((a) => `${a.nodeId}::${clean(a.text).toLowerCase()}`),
  );
  const out: FieldSuggestion[] = [];

  const push = (
    nodeId: KnowledgeNodeId,
    hit: { text: string; pageNumber: number } | null,
    confidence: FieldSuggestion['confidence'],
    reason: string,
  ) => {
    if (!hit) {
      return;
    }
    if (!MULTI_VALUE_NODES.has(nodeId) && filled.has(nodeId)) {
      return;
    }
    const key = `${nodeId}::${clean(hit.text).toLowerCase()}`;
    if (assignedText.has(key)) {
      return;
    }
    if (out.some((s) => s.nodeId === nodeId && clean(s.text).toLowerCase() === clean(hit.text).toLowerCase())) {
      return;
    }
    out.push({
      id: `sug-${nodeId}-${hit.pageNumber}-${hit.text.slice(0, 32).replace(/\s+/g, '_')}`,
      nodeId,
      text: hit.text.slice(0, 500),
      pageNumber: hit.pageNumber,
      confidence,
      reason,
    });
  };

  const pushMany = (
    nodeId: KnowledgeNodeId,
    items: Array<{ text: string; pageNumber: number }>,
    confidence: FieldSuggestion['confidence'],
    reason: string,
  ) => {
    for (const hit of items) {
      push(nodeId, hit, confidence, reason);
    }
  };

  push(
    'so-van-ban',
    scanPages(pages, (c) => {
      const hit =
        firstGroup(c, /(?:^|\n)\s*Số\s*[:：]\s*([0-9]{2,}\/[A-Za-zÀ-ỹ0-9.\-]+)/im) ??
        firstGroup(c, /(?:^|\n)\s*Số\s*[:：]?\s*([0-9]{2,}\/[A-Za-zÀ-ỹ0-9.\-]+)/im) ??
        firstGroup(c, /\b(\d{4,}\/[A-Z]{2,}[A-Z0-9\-]*)\b/);
      if (!hit || !isPlausibleSoVanBan(hit)) {
        return null;
      }
      return hit;
    }),
    'HIGH',
    'Khớp mẫu Số văn bản',
  );

  push(
    'ngay-ban-hanh',
    scanPages(pages, (c) => {
      const vn = firstGroup(
        c,
        /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,
      );
      if (vn) {
        const m = /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i.exec(c);
        if (m) {
          return `${m[1]}/${m[2]}/${m[3]}`;
        }
      }
      return (
        firstGroup(c, /(?:^|\n)\s*Ngày\s*[:：]\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})/im) ??
        firstGroup(c, /\b(\d{1,2}[/.]\d{1,2}[/.]\d{4})\b/)
      );
    }),
    'HIGH',
    'Khớp mẫu ngày ban hành',
  );

  push(
    'trich-yeu',
    scanPages(pages, (c) => {
      return (
        firstGroup(c, /Về việc\s*[:：]?\s*(.+?)(?:\n|$)/i) ??
        firstGroup(c, /(?:^|\n)\s*V\/v\s+(.+?)(?:\n|$)/im) ??
        firstGroup(c, /(?:^|\n)\s*Trích yếu\s*[:：]\s*(.+)$/im)
      );
    }),
    'HIGH',
    'Khớp «Về việc» / V/v / Trích yếu',
  );

  push(
    'loai-van-ban',
    scanPages(pages, (c) => {
      const lower = c.toLowerCase();
      const types: Array<[string, string]> = [
        ['thông báo', 'Thông báo'],
        ['quyết định', 'Quyết định'],
        ['công văn', 'Công văn'],
        ['tờ trình', 'Tờ trình'],
        ['hướng dẫn', 'Hướng dẫn'],
        ['chỉ thị', 'Chỉ thị'],
      ];
      for (const [key, label] of types) {
        if (lower.includes(key)) {
          return label;
        }
      }
      return null;
    }),
    'MEDIUM',
    'Từ khóa loại văn bản',
  );

  push(
    'don-vi-ban-hanh',
    scanPages(pages, (c) => {
      return (
        firstGroup(c, /(?:^|\n)\s*(NGÂN HÀNG[^\n]{5,80})/m) ??
        firstGroup(c, /(?:^|\n)\s*(CÔNG TY[^\n]{5,80})/m) ??
        firstGroup(
          c,
          /(?:Cơ quan ban hành|Đơn vị ban hành)\s*[:：]\s*(.+)$/im,
        )
      );
    }),
    'MEDIUM',
    'Dòng đơn vị / cơ quan',
  );

  push(
    'thoi-han',
    scanPages(pages, (c) => {
      return (
        firstGroup(
          c,
          /(?:trước ngày|chậm nhất|hạn(?:\s+chót)?|deadline)\s*[:：]?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{2,4})/i,
        ) ??
        firstGroup(
          c,
          /(?:trước ngày|chậm nhất ngày)\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,
        )
      );
    }),
    'HIGH',
    'Khớp mẫu thời hạn',
  );

  // Mỗi «Căn cứ …» = một công văn / căn cứ pháp lý riêng → gợi ý tách
  {
    const nums = Object.keys(pages)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const items: Array<{ text: string; pageNumber: number }> = [];
    for (const p of nums) {
      for (const text of extractCanCuItems(pages[p] ?? '')) {
        items.push({ text, pageNumber: p });
      }
    }
    pushMany('can-cu', items, 'HIGH', 'Tách từng dòng «Căn cứ»');
  }

  push(
    'noi-nhan',
    scanPages(pages, (c) => {
      const idx = c.search(/Nơi nhận\s*[:：]?/i);
      if (idx < 0) {
        return null;
      }
      const slice = c.slice(idx, idx + 400);
      const body = slice.replace(/^Nơi nhận\s*[:：]?\s*/i, '');
      const line = body.split(/\n+/).map(clean).filter(Boolean).slice(0, 6);
      return line.length ? line.join('; ') : null;
    }),
    'MEDIUM',
    'Khối Nơi nhận',
  );

  push(
    'yeu-cau',
    scanPages(pages, (c) => {
      return firstGroup(
        c,
        /(?:^|\n)\s*((?:Yêu cầu|Đề nghị|Chỉ đạo)\s*[:：]?.{10,200}?)(?:\n|$)/im,
      );
    }),
    'LOW',
    'Dòng yêu cầu / đề nghị',
  );

  push(
    'nguoi-ky',
    scanPages(pages, (c) => {
      return (
        firstGroup(c, /(?:KT\.|TM\.|TL\.)\s*([A-ZÀ-Ỹ][^\n]{5,60})/m) ??
        firstGroup(c, /(?:Người ký|Giám đốc|Phó giám đốc)\s*[:：]?\s*([^\n]{5,60})/im)
      );
    }),
    'LOW',
    'Gợi ý chữ ký / chức danh',
  );

  // Supersede / ban hành lại → future reference (EC-004)
  {
    const nums = Object.keys(pages)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const items: Array<{ text: string; pageNumber: number }> = [];
    for (const p of nums) {
      const c = pages[p] ?? '';
      if (!/thay\s*thế|ban\s*hành\s*lại/i.test(c)) continue;
      const re =
        /(?:Công văn|CV|Quyết định|QĐ)?\s*số\s*([0-9]{2,}\/[A-Za-zÀ-ỹ0-9.\-]+)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(c)) !== null) {
        const num = clean(m[1] ?? '');
        if (num.length >= 5) {
          items.push({
            text: `Thay thế / liên quan: ${num}`,
            pageNumber: p,
          });
        }
      }
    }
    pushMany(
      'van-ban-lien-quan',
      items.slice(0, 6),
      'HIGH',
      'Phát hiện thay thế / ban hành lại',
    );
  }

  return out;
}

type TableRegionInput = {
  pageNumber: number;
  regions: Array<{ kind?: string; moduleId?: string; text: string; label?: string; id?: string }>;
};

/** Suggest each detected table as a separate «Biểu mẫu» entry (markdown grid). */
export function suggestTablesAsBieuMau(
  pages: TableRegionInput[],
  assignments: ClassificationAssignment[],
): FieldSuggestion[] {
  const assignedText = new Set(
    assignments
      .filter((a) => a.nodeId === 'bieu-mau')
      .map((a) => clean(a.text).toLowerCase()),
  );
  const out: FieldSuggestion[] = [];
  for (const page of pages) {
    for (const r of page.regions) {
      const isTable = r.kind === 'table' || r.moduleId === 'table';
      if (!isTable || !r.text.trim()) {
        continue;
      }
      const text = r.text.trim().slice(0, 4000);
      if (assignedText.has(clean(text).toLowerCase())) {
        continue;
      }
      if (out.some((s) => clean(s.text).toLowerCase() === clean(text).toLowerCase())) {
        continue;
      }
      const pipeRows = text.split('\n').filter((l) => l.trim().startsWith('|')).length;
      out.push({
        id: `sug-bieu-mau-${page.pageNumber}-${r.id ?? out.length}`,
        nodeId: 'bieu-mau',
        text,
        pageNumber: page.pageNumber,
        confidence: pipeRows >= 3 ? 'HIGH' : 'MEDIUM',
        reason: r.label?.startsWith('Bảng')
          ? `Tách bảng ${r.label}`
          : 'Tách bảng từ vùng table',
      });
    }
  }
  return out;
}
