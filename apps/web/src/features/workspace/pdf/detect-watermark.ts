import { boundsOf, center } from './geometry';
import type { StructureRegion, TextItemGeom, TextLine } from './types';

const WATERMARK_WORDS: RegExp[] = [
  /\bdraft\b/i,
  /\binternal\b/i,
  /\bconfidential\b/i,
  /\bprivate\b/i,
  /\bsample\b/i,
  /\bcopy\b/i,
  /bản\s*thảo/i,
  /nội\s*bộ/i,
  /mật|tối\s*mật|tuyệt\s*mật/i,
  /không\s*sao\s*chép/i,
  /scan|scanned/i,
  /\bbidv\b/i,
  /ngân\s*hàng\s*tmcp/i,
];

/**
 * Watermark / overlay text — excluded from reading order.
 * Presentation may hide; raw PDF never mutated.
 */
export function detectWatermarkRegions(
  items: TextItemGeom[],
  lines: TextLine[],
  pageWidth: number,
  pageHeight: number,
): StructureRegion[] {
  const regions: StructureRegion[] = [];
  const hitItems: TextItemGeom[] = [];

  for (const item of items) {
    const rot = Math.abs(item.rotationDeg ?? 0);
    const rotated = rot > 12 && rot < 168;
    const vertical = rot >= 70 && rot <= 110;
    const faded = (item.opacityHint ?? 1) < 0.55;
    const wordHit = WATERMARK_WORDS.some((re) => re.test(item.text));
    const { cx, cy } = center(item);
    const centered =
      Math.abs(cx - pageWidth / 2) < pageWidth * 0.32 &&
      Math.abs(cy - pageHeight / 2) < pageHeight * 0.38;
    const large = item.w > pageWidth * 0.18 || item.h > pageHeight * 0.035;
    const longToken = item.text.replace(/\s+/g, '').length >= 3;
    // Bank diagonal logo: rotated + mid-page, even when opacity ~1
    const diagonalChrome = rotated && centered && longToken;
    const diagonalLarge = rotated && large && longToken;

    if (
      wordHit ||
      (rotated && wordHit) ||
      (rotated && faded && (large || longToken)) ||
      diagonalChrome ||
      diagonalLarge ||
      (vertical && faded && longToken) ||
      (vertical && wordHit) ||
      (faded && centered && large)
    ) {
      item.flags = { ...item.flags, watermark: true };
      hitItems.push(item);
    }
  }

  for (const line of lines) {
    if (WATERMARK_WORDS.some((re) => re.test(line.text))) {
      for (const it of line.items) {
        it.flags = { ...it.flags, watermark: true };
        if (!hitItems.some((h) => h.id === it.id)) {
          hitItems.push(it);
        }
      }
    }
  }

  if (hitItems.length === 0) {
    return regions;
  }

  const used = new Set<string>();
  let idx = 0;
  for (const seed of hitItems) {
    if (used.has(seed.id)) {
      continue;
    }
    const cluster = hitItems.filter((it) => {
      if (used.has(it.id)) {
        return false;
      }
      const dx = center(it).cx - center(seed).cx;
      const dy = center(it).cy - center(seed).cy;
      return Math.hypot(dx, dy) < Math.max(pageWidth, pageHeight) * 0.4;
    });
    cluster.forEach((c) => used.add(c.id));
    const b = boundsOf(cluster);
    regions.push({
      id: `region-watermark-${idx++}`,
      kind: 'watermark',
      label: 'Watermark',
      text: cluster.map((c) => c.text).join(' '),
      itemIds: cluster.map((c) => c.id),
      excludeFromReadingOrder: true,
      selectable: true,
      moduleId: 'watermark',
      ...b,
    });
  }
  return regions;
}
