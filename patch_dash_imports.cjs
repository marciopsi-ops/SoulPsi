const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(
  `import {`,
  `import {\n  Eye,\n  EyeOff,`
);

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
