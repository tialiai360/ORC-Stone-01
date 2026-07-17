const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function main() {
  const out = process.argv[2] || path.join(process.env.TEMP || '/tmp', 'ke-smoke.docx');
  const z = new JSZip();
  const t = [
    'So: 01/TB-HO',
    'Ngay: 15/01/2026',
    'Ve: Thong bao',
    'Co quan ban hanh: HO',
    'Can cu 12/QD-HO',
    'Don vi thuc hien: CN A',
    'Truoc ngay 20/02/2026',
    '1. Muc dich',
    'Body',
  ].join('\n');
  const body = t
    .split('\n')
    .map((l) => `<w:p><w:r><w:t>${l}</w:t></w:r></w:p>`)
    .join('');
  z.file(
    'word/document.xml',
    `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
  );
  fs.writeFileSync(out, await z.generateAsync({ type: 'nodebuffer' }));
  console.log(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
