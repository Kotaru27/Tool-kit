import fs from 'fs';
import path from 'path';

const cssPath = path.join(process.cwd(), 'src/index.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Replace old cubic-bezier
content = content.replace(/0\.16,\s*1,\s*0\.3,\s*1/g, '0.22, 1, 0.36, 1');

// Add hardware acceleration classes to index.css or components where needed.
fs.writeFileSync(cssPath, content);
console.log('Done updating CSS');
