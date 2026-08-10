/** Find similar text fragments in a page corpus (deterministic, no AI). */

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

export function findSimilarFragments(
  sourceText: string,
  corpus: string,
  options?: { minLength?: number; maxResults?: number },
): string[] {
  const minLength = options?.minLength ?? 12;
  const maxResults = options?.maxResults ?? 20;
  const needle = normalize(sourceText);
  if (needle.length < minLength) {
    return [];
  }

  const hay = corpus;
  const hayNorm = normalize(hay);
  if (!hayNorm.includes(needle)) {
    // try shorter core (first 40 chars)
    const core = needle.slice(0, Math.min(40, needle.length));
    if (core.length < minLength || !hayNorm.includes(core)) {
      return [];
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();
  const probe = needle.length > 48 ? needle.slice(0, 48) : needle;

  // Scan original corpus with loose whitespace
  const re = new RegExp(
    probe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'),
    'gi',
  );
  let match: RegExpExecArray | null;
  while ((match = re.exec(hay)) !== null && out.length < maxResults) {
    const snippet = match[0].replace(/\s+/g, ' ').trim();
    const key = normalize(snippet);
    if (!key || key === needle || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(snippet);
  }
  return out;
}
