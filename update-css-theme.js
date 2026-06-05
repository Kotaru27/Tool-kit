import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssPath = path.join(__dirname, 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// replace @media (prefers-color-scheme: dark) { :root { with .dark {
cssContent = cssContent.replace(/@media \(prefers-color-scheme: dark\) \{\s*:root \{([\s\S]*?)\}\s*\}/, '.dark {\n$1\n}');

fs.writeFileSync(cssPath, cssContent);
console.log('CSS updated');
