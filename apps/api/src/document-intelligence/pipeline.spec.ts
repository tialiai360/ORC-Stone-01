import { runDocumentIntelligencePipeline } from './pipeline';
import { normalizeVietnameseText } from './vietnamese-normalization';
import { findPackSuggestions } from './knowledge-pack';

describe('DIL pipeline', () => {
  it('preserves raw text separately from normalized', () => {
    const raw = 'Ngãn hàng\u00A0ABC  •  Điều I.\n\n\nKhoản 1)';
    const result = runDocumentIntelligencePipeline(
      '11111111-1111-1111-1111-111111111111',
      raw,
    );
    expect(result.rawText).toBe(raw);
    expect(result.normalizedText).not.toBe(raw);
    expect(result.normalizedText).toContain('•');
    expect(result.blocks.length).toBeGreaterThanOrEqual(1);
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(100);
  });

  it('does not auto-correct words during normalization', () => {
    const raw = 'Ngãn hàng Nhà nước';
    expect(normalizeVietnameseText(raw)).toContain('Ngãn');
  });

  it('surfaces pack suggestions without applying them', () => {
    const suggestions = findPackSuggestions('Ngãn hàng BIDV B1DV');
    expect(suggestions.some((s) => s.suggested === 'Ngân hàng')).toBe(true);
    expect(suggestions.some((s) => s.suggested === 'BIDV')).toBe(true);
  });
});
