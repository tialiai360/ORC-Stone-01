import {
  KnowledgePackId,
  VietnameseKnowledgePack,
} from '@orc/shared';

/**
 * Knowledge Pack interface + tiny seed corrections for DIL-001 demo.
 * No large dictionary — packs stay thin until later waves.
 */
export const KNOWLEDGE_PACKS: readonly VietnameseKnowledgePack[] = [
  {
    id: 'vietnamese-official-documents',
    name: 'Văn bản hành chính Việt Nam',
    version: '0.1.0',
    corrections: [
      { original: 'Ngãn hàng', suggested: 'Ngân hàng' },
      { original: 'Đổi tượng', suggested: 'Đối tượng' },
      { original: 'Thõng tư', suggested: 'Thông tư' },
      { original: 'Thõng báo', suggested: 'Thông báo' },
    ],
  },
  {
    id: 'banking',
    name: 'Ngân hàng',
    version: '0.1.0',
    corrections: [{ original: 'Ngãn hàng', suggested: 'Ngân hàng' }],
  },
  {
    id: 'bidv',
    name: 'BIDV',
    version: '0.1.0',
    corrections: [{ original: 'B1DV', suggested: 'BIDV' }],
  },
  {
    id: 'legal-documents',
    name: 'Văn bản pháp lý',
    version: '0.1.0',
    corrections: [],
  },
  {
    id: 'government-documents',
    name: 'Văn bản nhà nước',
    version: '0.1.0',
    corrections: [],
  },
] as const;

export function listKnowledgePacks(): VietnameseKnowledgePack[] {
  return KNOWLEDGE_PACKS.map((p) => ({ ...p, corrections: [...p.corrections] }));
}

export function findPackSuggestions(
  text: string,
): Array<{
  original: string;
  suggested: string;
  packId: KnowledgePackId;
  packVersion: string;
}> {
  const out: Array<{
    original: string;
    suggested: string;
    packId: KnowledgePackId;
    packVersion: string;
  }> = [];
  const seen = new Set<string>();
  for (const pack of KNOWLEDGE_PACKS) {
    for (const c of pack.corrections) {
      if (!text.includes(c.original)) {
        continue;
      }
      const key = `${c.original}=>${c.suggested}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push({
        original: c.original,
        suggested: c.suggested,
        packId: pack.id,
        packVersion: pack.version,
      });
    }
  }
  return out;
}
