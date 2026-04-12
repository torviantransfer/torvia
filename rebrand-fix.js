const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
process.chdir(ROOT);

function walk(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(f)) {
      results = results.concat(walk(full, ext));
    } else if (ext.some(e => full.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

const files = [
  ...walk('src', ['.tsx', '.ts', '.json', '.css']),
  ...walk('supabase', ['.sql']),
  '.env.local',
  'package.json',
  'update-seo.js',
  'run-seed.js',
];

// Also add root .md files
for (const f of fs.readdirSync('.')) {
  if (f.endsWith('.md')) files.push(f);
}

let totalFixed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix case issues: TORVIANtransfer → torviantransfer (domain context)
  content = content.replace(/TORVIANtransfer/g, 'torviantransfer');
  content = content.replace(/Torviantransfer/g, 'torviantransfer');
  
  // Fix emails - everything should use gmail
  content = content.replace(/info@torviantransfer\.com/g, 'torviantransfer@gmail.com');
  content = content.replace(/admin@torviantransfer\.com/g, 'torviantransfer@gmail.com');
  
  // Fix domain URLs
  content = content.replace(/https:\/\/torviantransfer\.com/g, 'https://torviantransfer.com');
  
  // Fix any remaining old phone numbers
  content = content.replace(/905431451548/g, '08508401327');
  content = content.replace(/905469407955/g, '08508401327');
  content = content.replace(/908508401327/g, '08508401327');
  content = content.replace(/\+90 543 145 15 48/g, '0850 840 1327');
  content = content.replace(/\+90 546 940 79 55/g, '0850 840 1327');
  content = content.replace(/\+90-543-145-15-48/g, '0850-840-1327');
  content = content.replace(/tel:\+905431451548/g, 'tel:08508401327');
  content = content.replace(/tel:\+905469407955/g, 'tel:08508401327');
  content = content.replace(/tel:\+908508401327/g, 'tel:08508401327');

  // Fix any remaining old emails
  content = content.replace(/info@veloratransfer\.com/g, 'torviantransfer@gmail.com');
  content = content.replace(/veloratransfer@gmail\.com/g, 'torviantransfer@gmail.com');
  
  // Fix any remaining old domain
  content = content.replace(/veloratransfer\.com/g, 'torviantransfer.com');
  
  // Fix any remaining VELORA/Velora/velora text
  content = content.replace(/VELORA Transfer/g, 'TORVIAN Transfer');
  content = content.replace(/VELORA/g, 'TORVIAN');
  content = content.replace(/Velora Transfer/g, 'Torvian Transfer');
  content = content.replace(/Velora/g, 'Torvian');
  // Careful with velora in code identifiers
  content = content.replace(/velora_/g, 'torvian_');
  content = content.replace(/\/velora/g, '/torvian');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log('Fixed:', file);
  }
}

console.log('\nTotal files fixed:', totalFixed);
console.log('=== CLEANUP COMPLETE ===');
