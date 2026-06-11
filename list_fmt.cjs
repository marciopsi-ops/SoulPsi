const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let lines = content.split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('formatMoneyUI')) {
    console.log((i+1) + ": " + lines[i].trim());
    count++;
    if (count > 30) break;
  }
}
