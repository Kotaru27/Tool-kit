import fs from 'fs';

async function extract() {
  const r = await fetch('https://kotaru27.github.io/vA-edits/');
  const html = await r.text();
  const match = html.match(/<script type="module" crossorigin>(.*?)<\/script>/s);
  if (!match) {
    console.log('No script tag match');
    return;
  }
  const js = match[1];

  // Search for occurrence of "Video Compressor" or other labels
  // Let's find index of "Video Compressor"
  const idx = js.indexOf('"Video Compressor"');
  console.log('Index of Video Compressor:', idx);

  // Let's print around that index
  if (idx !== -1) {
    fs.writeFileSync('extracted_around_tabs.txt', js.substring(idx - 10000, idx + 10000));
    console.log('Wrote extracted around tabs to file!');
  }
}

extract();
