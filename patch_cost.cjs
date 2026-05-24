const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

content = content.replace(/<DollarSign className="w-5 h-5 text-red-500" \/>\s*Custos e Despesas\s*<\/h3>/, '<DollarSign className={`w-5 h-5 ${isIncome ? "text-emerald-500" : "text-red-500"}`} />\n                 {isIncome ? "Outras Receitas" : "Custos e Despesas"}\n              </h3>');
content = content.replace(/<div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-100 flex items-center justify-between mb-4">/, '<div className={`p-3 rounded-lg border flex items-center justify-between mb-4 ${isIncome ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100"}`}>');
content = content.replace(/<span className="text-red-500 font-normal text-xs ml-1">\(inclui custos fixos\)<\/span>/, '<span className={`font-normal text-xs ml-1 ${isIncome ? "text-emerald-500" : "text-red-500"}`}>(inclui {isIncome ? "valores" : "custos"} fixos)</span>');
fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
