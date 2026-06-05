import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vsp = path.join(__dirname, 'src/components/LogoResizer.tsx');
let curr = fs.readFileSync(vsp, 'utf8');

curr = curr.replace(/text-\[10px\]/g, 'text-xs');
curr = curr.replace(/font-mono/g, 'font-sans');

fs.writeFileSync(vsp, curr);

const vsp2 = path.join(__dirname, 'src/components/VideoStills.tsx');
let curr2 = fs.readFileSync(vsp2, 'utf8');
curr2 = curr2.replace(/text-\[10px\]/g, 'text-xs');
curr2 = curr2.replace(/font-mono/g, 'font-sans');
fs.writeFileSync(vsp2, curr2);

const vsp3 = path.join(__dirname, 'src/components/ui/button.tsx');
let curr3 = fs.readFileSync(vsp3, 'utf8');
curr3 = curr3.replace(/text-\[10px\]/g, 'text-xs');
fs.writeFileSync(vsp3, curr3);

const vsp4 = path.join(__dirname, 'src/components/ui/drop-zone.tsx');
let curr4 = fs.readFileSync(vsp4, 'utf8');
curr4 = curr4.replace(/text-\[10px\]/g, 'text-xs');
curr4 = curr4.replace(/font-mono/g, 'font-sans');
fs.writeFileSync(vsp4, curr4);

const vsp5 = path.join(__dirname, 'src/components/ui/primitives.tsx');
let curr5 = fs.readFileSync(vsp5, 'utf8');
curr5 = curr5.replace(/text-\[10px\]/g, 'text-xs');
curr5 = curr5.replace(/font-mono/g, 'font-sans');
fs.writeFileSync(vsp5, curr5);

const vsp6 = path.join(__dirname, 'src/components/ui/states.tsx');
let curr6 = fs.readFileSync(vsp6, 'utf8');
curr6 = curr6.replace(/text-\[10px\]/g, 'text-xs');
curr6 = curr6.replace(/text-\[9px\]/g, 'text-[11px]');
curr6 = curr6.replace(/font-mono/g, 'font-sans');
fs.writeFileSync(vsp6, curr6);

console.log('Fixed styling sizes');
