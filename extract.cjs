const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const results = [];
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('R$')) {
    results.push((i+1) + ': ' + lines[i]);
  }
}
fs.writeFileSync('money_lines.txt', results.join('\n'));
