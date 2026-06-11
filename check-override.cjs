const fs = require('fs');
let s = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
let lines = s.split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('text-slate-900') && lines[i].includes('dark:bg-slate-800') && !lines[i].includes('dark:text-')) {
    console.log(i + ": " + lines[i].trim());
  }
}
