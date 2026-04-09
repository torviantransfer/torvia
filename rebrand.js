const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
process.chdir(ROOT);
console.log('Working dir:', process.cwd());

function walk(dir, ext) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && f !== 'node_modules' && f !== '.next' && f !== '.git') results = results.concat(walk(full, ext));
    else if (ext.some(e => full.endsWith(e))) results.push(full);
  }
  return results;
}

// Phase 1: Brand name
const files = walk('src', ['.tsx', '.ts', '.json', '.css']);
let count = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (/VELORA|Velora|velora/.test(content)) {
    content = content
      .replace(/VELORA Transfer/g, 'TORVIAN Transfer')
      .replace(/VELORA/g, 'TORVIAN')
      .replace(/Velora Transfer/g, 'Torvian Transfer')
      .replace(/Velora'yı/g, "Torvian'ı")
      .replace(/Velora'nın/g, "Torvian'ın")
      .replace(/Velora/g, 'Torvian')
      .replace(/velora_currency/g, 'torvian_currency')
      .replace(/velora/g, 'torvian');
    fs.writeFileSync(file, content, 'utf8');
    count++;
    console.log('Updated:', path.basename(file));
  }
}
console.log('Total files updated:', count);

// Phase 2: Contact info - phones
const allFiles = [
  ...walk('src', ['.tsx', '.ts', '.json', '.css']),
  ...walk('supabase', ['.sql']),
  '.env.local'
];
let count2 = 0;
for (const file of allFiles) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  // Old phone variants -> new primary phone
  content = content
    .replace(/905431451548/g, '905469407955')
    .replace(/\+90 543 145 15 48/g, '+90 546 940 79 55')
    .replace(/\+90-543-145-15-48/g, '+90-546-940-79-55')
    .replace(/tel:\+905431451548/g, 'tel:+905469407955');
  // Email changes
  content = content
    .replace(/info@veloratransfer\.com/g, 'torviantransfer@gmail.com')
    .replace(/veloratransfer@gmail\.com/g, 'torviantransfer@gmail.com')
    .replace(/admin@veloratransfer\.com/g, 'admin@torviantransfer.com');
  // Domain changes
  content = content
    .replace(/https:\/\/veloratransfer\.com/g, 'https://torviantransfer.com')
    .replace(/veloratransfer\.com/g, 'torviantransfer.com');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    count2++;
    console.log('Contact/Domain updated:', path.basename(file));
  }
}
console.log('Contact/Domain files updated:', count2);

// Root level files
const rootFiles = ['package.json', 'update-seo.js', 'run-seed.js', 'VELORA_PROGRESS.md', 'TODO.md', 'CLAUDE.md'];
for (const rf of rootFiles) {
  if (!fs.existsSync(rf)) continue;
  let content = fs.readFileSync(rf, 'utf8');
  const original = content;
  content = content
    .replace(/VELORA/g, 'TORVIAN')
    .replace(/Velora/g, 'Torvian')
    .replace(/velora/g, 'torvian')
    .replace(/905431451548/g, '905469407955')
    .replace(/\+90 543 145 15 48/g, '+90 546 940 79 55')
    .replace(/\+90-543-145-15-48/g, '+90-546-940-79-55')
    .replace(/info@veloratransfer\.com/g, 'torviantransfer@gmail.com')
    .replace(/veloratransfer@gmail\.com/g, 'torviantransfer@gmail.com')
    .replace(/https:\/\/veloratransfer\.com/g, 'https://torviantransfer.com')
    .replace(/veloratransfer\.com/g, 'torviantransfer.com');
  if (content !== original) {
    fs.writeFileSync(rf, content, 'utf8');
    console.log('Root updated:', rf);
  }
}

// app-level files (layout, robots, sitemap, etc.)
const appFiles = walk('.', ['.ts', '.tsx']).filter(f => f.includes('app') && !f.includes('node_modules') && !f.includes('.next'));
for (const file of appFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content
    .replace(/VELORA/g, 'TORVIAN')
    .replace(/Velora/g, 'Torvian')
    .replace(/velora/g, 'torvian')
    .replace(/905431451548/g, '905469407955')
    .replace(/\+90 543 145 15 48/g, '+90 546 940 79 55')
    .replace(/\+90-543-145-15-48/g, '+90-546-940-79-55')
    .replace(/info@veloratransfer\.com/g, 'torviantransfer@gmail.com')
    .replace(/veloratransfer@gmail\.com/g, 'torviantransfer@gmail.com')
    .replace(/https:\/\/veloratransfer\.com/g, 'https://torviantransfer.com')
    .replace(/veloratransfer\.com/g, 'torviantransfer.com');
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('App updated:', path.basename(file));
  }
}

console.log('\\n=== REBRAND COMPLETE ===');
