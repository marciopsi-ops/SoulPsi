import fs from 'fs';
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');
content = content.replace(/\\n/g, '');
fs.writeFileSync('src/components/LandingPage.tsx', content, 'utf8');
console.log('Fixed newlines');
