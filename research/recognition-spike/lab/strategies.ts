/**
 * Recognition Research Spike — strategy contracts (lab only).
 * NOT imported by Clean Desk / product runtime.
 */

export type StrategyId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type BBox = { x: number; y: number; w: number; h: number };

export type RecognitionObjectDraft = {
  id: string;
  source: StrategyId | string;
  kind: 'text' | 'image_text' | 'barcode' | 'qr' | 'stamp' | 'signature' | 'other';
  text?: string;
  bbox?: BBox;
  pageNumber: number;
  confidence: number;
  needsReading?: boolean;
};

export type CoverageScores = {
  recognitionCoverage: number;
  visualCoverage: number;
  businessCoverage: number;
  knowledgeCoverage: number;
  unknownRegions: number;
};

export type RunCost = {
  /** seconds wall time for page or doc */
  seconds: number;
  /** peak MB if measured */
  memoryMb?: number;
};

export type StrategyScorecard = {
  strategyId: StrategyId;
  name: string;
  coverage: Partial<CoverageScores>;
  accuracySpotCheck?: number;
  speed: 'fast' | 'medium' | 'slow' | 'very_slow';
  memory: 'low' | 'medium' | 'high';
  complexity: 1 | 2 | 3 | 4 | 5;
  maintainability: 1 | 2 | 3 | 4 | 5;
  extensibility: 1 | 2 | 3 | 4 | 5;
  suitabilityForOrc: 1 | 2 | 3 | 4 | 5;
  /** 1–5: helps clerk finish 50 docs/day */
  realUserValue: 1 | 2 | 3 | 4 | 5;
  notes: string;
};

export type StrategyModule = {
  id: StrategyId;
  name: string;
  description: string;
  /** Independent: no product coupling */
  runPage?: (input: unknown) => Promise<{
    objects: RecognitionObjectDraft[];
    coverageHint?: Partial<CoverageScores>;
    cost?: RunCost;
  }>;
};

export const STRATEGIES: StrategyModule[] = [
  {
    id: 'A',
    name: 'Embedded Text only',
    description: 'Chỉ TextLayer / embedded glyphs. Baseline hiện tại Stone.',
  },
  {
    id: 'B',
    name: 'Render PDF → OCR Full Page',
    description: 'Raster cả trang rồi OCR. Phủ scan; đắt và nhiễu chrome.',
  },
  {
    id: 'C',
    name: 'Text Layer + OCR Merge',
    description: 'Lấy embedded trước, OCR full rồi merge/dedupe theo geometry.',
  },
  {
    id: 'D',
    name: 'Gap Detection → OCR ROI only',
    description: 'Difference map text↔ink → OCR đúng lỗ hổng. Ứng viên mạnh.',
  },
  {
    id: 'E',
    name: 'Layout First → Recognition',
    description: 'Vùng layout (header/body/stamp/…) rồi nhận dạng theo loại vùng.',
  },
  {
    id: 'F',
    name: 'Image Segmentation → OCR vùng',
    description: 'Tách blob ảnh / connected components → OCR từng ROI.',
  },
  {
    id: 'G',
    name: 'Hybrid Multi-pass',
    description: 'A → E → D/F → specialized (barcode/QR) → manual salvage.',
  },
  {
    id: 'H',
    name: 'Promising discovery / Manual+Template',
    description: 'Slot cho phát hiện mới: template HO, barcode lib, human lasso.',
  },
];
