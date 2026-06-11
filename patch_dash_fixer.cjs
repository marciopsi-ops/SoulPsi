const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Fixes:
content = content.replace(/R\$ \{gp\.totalPending\)\}/g, "{formatMoneyUI(gp.totalPending)}");
content = content.replace(/R\$ \{\(total as number\)\)\}/g, "{formatMoneyUI(total as number)}");
content = content.replace(/R\$ \$\{amount\)\}/g, "R$$ $${amount.toFixed(2).replace('.', ',')}");
content = content.replace(/Total: R\$ \$\{newTotal\)\}/g, "Total: R$$ $${newTotal.toFixed(2).replace('.', ',')}");

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
