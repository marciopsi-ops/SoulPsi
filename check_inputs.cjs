const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const classNames = content.match(/<input[^>]+className=\"[^\"]+\"/g) || [];
console.log(classNames.slice(0, 10).join('\n'));
