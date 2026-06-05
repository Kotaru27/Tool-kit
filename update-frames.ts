import fs from 'fs';
import path from 'path';

function updateFile(file: string, replacer: (content: string) => string) {
  const p = path.join(process.cwd(), 'src/components', file);
  let content = fs.readFileSync(p, 'utf8');
  content = replacer(content);
  // add import if changed
  if (content.includes('delayFrames') || content.includes('nextFrame')) {
    if (!content.includes('frame.ts') && !content.includes('../utils/frame')) {
      content = `import { nextFrame, delayFrames } from '../utils/frame';\n` + content;
    }
  }
  fs.writeFileSync(p, content);
}

updateFile('ImageSplitter.tsx', c => c.replace(/await new Promise\(\(r\) => setTimeout\(r, 100\)\);/g, 'await delayFrames(6);'));
updateFile('Storyboard.tsx', c => c.replace(/await new Promise\(resolve => setTimeout\(resolve, 50\)\);/g, 'await delayFrames(3);').replace(/setTimeout\(addNewProject, 0\);/g, 'nextFrame().then(addNewProject);'));
updateFile('VideoStills.tsx', c => c.replace(/await new Promise\(\(resolve\) => setTimeout\(resolve, 0\)\);/g, 'await nextFrame();'));

console.log('done updating frames');
