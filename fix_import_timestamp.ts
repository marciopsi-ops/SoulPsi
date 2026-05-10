import fs from 'fs';

const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /clientPayload\.createdAt = new Date\(\)\.toISOString\(\);\n\s+const clientRef = await addDoc\(collection\(db, `profiles\/\$\{userId\}\/clients`\), clientPayload\);/g,
  `clientPayload.createdAt = serverTimestamp();
                  const clientRef = await addDoc(collection(db, \`profiles/\${userId}/clients\`), clientPayload);
                  clientPayload.createdAt = new Date().toISOString();`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
