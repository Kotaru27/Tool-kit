import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src/components');

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace hardcoded gap, p, mb, mt, mb with standard tailwind spacing classes
  content = content.replace(/gap-\[10px\]/g, 'gap-3');
  content = content.replace(/gap-\[12px\]/g, 'gap-3');
  content = content.replace(/gap-\[15px\]/g, 'gap-4');
  content = content.replace(/gap-\[16px\]/g, 'gap-4');
  content = content.replace(/gap-\[20px\]/g, 'gap-5');
  content = content.replace(/gap-\[24px\]/g, 'gap-6');

  content = content.replace(/p-\[10px\]/g, 'p-3');
  content = content.replace(/p-\[12px\]/g, 'p-3');
  content = content.replace(/p-\[15px\]/g, 'p-4');
  content = content.replace(/p-\[16px\]/g, 'p-4');
  content = content.replace(/p-\[20px\]/g, 'p-5');
  content = content.replace(/p-\[24px\]/g, 'p-6');
  content = content.replace(/p-\[40px\]/g, 'p-10');

  content = content.replace(/m-\[10px\]/g, 'm-3');
  content = content.replace(/m-\[16px\]/g, 'm-4');
  content = content.replace(/m-\[20px\]/g, 'm-5');

  content = content.replace(/mb-\[10px\]/g, 'mb-3');
  content = content.replace(/mb-\[16px\]/g, 'mb-4');
  content = content.replace(/mb-\[20px\]/g, 'mb-6');

  content = content.replace(/mt-\[8px\]/g, 'mt-2');
  content = content.replace(/mt-\[10px\]/g, 'mt-3');
  content = content.replace(/mt-\[16px\]/g, 'mt-4');

  content = content.replace(/pb-\[15px\]/g, 'pb-4');
  content = content.replace(/pr-\[5px\]/g, 'pr-2');

  // Any left overs like mb-[12px]
  content = content.replace(/gap-\[\d+px\]/g, 'gap-[var(--spacing-md)]');
  content = content.replace(/p-\[\d+px\]/g, 'p-[var(--spacing-md)]');

  fs.writeFileSync(filePath, content);
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
for (const f of files) {
  processFile(path.join(componentsDir, f));
}

console.log('Done mapping spacings');
