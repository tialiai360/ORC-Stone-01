import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { suggestKnowledgeFields } from './suggest-knowledge-fields';

describe('suggestKnowledgeFields', () => {
  const sample = `
NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM
Số: 21955/BIDV-QLRRHD
Về việc: Tăng cường kiểm soát rủi ro tín dụng
ngày 15 tháng 07 năm 2026

Căn cứ Luật Các tổ chức tín dụng;
Căn cứ Quyết định 01/QĐ-HĐQT;

Yêu cầu các đơn vị thực hiện nghiêm túc.

Nơi nhận:
- Ban Điều hành;
- Các chi nhánh;
- Lưu VT.

trước ngày 30/08/2026
`;

  it('suggests core fields from VN notice corpus', () => {
    const sug = suggestKnowledgeFields({ 1: sample }, []);
    const by = Object.fromEntries(sug.map((s) => [s.nodeId, s.text]));
    assert.match(by['so-van-ban'] ?? '', /21955\/BIDV/);
    assert.equal(by['ngay-ban-hanh'], '15/07/2026');
    assert.match(by['trich-yeu'] ?? '', /Tăng cường kiểm soát/);
    assert.ok(by['thoi-han']?.includes('30/08/2026'));
    const canCu = sug.filter((s) => s.nodeId === 'can-cu');
    assert.equal(
      canCu.length,
      2,
      `can-cu texts: ${JSON.stringify(canCu.map((s) => s.text))}`,
    );
    assert.match(canCu[0]?.text ?? '', /Luật Các tổ chức tín dụng/i);
    assert.match(canCu[1]?.text ?? '', /Quyết định 01\/QĐ-HĐQT/i);
    assert.ok(by['noi-nhan']?.includes('chi nhánh'));
    assert.match(by['don-vi-ban-hanh'] ?? '', /NGÂN HÀNG/);
  });

  it('skips nodes already filled', () => {
    const sug = suggestKnowledgeFields({ 1: sample }, [
      {
        id: 'a1',
        nodeId: 'so-van-ban',
        text: '21955/BIDV-QLRRHD',
        pageNumber: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        source: 'manual',
      },
    ]);
    assert.ok(!sug.some((s) => s.nodeId === 'so-van-ban'));
  });

  it('does not invent when corpus empty', () => {
    assert.equal(suggestKnowledgeFields({ 1: '' }, []).length, 0);
  });

  it('EC-001: does not treat V/v as so-van-ban when Số empty', () => {
    const corpus = `
NGÂN HÀNG TMCP ĐẦU TƯ VÀ PHÁT TRIỂN VIỆT NAM
Số:
V/v Hướng dẫn xây dựng kế hoạch BCP năm 2026
Kính gửi: Các chi nhánh
`;
    const sug = suggestKnowledgeFields({ 1: corpus }, []);
    assert.ok(!sug.some((s) => s.nodeId === 'so-van-ban'));
    const trich = sug.find((s) => s.nodeId === 'trich-yeu');
    assert.match(trich?.text ?? '', /Hướng dẫn xây dựng/i);
  });

  it('suggests supersede numbers as van-ban-lien-quan', () => {
    const corpus = `
V/v Ban hành lại Cẩm nang
thay thế Công văn số 31760/BIDV-QLRRHD ngày 27/10/2025 và Công văn số 914/BIDV-QLRRHD
`;
    const sug = suggestKnowledgeFields({ 1: corpus }, []);
    const rel = sug.filter((s) => s.nodeId === 'van-ban-lien-quan');
    assert.ok(rel.some((s) => /31760/.test(s.text)));
    assert.ok(rel.some((s) => /914\//.test(s.text)));
  });
});
