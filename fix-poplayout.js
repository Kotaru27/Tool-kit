import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePaths = [
  'src/components/ImageSplitter.tsx',
  'src/components/LogoResizer.tsx',
  'src/components/PdfConvert.tsx',
  'src/components/VideoStills.tsx'
];

for (const fp of filePaths) {
  const fullPath = path.join(__dirname, fp);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/mode="popLayout"/g, 'mode="wait"');
  fs.writeFileSync(fullPath, content);
}

console.log('Fixed popLayout issues.');
