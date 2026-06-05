import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vsp = path.join(__dirname, 'src/components/VideoStills.tsx');
let vsc = fs.readFileSync(vsp, 'utf8');

// remove stillsCount state
vsc = vsc.replace(/const \[stillsCount, setStillsCount\] = useState<number>\(\d+\);\n/, '');

// update frames logic
vsc = vsc.replace(/const frames = Math\.min\(stillsCount,[^\)]+\)\);/, 'const frames = Math.max(1, Math.floor(totalDuration));');

// remove frames density block
vsc = vsc.replace(/\{\/\* Density Range Slider \*\/\}[\s\S]*?(?=<div className="flex flex-col gap-3 mt-2 border-t border-border-subtle pt-\[14px\]">)/, '');

fs.writeFileSync(vsp, vsc);
console.log('Frames Density removed');
