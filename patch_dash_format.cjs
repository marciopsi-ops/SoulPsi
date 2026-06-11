const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex1 = /R\$\{" "\}\s*\{([\s\S]*?)\.toFixed\(2\)\.replace\("\.", ","\)\}/g;
content = content.replace(regex1, (match, p1) => {
  return `{formatMoneyUI(${p1.trim()})}`;
});

const regex2 = /R\$ \{([\s\S]*?)\.toFixed\(2\)\.replace\("\.", ","\)\}/g;
content = content.replace(regex2, (match, p1) => {
  return `{formatMoneyUI(${p1.trim()})}`;
});

// For `R${" "}\n{Number(apptData.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const regex3 = /R\$\{" "\}\s*\{\s*Number\(([^)]+)\)\.toLocaleString\("pt-BR"[^}]+\)\s*\}/g;
content = content.replace(regex3, (match, p1) => {
  return `{formatMoneyUI(${p1.trim()})}`;
});
const regex4 = /R\$\{" "\}\s*\{\s*([^}]+)\.toLocaleString\("pt-BR"[^}]+\)\s*\}/g;
content = content.replace(regex4, (match, p1) => {
  return `{formatMoneyUI(${p1.trim()})}`;
});

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
