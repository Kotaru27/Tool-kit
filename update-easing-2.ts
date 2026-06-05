import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src/components');

function replaceEasing(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace old kubic bezier string
  content = content.replace(/0\.16,\s*1,\s*0\.3,\s*1/g, '0.22, 1, 0.36, 1');
  
  // Replace standard ease-[cubic-bezier(...)] classes
  content = content.replace(/ease-\[cubic-bezier\([^\]]+\)\]/g, 'ease-[cubic-bezier(0.22,1,0.36,1)]');

  fs.writeFileSync(filePath, content);
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
  replaceEasing(path.join(componentsDir, file));
}

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/0\.16,\s*1,\s*0\.3,\s*1/g, '0.22, 1, 0.36, 1');
fs.writeFileSync('src/App.tsx', appContent);

let cssContent = fs.readFileSync('src/index.css', 'utf8');
cssContent = cssContent.replace(/0\.16,\s*1,\s*0\.3,\s*1/g, '0.22, 1, 0.36, 1');
fs.writeFileSync('src/index.css', cssContent);

console.log('Done mapping easing');
