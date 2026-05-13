const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /\{clients\.length > 0 && \([\s\S]*?<optgroup label="Pacientes Cadastrados">[\s\S]*?<\/optgroup>\s*\)\}/g;

code = code.replace(regex, '');

// Also handle the alphabetic sorting of clients
const sortRegex = /\{filteredClients\.map\(client => \{/g;
code = code.replace(sortRegex, '{[...filteredClients].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(client => {');

fs.writeFileSync('src/components/Dashboard.tsx', code);