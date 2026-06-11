const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('R${" "}')) {
    console.log(`Line ${i+1}:`);
    console.log(lines.slice(i-1, i+4).join('\n'));
    console.log('---');
  }
}
