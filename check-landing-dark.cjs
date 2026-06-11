const fs = require('fs');
let s = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
let lines = s.split('\n');
for(let i=0; i<lines.length; i++) {
  if (lines[i].toLowerCase().includes('dark')) {
    console.log(i + ": " + lines[i].trim());
  }
}
