import { BadRequestException } from '@nestjs/common';
import JSZip from 'jszip';
import { SAMPLE_NOTICE_TEXT } from '../testing/sample-text';
import { extractAppendices, extractLogicalTables } from './appendix-table.extractor';
import { extractDeadlines } from './deadline.extractor';
import { extractHeadings } from './heading.extractor';
import { extractMetadata } from './metadata.extractor';
import { runDeterministicExtraction } from './pipeline';
import { extractReferencedDocuments } from './referenced-document.extractor';
import { extractResponsibleUnits } from './responsible-unit.extractor';
import { extractSections } from './section.extractor';
import { extractPlainText, extractPlainTextFromDocx } from './text-reader';

describe('knowledge extractors', () => {
  it('extracts metadata', () => {
    const meta = extractMetadata(SAMPLE_NOTICE_TEXT);
    expect(meta.documentNumber).toBe('01/TB-HO');
    expect(meta.documentDate).toBe('15/01/2026');
    expect(meta.documentTitle).toContain('Thông báo');
    expect(meta.issuer).toContain('Head Office');
    expect(meta.documentType).toBeTruthy();
    expect(meta.effectiveDate).toBe('01/02/2026');
  });

  it('returns null document type when keywords absent', () => {
    expect(extractMetadata('Số: 1\nNgày: 01/01/2026').documentType).toBeNull();
  });

  it('detects headings and sections', () => {
    const headings = extractHeadings(SAMPLE_NOTICE_TEXT);
    expect(headings.some((h) => h.startsWith('1.'))).toBe(true);
    const sections = extractSections(SAMPLE_NOTICE_TEXT);
    expect(sections.length).toBeGreaterThanOrEqual(2);
    expect(sections[0].heading).toMatch(/^1\./);
  });

  it('extracts deadlines, responsible units, and references', () => {
    expect(extractDeadlines(SAMPLE_NOTICE_TEXT)).toContain('20/02/2026');
    expect(extractResponsibleUnits(SAMPLE_NOTICE_TEXT).join(' ')).toMatch(/Chi nhánh/i);
    expect(extractReferencedDocuments(SAMPLE_NOTICE_TEXT)).toContain('12/QĐ-HO');
  });

  it('extracts appendices and logical tables', () => {
    expect(extractAppendices(SAMPLE_NOTICE_TEXT).length).toBeGreaterThan(0);
    expect(extractLogicalTables(SAMPLE_NOTICE_TEXT).length).toBeGreaterThan(0);
    expect(extractLogicalTables('plain text only')).toEqual([]);
    expect(extractLogicalTables('A|B|C\n\nX|Y|Z').length).toBe(2);
  });

  it('is repeatable for same input', () => {
    const a = runDeterministicExtraction(SAMPLE_NOTICE_TEXT);
    const b = runDeterministicExtraction(SAMPLE_NOTICE_TEXT);
    expect(a).toEqual(b);
    expect(a.extractionCount).toBeGreaterThan(0);
  });

  it('reads docx and rejects unsupported extension', async () => {
    const zip = new JSZip();
    zip.file(
      'word/document.xml',
      `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello</w:t></w:r></w:p></w:body></w:document>`,
    );
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(extractPlainTextFromDocx(buffer)).resolves.toContain('Hello');
    await expect(extractPlainText(buffer, 'docx')).resolves.toContain('Hello');
    await expect(extractPlainText(Buffer.from('x'), 'txt')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const emptyZip = new JSZip();
    const emptyBuf = await emptyZip.generateAsync({ type: 'nodebuffer' });
    await expect(extractPlainTextFromDocx(emptyBuf)).rejects.toBeInstanceOf(BadRequestException);
  });
});
