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
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const replacements = [
        { regex: /bg-\[#000000\]/g, replace: 'bg-[#000000] dark:bg-[#000000] ' }, // Wait, actually replace with semantic classes.
        // Let's replace with custom variables that we will inject in index.css
        { regex: /bg-\[#000000\]/g, replace: 'bg-bg-main' },
        { regex: /bg-\[#0A0A0A\]/g, replace: 'bg-bg-panel' },
        { regex: /bg-\[#050505\]/g, replace: 'bg-bg-input' },
        { regex: /bg-\[#030303\]/g, replace: 'bg-bg-input' },
        { regex: /bg-\[#0D0D0D\]/g, replace: 'bg-bg-hover' },
        { regex: /bg-\[#111111\]/g, replace: 'bg-bg-hover' },
        { regex: /bg-\[#121212\]/g, replace: 'bg-border-subtle' }, // sometimes used as background progress strip
        { regex: /border-\[#1A1A1A\]/g, replace: 'border-border-color' },
        { regex: /border-\[#111111\]/g, replace: 'border-border-subtle' },
        { regex: /border-\[#1C1C1C\]/g, replace: 'border-border-strong' },
        { regex: /border-\[#2A2A2A\]/g, replace: 'border-border-strong' },
        { regex: /border-\[#333333\]/g, replace: 'border-border-strong' },
        { regex: /border-\[#111\]/g, replace: 'border-border-subtle' },
        { regex: /border-\[#333\]/g, replace: 'border-border-strong' },
        { regex: /text-\[#FFFFFF\]/g, replace: 'text-text-main' },
        { regex: /text-white/g, replace: 'text-text-main' },
        { regex: /text-black/g, replace: 'text-bg-main' }, // inverted
        { regex: /text-\[#A3A3A3\]/g, replace: 'text-text-muted' },
        { regex: /text-\[#888888\]/g, replace: 'text-text-muted' },
        { regex: /text-\[#737373\]/g, replace: 'text-text-muted' },
        { regex: /text-\[#555555\]/g, replace: 'text-text-subtle' },
        { regex: /text-\[#555\]/g, replace: 'text-text-subtle' },
        { regex: /text-\[#444\]/g, replace: 'text-text-subtle' },
        { regex: /text-\[#333333\]/g, replace: 'text-text-subtle' },
        { regex: /text-\[#333\]/g, replace: 'text-text-subtle' }
      ];

      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }

      // Also fix the layout collapsing issue with break-words in empty states
      const breakWordsRegex = /break-words/g;
      if (breakWordsRegex.test(content)) {
        content = content.replace(breakWordsRegex, 'break-normal');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
};

traverse(path.join(__dirname, 'src'));
console.log('Done replacing colors.');
