# EVO002_VALIDATE.md

## Automated

- `npm run typecheck -w @orc/web`
- `npm run test -w @orc/web` (includes `doi.test.ts`)

## Manual

1. Open BIDV PDF workspace — no continuous flicker at idle  
2. Zoom ± — tô chữ stable; Diag not stuck at 0%  
3. Diag panel shows Object totals when DOI on  
4. Capability panel still lists regions; watermark/signature improve when cues present  
5. Disable DOI: `localStorage.setItem('orc.intel.doi.v1','0')` → reload → legacy path

## Dataset (ongoing)

Vietnamese admin, banking BCP, signed PDFs, watermarked, multi-column — expand coverage in follow-ons.
