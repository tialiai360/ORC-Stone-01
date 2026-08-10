/**
 * DPK-001 alignment map — Stone StructureModuleId ↔ DPK MOD-* / ontology classes.
 * Knowledge remains SoT; this is an implementation bridge (not a second ontology).
 */

import type { StructureModuleId } from '../pdf/plugins/types';

export type DpkModuleId =
  | 'MOD-HEADER'
  | 'MOD-MOTTO'
  | 'MOD-NUMBER-DATE'
  | 'MOD-SUBJECT'
  | 'MOD-BODY'
  | 'MOD-LEGAL'
  | 'MOD-TABLE'
  | 'MOD-MEDIA'
  | 'MOD-WATERMARK'
  | 'MOD-REPEATED'
  | 'MOD-PAGENO'
  | 'MOD-FOOTNOTE'
  | 'MOD-RECIPIENT'
  | 'MOD-SIGNATURE'
  | 'MOD-APPENDIX'
  | 'MOD-EMPTY';

export type DpkClassId =
  | 'NationalTitle'
  | 'Motto'
  | 'Organization'
  | 'Header'
  | 'Footer'
  | 'Subject'
  | 'LegalBasis'
  | 'Article'
  | 'Clause'
  | 'Point'
  | 'Body'
  | 'Table'
  | 'Image'
  | 'QRCode'
  | 'Barcode'
  | 'Watermark'
  | 'PageNumber'
  | 'RepeatedHeader'
  | 'RepeatedFooter'
  | 'Logo'
  | 'Stamp'
  | 'Footnote'
  | 'Signature'
  | 'DigitalSignature'
  | 'Appendix'
  | 'Annex'
  | 'Attachment'
  | 'EmptyPage'
  | 'Recipient';

export type DpkModuleBridge = {
  stoneId: StructureModuleId;
  dpkModule: DpkModuleId;
  dpkClass: DpkClassId;
  /** Exclude from body Reading Order when true (DPK PR-L*). */
  excludesFromReadingOrder: boolean;
};

const BRIDGES: DpkModuleBridge[] = [
  { stoneId: 'header', dpkModule: 'MOD-HEADER', dpkClass: 'Header', excludesFromReadingOrder: false },
  { stoneId: 'logo', dpkModule: 'MOD-HEADER', dpkClass: 'Logo', excludesFromReadingOrder: true },
  { stoneId: 'footer', dpkModule: 'MOD-RECIPIENT', dpkClass: 'Footer', excludesFromReadingOrder: false },
  { stoneId: 'watermark', dpkModule: 'MOD-WATERMARK', dpkClass: 'Watermark', excludesFromReadingOrder: true },
  { stoneId: 'stamp', dpkModule: 'MOD-SIGNATURE', dpkClass: 'Stamp', excludesFromReadingOrder: false },
  { stoneId: 'signature', dpkModule: 'MOD-SIGNATURE', dpkClass: 'Signature', excludesFromReadingOrder: false },
  {
    stoneId: 'digital-signature',
    dpkModule: 'MOD-SIGNATURE',
    dpkClass: 'DigitalSignature',
    excludesFromReadingOrder: false,
  },
  { stoneId: 'qr-code', dpkModule: 'MOD-MEDIA', dpkClass: 'QRCode', excludesFromReadingOrder: true },
  { stoneId: 'barcode', dpkModule: 'MOD-MEDIA', dpkClass: 'Barcode', excludesFromReadingOrder: true },
  { stoneId: 'table', dpkModule: 'MOD-TABLE', dpkClass: 'Table', excludesFromReadingOrder: false },
  { stoneId: 'image', dpkModule: 'MOD-MEDIA', dpkClass: 'Image', excludesFromReadingOrder: false },
  { stoneId: 'footnote', dpkModule: 'MOD-FOOTNOTE', dpkClass: 'Footnote', excludesFromReadingOrder: true },
  { stoneId: 'page-number', dpkModule: 'MOD-PAGENO', dpkClass: 'PageNumber', excludesFromReadingOrder: true },
  {
    stoneId: 'repeated-header',
    dpkModule: 'MOD-REPEATED',
    dpkClass: 'RepeatedHeader',
    excludesFromReadingOrder: true,
  },
  {
    stoneId: 'repeated-footer',
    dpkModule: 'MOD-REPEATED',
    dpkClass: 'RepeatedFooter',
    excludesFromReadingOrder: true,
  },
  { stoneId: 'attachment', dpkModule: 'MOD-APPENDIX', dpkClass: 'Attachment', excludesFromReadingOrder: false },
  { stoneId: 'annex', dpkModule: 'MOD-APPENDIX', dpkClass: 'Annex', excludesFromReadingOrder: false },
  { stoneId: 'empty-page', dpkModule: 'MOD-EMPTY', dpkClass: 'EmptyPage', excludesFromReadingOrder: true },
  { stoneId: 'subject', dpkModule: 'MOD-SUBJECT', dpkClass: 'Subject', excludesFromReadingOrder: false },
  { stoneId: 'legal-basis', dpkModule: 'MOD-LEGAL', dpkClass: 'LegalBasis', excludesFromReadingOrder: false },
  { stoneId: 'article', dpkModule: 'MOD-LEGAL', dpkClass: 'Article', excludesFromReadingOrder: false },
  { stoneId: 'clause', dpkModule: 'MOD-LEGAL', dpkClass: 'Clause', excludesFromReadingOrder: false },
  { stoneId: 'point', dpkModule: 'MOD-LEGAL', dpkClass: 'Point', excludesFromReadingOrder: false },
];

const byStone = new Map(BRIDGES.map((b) => [b.stoneId, b]));

export function bridgeForStoneModule(id: string | undefined): DpkModuleBridge | undefined {
  if (!id) {
    return undefined;
  }
  return byStone.get(id as StructureModuleId);
}

export function dpkLabelForStone(id: StructureModuleId): string {
  const b = byStone.get(id);
  return b ? `${b.dpkModule} · ${b.dpkClass}` : id;
}
