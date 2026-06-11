const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Remove the old formatMoneyUI inside Dashboard
content = content.replace(
  `  const formatMoneyUI = (value: any) => {\n    if (hideFinance) return "R$ •••••";\n    if (value === undefined || value === null) return "R$ 0,00";\n    const num = Number(value);\n    if (isNaN(num)) return "R$ 0,00";\n    return \`R$ \${num.toFixed(2).replace(".", ",")}\`;\n  };\n`,
  ""
);

// 2. Add it globally at the top (after imports)
content = content.replace(
  `function CostManager({`,
  `export const formatMoneyUI = (value: any, hideFinance: boolean = false) => {\n  if (hideFinance) return "R$ •••••";\n  if (value === undefined || value === null) return "R$ 0,00";\n  const num = Number(value);\n  if (isNaN(num)) return "R$ 0,00";\n  return \`R$ \${num.toFixed(2).replace(".", ",")}\`;\n};\n\nfunction CostManager({`
);

// 3. Update all {formatMoneyUI(X)} to {formatMoneyUI(X, hideFinance)}
content = content.replace(/\{formatMoneyUI\(([^}]+?)\)\}/g, "{formatMoneyUI($1, hideFinance)}");
content = content.replace(/formatMoneyUI\(([^,]+?)\)/g, "formatMoneyUI($1, hideFinance)");

// Wait, the regex `formatMoneyUI\(([^,]+?)\)` might replace correctly if it doesn't already have `, hideFinance`.
// Let's just do a simpler replacement globally.
content = content.replace(/formatMoneyUI\((.*?)\)/g, (match, p1) => {
  if (p1.includes('hideFinance')) return match; 
  return `formatMoneyUI(${p1}, hideFinance)`;
});

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
