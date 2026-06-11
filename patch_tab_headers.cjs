const React = require('fs'); // Just keeping syntax highlighting
const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const tabHeaderCode = `\nconst TabHeader = ({ icon: Icon, title, description, badge }: any) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-amber-500">
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {badge && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">{badge}</span>}
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);\n\n`;

content = content.replace("export function Dashboard({", tabHeaderCode + "export function Dashboard({");

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
