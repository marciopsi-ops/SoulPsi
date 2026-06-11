const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');
let lines = s.split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('dark:bg-') && !lines[i].includes('dark:text-')) {
    console.log(i + ": " + lines[i].trim());
    count++;
  }
}
console.log('Total missings App.tsx: ' + count);
