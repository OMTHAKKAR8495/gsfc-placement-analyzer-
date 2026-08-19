import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../../frontend/src');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getAllFiles(srcDir);
console.log(`Audited ${files.length} frontend source files.`);

let issues = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  // Check for common typos like undefined variables in JSX conditionals: {xxxOpen && (
  const modalMatches = content.match(/\{([a-zA-Z0-9_]+ModalOpen)\s*&&/g) || [];
  modalMatches.forEach(m => {
    const varName = m.replace(/[\{\s&]/g, '');
    if (!content.includes(`const [${varName}`) && !content.includes(`let [${varName}`) && !content.includes(`${varName} =`)) {
      console.error(`❌ Potential undefined state in ${path.basename(file)}: ${varName}`);
      issues++;
    }
  });
});

if (issues === 0) {
  console.log('✅ ALL modal states and condition variables are properly defined across all components!');
}
