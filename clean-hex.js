import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const traverse = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-\[#FFFFFF\] text-\[#000000\]/g, 'bg-text-main text-bg-main');
      content = content.replace(/hover:bg-\[#E5E5E5\]/g, 'hover:bg-text-muted');
      content = content.replace(/bg-\[#E5E5E5\]/g, 'bg-text-muted');
      
      content = content.replace(/bg-\[#1A1A1A\] text-text-main/g, 'bg-bg-input text-text-main');
      content = content.replace(/hover:bg-\[#333333\]/g, 'hover:bg-bg-hover');
      
      content = content.replace(/bg-\[rgba\(16,185,129,0\.1\)\]/g, 'bg-green-500/10');
      content = content.replace(/border-\[rgba\(16,185,129,0\.2\)\]/g, 'border-green-500/20');
      content = content.replace(/text-\[#10B981\]/g, 'text-green-500');
      content = content.replace(/hover:bg-\[#10B981\]/g, 'hover:bg-green-500');

      content = content.replace(/text-\[#111\]/g, 'text-border-subtle');
      content = content.replace(/border-\[#222222\]/g, 'border-border-color');
      content = content.replace(/border-\[#111\]/g, 'border-border-subtle');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
};

traverse(path.join(__dirname, 'src/components'));
console.log('Hex replaced!');
