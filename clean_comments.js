const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove JSX comments: {/* ... */}
  content = content.replace(/\{\/\*[\s\S]*?\*\/\}\r?\n?/g, '');

  // 2. Remove single line comments that take up the whole line (ignoring leading whitespace)
  // This avoids removing // inside URLs like https://
  content = content.replace(/^\s*\/\/.*$/gm, '');

  // 3. Remove multiple empty lines left behind
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      cleanFile(fullPath);
    }
  }
}

console.log('Cleaning comments...');
walkDir(path.join(__dirname, 'components'));
walkDir(path.join(__dirname, 'src'));
console.log('Done.');
