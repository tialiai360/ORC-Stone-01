import { BadRequestException } from '@nestjs/common';
import JSZip from 'jszip';
import { createRequire } from 'node:module';

type PdfParseFn = (data: Buffer) => Promise<{ text?: string }>;

const nodeRequire = createRequire(__filename);
const pdfParse = nodeRequire('pdf-parse') as PdfParseFn;

export async function extractPlainTextFromPdf(buffer: Buffer): Promise<string> {
  const parsed = await pdfParse(buffer);
  return String(parsed.text ?? '');
}

export async function extractPlainTextFromDocx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = zip.file('word/document.xml');
  if (!documentXml) {
    throw new BadRequestException('DOCX is missing word/document.xml.');
  }
  const xml = await documentXml.async('string');
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function extractPlainText(
  buffer: Buffer,
  extension: string,
): Promise<string> {
  const ext = extension.toLowerCase();
  if (ext === 'pdf') {
    return extractPlainTextFromPdf(buffer);
  }
  if (ext === 'docx') {
    return extractPlainTextFromDocx(buffer);
  }
  throw new BadRequestException(`Unsupported extraction extension: ${ext}`);
}
