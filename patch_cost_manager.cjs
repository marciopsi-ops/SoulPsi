const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add hideFinance to CostManager props
content = content.replace(
  `  onManageAccounts?: () => void;\n}) {`,
  `  onManageAccounts?: () => void;\n  hideFinance?: boolean;\n}) {`
);

content = content.replace(
  `  onManageAccounts,\n}: {`,
  `  onManageAccounts,\n  hideFinance = true,\n}: {`
);

// Add hideFinance to <CostManager ... /> calls
content = content.replace(/<CostManager/g, "<CostManager hideFinance={hideFinance}");

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
