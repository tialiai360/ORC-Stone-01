/**
 * Pure CSS color sanitizer for html2canvas (no DOM).
 * Kept separate so unit tests can cover nested color-mix / oklab.
 */

const UNSUPPORTED_COLOR_FNS = ['oklab', 'oklch', 'lab', 'lch', 'color-mix', 'color'] as const;

export function replaceUnsupportedColorFns(value: string): string {
  if (!/(?:oklab|oklch|\blab\b|\blch\b|color-mix|\bcolor\s*\()/i.test(value)) {
    return value;
  }

  let result = value;
  for (const name of UNSUPPORTED_COLOR_FNS) {
    const re = new RegExp(`\\b${name}\\s*\\(`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = re.exec(result)) !== null) {
      const start = match.index;
      let depth = 1;
      let i = start + match[0].length;
      while (i < result.length && depth > 0) {
        const ch = result[i];
        if (ch === '(') {
          depth += 1;
        } else if (ch === ')') {
          depth -= 1;
        }
        i += 1;
      }
      if (depth !== 0) {
        break;
      }
      result = `${result.slice(0, start)}transparent${result.slice(i)}`;
      re.lastIndex = start + 'transparent'.length;
    }
  }
  return result;
}
