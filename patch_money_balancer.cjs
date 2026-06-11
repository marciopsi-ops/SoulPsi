const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace `R${" "} { ... }` with `{formatMoneyUI( ... , hideFinance)}`.
// We need to be careful with nested braces if they span multiple lines.
// So let's write a script that does bracket balancing.

function replaceMoney(content) {
  let result = content;
  let searchStr = 'R${" "}\\s*\\{';
  let regex = new RegExp('R\\$\\{\" \"\\}\\s*\\{', 'g');
  
  let match;
  while ((match = regex.exec(result)) !== null) {
    let startIndex = match.index;
    let braceStartIndex = startIndex + match[0].length - 1;
    let braceCount = 1;
    let endIndex = -1;
    
    for (let i = braceStartIndex + 1; i < result.length; i++) {
      if (result[i] === '{') braceCount++;
      if (result[i] === '}') braceCount--;
      
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (endIndex !== -1) {
      let expression = result.substring(braceStartIndex + 1, endIndex);
      
      let replacement = `{formatMoneyUI(${expression}, hideFinance)}`;
      
      result = result.substring(0, startIndex) + replacement + result.substring(endIndex + 1);
      
      // Update regex to find next occurrence from the start since length changed
      regex.lastIndex = 0; 
    }
  }
  return result;
}

content = replaceMoney(content);

// Remove extra `.toFixed(n).replace(...)` that might be lingering
// Some cases might have `.toFixed(2)` inside `formatMoneyUI`.
// `.toFixed(2)` is safe to leave inside since formatMoneyUI calls Number(value), but the `.replace(".", ",")` will cause NaN.
content = content.replace(/\.toFixed\(2\)\s*\.replace\("\.", ","\)/g, "");

content = content.replace(/R\$ \{(.*?)\.toFixed\(2\)\.replace\("\.", ","\)\}/g, "{formatMoneyUI($1, hideFinance)}");

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
