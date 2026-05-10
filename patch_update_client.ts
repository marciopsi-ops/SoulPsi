import fs from 'fs';

const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /await updateDoc\(doc\(db, `profiles\/\$\{userId\}\/clients\/\$\{existing\.id\}`\), clientPayload\);/g,
  `const updatePayload = { ...clientPayload };
                   delete updatePayload.lgpdAccepted;
                   await updateDoc(doc(db, \`profiles/\${userId}/clients/\${existing.id}\`), updatePayload);`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed updateDoc payload in import');
