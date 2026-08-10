import { matchesDeliverableKeyword, TRANSFORM_RULES } from './transform-rules';

describe('transform-rules', () => {
  it('pins rule version and deliverable keywords', () => {
    expect(TRANSFORM_RULES.version).toBe('1.0.0');
    expect(TRANSFORM_RULES.intentEvidencePath).toContain('documentTitle');
    expect(matchesDeliverableKeyword('phai nop bao cao')).toBe(true);
    expect(matchesDeliverableKeyword('optional note')).toBe(false);
  });
});
