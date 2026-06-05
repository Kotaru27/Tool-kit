const fs = require('fs');
const glob = require('glob');

// Since glob is not installed, we can just use fs with recursive readdir.
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/components', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace labels or spans that have grey text and contain SpecialText
    // E.g. <span className="font-mono text-[12px] text-[#737373]..."><SpecialText speed={20}>Text</SpecialText></span>
    
    let regex1 = /<span([^>]*text-\[#737373\][^>]*)>\s*<SpecialText[^>]*>([^<]+)<\/SpecialText>\s*<\/span>/g;
    content = content.replace(regex1, '<span$1>$2</span>');

    // Also just any <SpecialText...> inside grey text, let's catch it.
    let regex2 = /<th([^>]*text-\[#737373\][^>]*)>\s*<SpecialText[^>]*>([^<]+)<\/SpecialText>\s*<\/th>/g;
    content = content.replace(regex2, '<th$1>$2</th>');

    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Done');
