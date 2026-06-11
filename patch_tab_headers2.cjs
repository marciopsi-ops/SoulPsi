const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!content.includes('Star,')) {
  content = content.replace("CreditCard,", "CreditCard,\n  Star,");
}

let codeHeader = `\nconst TabHeader = ({ icon: Icon, title, description, badge }: any) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-[rgb(var(--theme-primary))]">
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {badge && <span className="px-2 py-0.5 bg-[rgba(var(--theme-primary),0.1)] text-[rgb(var(--theme-primary))] text-xs font-medium rounded-full">{badge}</span>}
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);\n\n`;

content = content.replace("const TabHeader = ({ icon: Icon, title, description, badge }: any) => (\n  <div className=\"bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4\">\n    <div className=\"p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-amber-500\">\n      <Icon className=\"w-6 h-6\" />\n    </div>\n    <div className=\"flex-1\">\n      <div className=\"flex items-center gap-3 mb-1\">\n        <h2 className=\"text-xl font-bold text-slate-800\">{title}</h2>\n        {badge && <span className=\"px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full\">{badge}</span>}\n      </div>\n      <p className=\"text-sm text-slate-500 leading-relaxed\">{description}</p>\n    </div>\n  </div>\n);", codeHeader.trim());

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
