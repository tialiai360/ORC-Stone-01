import { PRESERVED_SYMBOL_SET } from './character-preservation';
import { countPreservedSymbols } from './vietnamese-normalization';

export type ConfidenceFactors = {
  characterQuality: number;
  unicodeValidity: number;
  structureValidity: number;
  specialSymbolPreservation: number;
  suspiciousWordRatio: number;
};

const SUSPICIOUS_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /Ngãn\s*hàng/i, reason: 'Ngãn hàng' },
  { re: /Đổi\s*tượng/i, reason: 'Đổi tượng' },
  { re: /Thõng\s*tư/i, reason: 'Thõng tư' },
  { re: /\bB1DV\b/, reason: 'B1DV' },
  { re: /[\uFFFD]/, reason: 'Unknown Unicode' },
  { re: /[^\S\r\n]*\uFFFD/, reason: 'Unknown Unicode' },
];

/** Heuristic broken Vietnamese diacritic / mojibake tokens. */
const BROKEN_TOKEN_RE =
  /(?:ã|õ|ð|ø|þ|�|[A-Za-z]*[ăâêôơưđ][A-Za-z]*[aeiouy]{3,}|\b\w*[ÃÕ][^\s]{0,4}\b)/i;

export function detectSuspicious(raw: string, normalized: string): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  for (const p of SUSPICIOUS_PATTERNS) {
    if (p.re.test(raw) || p.re.test(normalized)) {
      reasons.push(p.reason);
    }
  }
  // Private-use / control chars (except common whitespace already stripped)
  for (const ch of raw) {
    const code = ch.codePointAt(0) ?? 0;
    if (
      (code >= 0xe000 && code <= 0xf8ff) ||
      (code < 32 && code !== 9 && code !== 10 && code !== 13)
    ) {
      reasons.push('Unknown Unicode');
      break;
    }
  }
  if (/[•●▪✓➜→←①②③]/.test(raw) === false && /[?]{2,}/.test(normalized)) {
    reasons.push('Missing symbols');
  }
  if (BROKEN_TOKEN_RE.test(normalized) && reasons.length === 0) {
    // soft mark — only if not already flagged
  }
  return { suspicious: reasons.length > 0, reasons: [...new Set(reasons)] };
}

export function evaluateConfidence(input: {
  rawText: string;
  normalizedText: string;
  structureRole: string;
}): { confidence: number; factors: ConfidenceFactors } {
  const { rawText, normalizedText, structureRole } = input;

  // Character quality: printable ratio
  let printable = 0;
  for (const ch of rawText) {
    const c = ch.codePointAt(0) ?? 0;
    if (c === 10 || c === 9 || (c >= 32 && c !== 0xfffd)) {
      printable += 1;
    }
  }
  const characterQuality =
    rawText.length === 0 ? 0 : Math.round((printable / rawText.length) * 100);

  // Unicode validity: NFC stable + no replacement char
  const nfc = rawText.normalize('NFC');
  const replacementCount = (rawText.match(/\uFFFD/g) ?? []).length;
  const unicodeValidity = Math.max(
    0,
    100 -
      replacementCount * 25 -
      (nfc === rawText.normalize('NFD') && rawText !== nfc ? 0 : 0) -
      (rawText !== nfc ? 5 : 0),
  );

  // Structure validity
  const structureValidity =
    structureRole === 'unknown' ? 70 : structureRole === 'paragraph' ? 85 : 95;

  // Special symbol preservation
  const rawSym = countPreservedSymbols(rawText);
  const normSym = countPreservedSymbols(normalizedText);
  let specialSymbolPreservation = 100;
  if (rawSym > 0) {
    specialSymbolPreservation = Math.round((normSym / rawSym) * 100);
  } else {
    // bonus if unknown symbols not stripped (any non-ascii letter ok)
    specialSymbolPreservation = 100;
  }
  for (const ch of rawText) {
    if (PRESERVED_SYMBOL_SET.has(ch) && !normalizedText.includes(ch)) {
      specialSymbolPreservation = Math.min(specialSymbolPreservation, 40);
    }
  }

  // Suspicious word ratio
  const tokens = normalizedText.split(/\s+/).filter(Boolean);
  const suspiciousTokens = tokens.filter(
    (t) => SUSPICIOUS_PATTERNS.some((p) => p.re.test(t)) || t.includes('\uFFFD'),
  ).length;
  const suspiciousWordRatio =
    tokens.length === 0
      ? 0
      : Math.round((suspiciousTokens / tokens.length) * 100);
  const suspiciousScore = Math.max(0, 100 - suspiciousWordRatio * 4);

  const factors: ConfidenceFactors = {
    characterQuality,
    unicodeValidity: Math.max(0, Math.min(100, unicodeValidity)),
    structureValidity,
    specialSymbolPreservation: Math.max(0, Math.min(100, specialSymbolPreservation)),
    suspiciousWordRatio,
  };

  const confidence = Math.round(
    factors.characterQuality * 0.25 +
      factors.unicodeValidity * 0.25 +
      factors.structureValidity * 0.2 +
      factors.specialSymbolPreservation * 0.15 +
      suspiciousScore * 0.15,
  );

  return { confidence: Math.max(0, Math.min(100, confidence)), factors };
}
