const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// For visao_geral
content = content.replace(
  `<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">\n              <h2 className="text-xl font-bold text-slate-800 mb-6">\n                Dashboard Geral de Faturamento\n              </h2>`,
  `<div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">`
);

// Any other redundant headers?
// "Gestão de Avaliações"
content = content.replace(`<h2 className="text-xl font-bold text-slate-800 mb-6">\n                Gestão de Avaliações\n              </h2>`, "");

// "Minha Agenda"
content = content.replace(`<h2 className="text-xl font-bold text-slate-800 mb-6">Minha Agenda</h2>`, "");

// "Meu Perfil Público"
content = content.replace(`<h2 className="text-xl font-bold text-slate-800 mb-6">\n                Meu Perfil Público\n              </h2>`, "");

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
