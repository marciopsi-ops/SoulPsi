import * as fs from 'fs';
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/key=\{s\.id\}/g, 'key={s.id || s.title || Math.random().toString()}');
content = content.replace(/value=\{s\.id\}/g, 'value={s.id || s.title}');
content = content.replace(/x\.id === e\.target\.value/g, '(x.id || x.title) === e.target.value');

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
console.log('Fixed IDs');
