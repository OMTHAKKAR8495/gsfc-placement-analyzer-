import fs from 'fs';
import path from 'path';

const studentDir = '/Users/omthakkar/Documents/GitHub/gsfc-placement-analyzer-/frontend/src/components/student';

function checkHooks(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let functionStarted = false;
  let functionName = '';
  let earlyReturnLines = [];
  let hookLines = [];
  let bracketDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for component function definition
    const funcMatch = line.match(/(?:export\s+default\s+function|export\s+function|function|const)\s+([A-Z][a-zA-Z0-9_]*)/);
    if (funcMatch) {
      functionStarted = true;
      functionName = funcMatch[1];
      earlyReturnLines = [];
      hookLines = [];
    }

    if (functionStarted) {
      // Check for return statement that is likely an early return (not at the end of the component)
      if (line.match(/^\s*if\s*\(.*\)\s*return\b/) || (line.match(/^\s*return\s*\(?/) && !line.includes('export') && i < lines.length - 20)) {
        earlyReturnLines.push({ lineNum, line: line.trim() });
      }

      // Check for hooks
      const hookMatch = line.match(/\b(use[A-Z][a-zA-Z0-9_]*)\s*\(/);
      if (hookMatch) {
        hookLines.push({ lineNum, hook: hookMatch[1], line: line.trim() });
        
        // If there were early returns before this hook
        if (earlyReturnLines.length > 0) {
          console.log(`❌ [HOOK AFTER RETURN] in ${path.basename(filePath)} -> Component: ${functionName}`);
          console.log(`   Hook: ${hookMatch[1]} at Line ${lineNum}: ${line.trim()}`);
          console.log(`   Early return was at Line ${earlyReturnLines[0].lineNum}: ${earlyReturnLines[0].line}`);
        }
      }
    }
  }
}

const files = fs.readdirSync(studentDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
files.forEach(f => checkHooks(path.join(studentDir, f)));

// Also check App.jsx
checkHooks('/Users/omthakkar/Documents/GitHub/gsfc-placement-analyzer-/frontend/src/App.jsx');
