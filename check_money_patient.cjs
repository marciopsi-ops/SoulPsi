const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// we want to find how the patient details are rendered, specifically the money
function findMoneyLines() {
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('formatMoneyUI')) {
      // already converted
    } else if (lines[i].includes('R$') || (lines[i].includes('toLocaleString') && lines[i].includes('pt-BR'))) {
        console.log((i+1) + ': ' + lines[i].trim());
    }
  }
}
findMoneyLines();
