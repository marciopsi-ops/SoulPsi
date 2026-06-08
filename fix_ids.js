const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace key={s.id}
content = content.replace(/key=\{s\.id\}/g, 'key={s.id || s.title || Math.random().toString()}');
// Replace value={s.id}
content = content.replace(/value=\{s\.id\}/g, 'value={s.id || s.title}');

// Replace x.id === e.target.value
content = content.replace(/x\.id === e\.target\.value/g, '(x.id || x.title) === e.target.value');

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
console.log('Fixed IDs');
