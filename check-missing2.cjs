const fs = require('fs');
let s = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let lines = s.split('\n');
let count = 0;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('dark:bg-slate-900') && !lines[i].includes('dark:text-')) {
    console.log(i + ": " + lines[i].trim());
    count++;
  }
}
console.log('Total missing dark:text- for 900: ' + count);
