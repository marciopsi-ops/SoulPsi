const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// I will just look for `formatMoneyUI(` and count braces/parentheses.

let result = '';
let regex = /formatMoneyUI\s*\(/g;
let lastIndex = 0;
let match;

while ((match = regex.exec(content)) !== null) {
  let startIndex = match.index;
  let parenStartIndex = startIndex + match[0].length - 1;
  let parenCount = 1;
  let endIndex = -1;
  
  for (let i = parenStartIndex + 1; i < content.length; i++) {
    if (content[i] === '(') parenCount++;
    if (content[i] === ')') parenCount--;
    
    if (parenCount === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex !== -1) {
    let expression = content.substring(parenStartIndex + 1, endIndex);
    
    if (expression.includes('hideFinance')) {
      result += content.substring(lastIndex, endIndex + 1);
    } else {
      result += content.substring(lastIndex, endIndex) + ', hideFinance)';
    }
    lastIndex = endIndex + 1;
  }
}
result += content.substring(lastIndex);

fs.writeFileSync('src/components/Dashboard.tsx', result, 'utf8');
