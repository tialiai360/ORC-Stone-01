import { boundsOf } from './geometry';
import type { StructureRegion, TextItemGeom, TextLine } from './types';

const HEADER_PATTERNS: RegExp[] = [
  /cộng\s*hòa\s*xã\s*hội/i,
  /độc\s*lập\s*[-–—]\s*tự\s*do/i,
  /hạnh\s*phúc/i,
  /socialist\s*republic/i,
  /independence\s*[-–—]\s*freedom/i,
  /quốc\s*hiệu/i,
  /tiêu\s*ngữ/i,
  /^s[ốô]\s*:?\s*[\w\-\/.]+/i,
  /ngày\s+\d{1,2}\s*tháng/i,
];

const AGENCY_HINT =
  /(ủy\s*ban|sở\s+|bộ\s+|tổng\s*cục|cục\s+|ban\s+hành|cơ\s*quan)/i;

/** Detect header band + quốc hiệu / tiêu ngữ / số VB / ngày. */
export function detectHeaderRegions(
  lines: TextLine[],
  _items: TextItemGeom[],
  pageWidth: number,
  pageHeight: number,
): StructureRegion[] {
  if (pageHeight <= 0) {
    return [];
  }
  const band = pageHeight * 0.2;
  const topLines = lines.filter((l) => l.y + l.h / 2 < band);
  if (topLines.length === 0) {
    return [];
  }

  const patternHits = topLines.filter(
    (l) => HEADER_PATTERNS.some((re) => re.test(l.text)) || AGENCY_HINT.test(l.text),
  );

  let headerLines: TextLine[] = [];
  if (patternHits.length > 0) {
    const yMax = Math.max(...patternHits.map((l) => l.y + l.h)) + pageHeight * 0.015;
    // Only pull neighbors that are still in the top band and short (avoid body).
    headerLines = topLines.filter(
      (l) => l.y <= yMax && (patternHits.includes(l) || l.text.length <= 90),
    );
  } else {
    // Geometric fallback: strict top 8%, short, centered — e.g. logo captions.
    headerLines = topLines.filter((l) => {
      const centered = Math.abs(l.x + l.w / 2 - pageWidth / 2) < pageWidth * 0.2;
      return l.y < pageHeight * 0.08 && l.text.length <= 50 && centered;
    });
  }

  if (headerLines.length === 0) {
    return [];
  }

  const b = boundsOf(headerLines);
  const text = headerLines.map((l) => l.text).join('\n');
  const itemIds = headerLines.flatMap((l) => l.items.map((i) => i.id));

  return [
    {
      id: 'region-header-0',
      kind: 'header',
      label: 'Header',
      text,
      itemIds,
      excludeFromReadingOrder: true,
      selectable: true,
      ...b,
    },
  ];
}

const FOOTER_PATTERNS: RegExp[] = [
  /nơi\s*nhận/i,
  /trang\s*\d+\s*\/\s*\d+/i,
  /^\d+\s*\/\s*\d+\s*$/,
  /page\s*\d+\s*(of|\/)\s*\d+/i,
  /chữ\s*ký\s*số/i,
  /digital\s*signature/i,
  /ký\s*bởi|signed\s*by/i,
];

const SIGNATURE_PATTERNS: RegExp[] = [
  /chữ\s*ký/i,
  /\btm\.\s*/i,
  /\bkt\.\s*/i,
  /thừa\s*ủy\s*quyền/i,
  /giám\s*đốc|thủ\s*trưởng|chủ\s*tịch/i,
  /signature/i,
];

export function detectFooterAndSignatureRegions(
  lines: TextLine[],
  pageWidth: number,
  pageHeight: number,
): StructureRegion[] {
  if (pageHeight <= 0) {
    return [];
  }
  const regions: StructureRegion[] = [];
  const footerBand = pageHeight * 0.78;
  const bottom = lines.filter((l) => l.y + l.h / 2 > footerBand);
  if (bottom.length === 0) {
    return regions;
  }

  const patternFooter = bottom.filter((l) => FOOTER_PATTERNS.some((re) => re.test(l.text)));
  // Geometric page numbers / short trailing lines only in bottom 10%
  const geoFooter = bottom.filter(
    (l) =>
      l.y > pageHeight * 0.9 &&
      (FOOTER_PATTERNS.some((re) => re.test(l.text)) || /^\d+\s*\/\s*\d+$/.test(l.text.trim())),
  );

  // If "Nơi nhận" found, take contiguous block from that line downward
  const noiNhan = bottom.find((l) => /nơi\s*nhận/i.test(l.text));
  let useFooter: TextLine[] = [...patternFooter, ...geoFooter];
  if (noiNhan) {
    useFooter = bottom.filter((l) => l.y >= noiNhan.y - 2);
  }
  // dedupe
  const seen = new Set<string>();
  useFooter = useFooter.filter((l) => {
    if (seen.has(l.id)) {
      return false;
    }
    seen.add(l.id);
    return true;
  });

  const sigLines = bottom.filter((l) => SIGNATURE_PATTERNS.some((re) => re.test(l.text)));

  if (useFooter.length > 0) {
    const sigIds = new Set(sigLines.map((l) => l.id));
    const pureFooter = useFooter.filter((l) => !sigIds.has(l.id));
    const footerUse = pureFooter.length > 0 ? pureFooter : useFooter;
    const b = boundsOf(footerUse);
    regions.push({
      id: 'region-footer-0',
      kind: 'footer',
      label: 'Footer',
      text: footerUse.map((l) => l.text).join('\n'),
      itemIds: footerUse.flatMap((l) => l.items.map((i) => i.id)),
      excludeFromReadingOrder: true,
      selectable: true,
      ...b,
    });
  }

  const stampish = bottom.filter(
    (l) =>
      SIGNATURE_PATTERNS.some((re) => re.test(l.text)) ||
      /qr|mã\s*qr|dấu/i.test(l.text) ||
      (l.x > pageWidth * 0.5 && l.y > pageHeight * 0.72 && l.text.length < 48),
  );
  if (stampish.length > 0) {
    const b = boundsOf(stampish);
    regions.push({
      id: 'region-signature-0',
      kind: 'signature',
      label: 'Signature / Stamp',
      text: stampish.map((l) => l.text).join('\n'),
      itemIds: stampish.flatMap((l) => l.items.map((i) => i.id)),
      excludeFromReadingOrder: true,
      selectable: true,
      ...b,
    });
  }

  return regions;
}
