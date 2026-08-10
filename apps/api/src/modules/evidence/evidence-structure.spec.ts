import { EvidenceService } from './evidence.service';
import { InMemoryEvidenceRepository } from './repository/in-memory-evidence.repository';

describe('EvidenceService StructureCorrected', () => {
  it('records StructureCorrected evidence', async () => {
    const repo = new InMemoryEvidenceRepository();
    const service = new EvidenceService(repo);
    const record = await service.recordStructureCorrected({
      documentId: '11111111-1111-1111-1111-111111111111',
      nodeId: 'trich-yeu',
      before: null,
      after: 'Thông báo họp',
      reviewer: 'nguoi-duyet',
      version: 1,
    });
    expect(record.type).toBe('StructureCorrected');
    if (record.type === 'StructureCorrected') {
      expect(record.nodeId).toBe('trich-yeu');
      expect(record.after).toBe('Thông báo họp');
      expect(record.reviewer).toBe('nguoi-duyet');
      expect(record.version).toBe(1);
    }
  });
});
