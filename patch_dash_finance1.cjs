const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add states
content = content.replace(
  `  const [clients, setClients] = useState<any[]>([]);`,
  `  const [clients, setClients] = useState<any[]>([]);\n  const [hideFinance, setHideFinance] = useState(true);\n\n  const formatMoneyUI = (value: any) => {\n    if (hideFinance) return "R$ •••••";\n    if (value === undefined || value === null) return "R$ 0,00";\n    const num = Number(value);\n    if (isNaN(num)) return "R$ 0,00";\n    return \`R$ \${num.toFixed(2).replace(".", ",")}\`;\n  };\n`
);

// Add the button above the sidebar items
content = content.replace(
  `<aside className="w-full md:w-64 flex-shrink-0 print:hidden">\n        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">`,
  `<aside className="w-full md:w-64 flex-shrink-0 print:hidden">\n        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 mb-6">\n          <button onClick={() => setHideFinance(!hideFinance)} className="flex items-center justify-center gap-2 p-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition rounded-2xl hover:bg-slate-50">\n            {hideFinance ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}\n            {hideFinance ? "Mostrar Valores" : "Ocultar Valores"}\n          </button>\n        </div>\n        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">`
);

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
