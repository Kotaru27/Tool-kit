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
      let changed = false;

      const replacements = [
        // Replace unreadable tiny mono subtext with clean sans-serif text
        { regex: /font-mono text-\[10px\] uppercase tracking-widest text-[^ ]+ mt-[^ ]+ truncate/g, replace: 'text-sm font-sans text-text-muted mt-1 truncate' },
        { regex: /font-mono text-\[10px\] uppercase tracking-widest text-[^ ]+ truncate mt-1/g, replace: 'text-sm font-sans text-text-muted truncate mt-1' },
        { regex: /font-mono text-\[9px\]/g, replace: 'text-[11px] font-sans' },
        { regex: /text-\[10px\] font-mono text-[^ ]+ uppercase mt-1/g, replace: 'text-[13px] font-sans text-text-subtle mt-1' },
        { regex: /font-mono text-\[10px\] text-[^ ]+ font-bold uppercase tracking-widest/g, replace: 'text-[12px] font-sans font-medium text-text-subtle uppercase tracking-wider' },
        { regex: /font-mono text-\[10px\] text-[^ ]+ tracking-widest animate-pulse/g, replace: 'text-sm font-sans text-text-subtle animate-pulse' },
        { regex: /font-mono text-\[10px\] text-[^ ]+ uppercase tracking-wider/g, replace: 'text-[13px] font-sans text-text-subtle' },
        { regex: /font-mono text-\[11px\] text-[^ ]+ uppercase/g, replace: 'text-[13px] font-sans text-text-subtle' },
        { regex: /text-\[11px\] font-mono text-[^ ]+ uppercase mt-1/g, replace: 'text-[13px] font-sans text-text-muted mt-1' },
        { regex: /text-\[11px\] text-[^ ]+ font-mono uppercase/g, replace: 'text-sm font-sans text-text-subtle' },

        // Remove inline checkered styles and map to bg-checkered
        { regex: /style=\{\{[\s]*backgroundImage:[ ]*'linear-gradient\([^}]*\}\}/g, replace: 'className="bg-checkered absolute inset-0 z-0 opacity-50"' },
        { regex: /className="bg-\[#000000\] flex items-center justify-center relative pointer-events-none border-b border-\[#1A1A1A\]" style=\{\{[^}]*\}\}/g, replace: 'className="bg-checkered flex items-center justify-center relative pointer-events-none border-b border-border-color"' },
        { regex: /className="bg-\[#000000\] flex items-center justify-center relative border-b border-\[#121212\] overflow-hidden shrink-0" style=\{\{[^}]*\}\}/g, replace: 'className="bg-checkered flex items-center justify-center relative border-b border-border-color overflow-hidden shrink-0"' },
        { regex: /className="bg-\[#000000\] w-\[280px\] lg:w-\[340px\] shrink-0 border-r border-[#111] relative overflow-hidden flex flex-col justify-center items-center" style=\{\{[^}]*\}\}/g, replace: 'className="bg-checkered w-[280px] lg:w-[340px] shrink-0 border-r border-border-color relative overflow-hidden flex flex-col justify-center items-center"' },
        
        { regex: /className="bg-\[#000000\] flex items-center justify-center aspect-square overflow-hidden p-\[16px\] relative pointer-events-none border-b border-\[#1A1A1A\]" style=\{\{([^}]*)\}\}/g, replace: 'className="bg-checkered flex items-center justify-center aspect-square overflow-hidden p-4 relative pointer-events-none border-b border-border-color"' },
        { regex: /className="bg-bg-main flex items-center justify-center aspect-square overflow-hidden p-\[16px\] relative pointer-events-none border-b border-border-color" style=\{\{([^}]*)\}\}/g, replace: 'className="bg-checkered flex items-center justify-center aspect-square overflow-hidden p-4 relative pointer-events-none border-b border-border-color"' },
		{ regex: /className="bg-\[#000000\] flex items-center justify-center relative pointer-events-none border-b border-border-color" style=\{\{[^}]*\}\}/g, replace: 'className="bg-checkered flex items-center justify-center relative pointer-events-none border-b border-border-color"' },
		{ regex: /className="bg-bg-main flex items-center justify-center relative pointer-events-none border-b border-border-color" style=\{\{[^}]*\}\}/g, replace: 'className="bg-checkered flex items-center justify-center relative pointer-events-none border-b border-border-color"' },
		{ regex: /style=\{\{\s*backgroundImage: 'linear-gradient\([^\}]+\}\}/g, replace: 'className="bg-checkered absolute inset-0 z-0"' },

        // Clean up some paddings
        { regex: /p-\[64px\]/g, replace: 'p-12' },
        { regex: /p-\[60px\]/g, replace: 'p-12' },
        { regex: /p-\[32px\]/g, replace: 'p-8' },
        { regex: /p-\[24px\]/g, replace: 'p-6' },
        { regex: /p-\[20px\]/g, replace: 'p-5' },
        { regex: /p-\[16px\]/g, replace: 'p-4' },
        { regex: /gap-\[24px\]/g, replace: 'gap-6' },
        { regex: /gap-\[20px\]/g, replace: 'gap-5' },
        { regex: /gap-\[16px\]/g, replace: 'gap-4' },
        { regex: /gap-\[12px\]/g, replace: 'gap-3' },
        { regex: /gap-\[8px\]/g, replace: 'gap-2' },

        // Button styles inside components 
        { regex: /text-black bg-\[#FFFFFF\] hover:bg-!\[#E5E5E5\]/g, replace: 'bg-text-main text-bg-main hover:bg-text-muted' },
        { regex: /text-black font-mono/g, replace: 'text-bg-main font-mono' },
        
      ];

      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          changed = true;
        }
      }

      const exactReplaces = [
        {
          search: 'className="bg-bg-main w-[280px] lg:w-[340px] shrink-0 border-r border-border-subtle relative overflow-hidden flex flex-col justify-center items-center"',
          replace: 'className="bg-checkered w-[280px] lg:w-[340px] shrink-0 border-r border-border-subtle relative overflow-hidden flex flex-col justify-center items-center"'
        },
        {
          search: 'style={{\n              backgroundImage: \'linear-gradient(45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(-45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-bg-input) 75%), linear-gradient(-45deg, transparent 75%, var(--color-bg-input) 75%)\',\n              backgroundSize: \'16px 16px\'\n            }}',
          replace: ''
        },
        {
          search: 'style={{\n                    backgroundImage: \'linear-gradient(45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(-45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-bg-input) 75%), linear-gradient(-45deg, transparent 75%, var(--color-bg-input) 75%)\',\n                    backgroundSize: \'16px 16px\'\n                  }}',
          replace: ''
        },
        {
          search: 'style={{\n                      backgroundImage: \'linear-gradient(45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(-45deg, var(--color-bg-input) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-bg-input) 75%), linear-gradient(-45deg, transparent 75%, var(--color-bg-input) 75%)\',\n                      backgroundSize: \'16px 16px\'\n                    }}',
          replace: ''
        }
      ]

      for (const { search, replace } of exactReplaces) {
        if (content.includes(search)) {
          content = content.replace(search, replace);
          changed = true;
        }
      }
      
      // Additional cleanup for leftover styles
      content = content.replace(/className="bg-bg-main flex items-center justify-center relative border-b border-border-color overflow-hidden shrink-0"\s+style=\{\{\s*backgroundImage: 'linear-gradient\([^}]+\}\}/g, 'className="bg-checkered flex items-center justify-center relative border-b border-border-color overflow-hidden shrink-0"');

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
};

traverse(path.join(__dirname, 'src/components'));
console.log('Typography and Layout Cleanup Done.');
