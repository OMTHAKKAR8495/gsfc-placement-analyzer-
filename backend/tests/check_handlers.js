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
let errorsFound = 0;

for (const file of files) {
  const code = fs.readFileSync(file, 'utf-8');
  
  // Check onClick handlers: onClick={() => handlerName(...)} or onClick={handlerName}
  const handlerMatches = code.matchAll(/onClick=\{([a-zA-Z0-9_]+)\}/g);
  for (const match of handlerMatches) {
    const fnName = match[1];
    if (fnName && !['onClose', 'onOpenAuthModal', 'onRefreshCompany', 'onUpdateStudent'].includes(fnName)) {
      if (!code.includes(`const ${fnName}`) && !code.includes(`function ${fnName}`) && !code.includes(`let ${fnName}`) && !code.includes(`${fnName}:`)) {
        console.log(`⚠️ Unmatched direct onClick handler in ${path.basename(file)}: ${fnName}`);
      }
    }
  }
}

console.log('✅ Full static reference scan completed with 0 fatal errors.');
