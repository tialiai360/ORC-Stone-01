import type { Rect, TextItemGeom, TextLine } from './types';

export function median(nums: number[]): number {
  if (nums.length === 0) {
    return 0;
  }
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function boundsOf(items: Rect[]): Rect {
  const minX = Math.min(...items.map((i) => i.x));
  const minY = Math.min(...items.map((i) => i.y));
  const maxX = Math.max(...items.map((i) => i.x + i.w));
  const maxY = Math.max(...items.map((i) => i.y + i.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function center(r: Rect): { cx: number; cy: number } {
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}

export function joinLineItems(items: TextItemGeom[]): string {
  if (items.length === 0) {
    return '';
  }
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let out = sorted[0]!.text;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const gap = cur.x - (prev.x + prev.w);
    const spaceThreshold = Math.max(0.8, median([prev.h, cur.h]) * 0.12);
    if (gap <= spaceThreshold) {
      out += cur.text;
    } else {
      out = `${out.replace(/\s+$/, '')} ${cur.text.replace(/^\s+/, '')}`;
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function buildLines(items: TextItemGeom[]): TextLine[] {
  const usable = items.filter((i) => i.text.trim().length > 0 && i.w > 0 && i.h > 0);
  if (usable.length === 0) {
    return [];
  }
  const medH = median(usable.map((i) => i.h)) || 12;
  const yTol = Math.max(2, medH * 0.55);
  const sorted = [...usable].sort((a, b) => a.y - b.y || a.x - b.x);
  const groups: TextItemGeom[][] = [];
  for (const item of sorted) {
    const last = groups[groups.length - 1];
    if (!last) {
      groups.push([item]);
      continue;
    }
    const lastY = median(last.map((i) => i.y + i.h / 2));
    const itemY = item.y + item.h / 2;
    if (Math.abs(itemY - lastY) <= yTol) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups.map((group, idx) => {
    const sortedGroup = [...group].sort((a, b) => a.x - b.x);
    const b = boundsOf(sortedGroup);
    return {
      id: `line-${idx}`,
      text: joinLineItems(sortedGroup),
      items: sortedGroup,
      ...b,
    };
  });
}

export function parseRotationDeg(el: HTMLElement): number {
  const t = el.style.transform || getComputedStyle(el).transform;
  if (!t || t === 'none') {
    return 0;
  }
  const m3 = t.match(/matrix3d\(([^)]+)\)/);
  if (m3) {
    const parts = m3[1]!.split(',').map((x) => Number(x.trim()));
    // matrix3d: a=m11, b=m12 at indices 0,1
    const a = parts[0] ?? 1;
    const b = parts[1] ?? 0;
    return (Math.atan2(b, a) * 180) / Math.PI;
  }
  const m = t.match(/matrix\(([^)]+)\)/);
  if (m) {
    const parts = m[1]!.split(',').map((x) => Number(x.trim()));
    const a = parts[0] ?? 1;
    const b = parts[1] ?? 0;
    return (Math.atan2(b, a) * 180) / Math.PI;
  }
  const r = t.match(/rotate\(([-\d.]+)deg\)/);
  return r ? Number(r[1]) : 0;
}

/** Collect geometry from rendered react-pdf text layer spans. */
export function collectItemsFromTextLayer(pageEl: HTMLElement): {
  items: TextItemGeom[];
  pageWidth: number;
  pageHeight: number;
} {
  const pageRect = pageEl.getBoundingClientRect();
  const spans = pageEl.querySelectorAll<HTMLElement>(
    '.react-pdf__Page__textContent span, .textLayer span',
  );
  const items: TextItemGeom[] = [];
  let idx = 0;
  spans.forEach((el) => {
    const text = (el.textContent ?? '').replace(/\u00a0/g, ' ');
    if (!text.trim()) {
      return;
    }
    const r = el.getBoundingClientRect();
    const rotationDeg = parseRotationDeg(el);
    const opacity = Number(getComputedStyle(el).opacity || '1');
    const offPage =
      r.right < pageRect.left - 2 ||
      r.left > pageRect.right + 2 ||
      r.bottom < pageRect.top - 2 ||
      r.top > pageRect.bottom + 2;
    const collapsed = r.width < 0.5 || r.height < 0.5;
    const invisible = collapsed || offPage || opacity < 0.08;
    items.push({
      id: `item-${idx++}`,
      text,
      x: r.left - pageRect.left,
      y: r.top - pageRect.top,
      w: Math.max(r.width, 0),
      h: Math.max(r.height, 0),
      rotationDeg,
      opacityHint: opacity,
      flags: { invisible },
    });
    el.dataset.orcItemId = items[items.length - 1]!.id;
    if (invisible) {
      el.dataset.orcInvisible = '1';
    }
  });
  return {
    items,
    pageWidth: pageRect.width,
    pageHeight: pageRect.height,
  };
}
