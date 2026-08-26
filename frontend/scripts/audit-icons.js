import fs from 'fs';
import path from 'path';

const srcDir = '/Users/omthakkar/Documents/GitHub/gsfc-placement-analyzer-/frontend/src';

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const lucideIcons = new Set();
try {
  const lucidePkg = await import('lucide-react');
  Object.keys(lucidePkg).forEach(k => lucideIcons.add(k));
} catch (e) {
  console.log('Could not load lucide-react directly:', e.message);
}

const allFiles = getAllFiles(srcDir);
let issuesFound = 0;

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all lucide-react import statements
  const importMatches = content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g);
  const importedLucide = new Set();
  for (const m of importMatches) {
    m[1].split(',').forEach(item => {
      const parts = item.trim().split(/\s+as\s+/);
      const original = parts[0].trim();
      const alias = parts[1] ? parts[1].trim() : original;
      if (alias) importedLucide.add(alias);
      if (original) importedLucide.add(original);
    });
  }

  // Find all JSX tags <PascalCase ...>
  const jsxTagMatches = content.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g);
  const usedTags = new Set();
  for (const m of jsxTagMatches) {
    usedTags.add(m[1]);
  }

  // Check if any used tag is a lucide icon but not in importedLucide and not defined in the file
  for (const tag of usedTags) {
    if (lucideIcons.has(tag) || tag === 'ImageIcon') {
      if (!importedLucide.has(tag)) {
        // Check if defined as local component / var / import
        const isLocallyDefined = new RegExp(`(const|let|var|function|class|import)\\s+${tag}\\b`).test(content);
        if (!isLocallyDefined) {
          console.error(`[MISSING IMPORT] In ${path.relative(srcDir, filePath)}: <${tag} /> is used but not imported!`);
          issuesFound++;
        }
      }
    }
  }
}

if (issuesFound === 0) {
  console.log('✅ ALL lucide-react icons across all files in frontend/src are 100% properly imported and valid!');
} else {
  console.log(`❌ Found ${issuesFound} missing imports!`);
}
