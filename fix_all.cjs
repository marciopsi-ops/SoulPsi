const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Lucide Icons
content = content.replace(
  "AlertCircle, Bell, Search } from 'lucide-react'",
  "AlertCircle, Bell, Search, BookOpen, Link, UserCheck, TrendingUp } from 'lucide-react'"
);

// 2. Add 'materiais' to activeTab state if needed?
// Type of activeTab might be a string literal, let's check
if (content.includes("activeTab, setActiveTab] = useState<'perfil'")) {
  content = content.replace(
    "activeTab, setActiveTab] = useState<'perfil'",
    "activeTab, setActiveTab] = useState<'perfil' | 'materiais'"
  );
} else {
  // if it's just useState<string>
}

// 3. Add sidebar button for 'materiais'
const sidebarEmpresasBtn = `<Building className="w-5 h-5 flex-shrink-0" />
              <span>Gestão de empresas e faturamento</span>
            </button>`;

if (content.includes(sidebarEmpresasBtn) && !content.includes("Gestão de Materiais")) {
  content = content.replace(sidebarEmpresasBtn, sidebarEmpresasBtn + `\n            <button \n              onClick={() => setActiveTab('materiais')}\n              className={cn("w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition", activeTab === 'materiais' ? "bg-amber-50 text-amber-500" : "text-slate-600 hover:bg-slate-50")}\n            >\n              <BookOpen className="w-5 h-5 flex-shrink-0" />\n              <span>Gestão de Materiais</span>\n            </button>`);
}

// 4. Extract Materiais block from Perfil
const regexMateriais = /<div className="mt-6">\s*<label className="block text-sm font-medium text-slate-700 mb-2">Materiais Exclusivos[\s\S]*?<div className="mt-6 border-t border-slate-100 pt-6">/gm;

const matchMateriais = regexMateriais.exec(content);
if (matchMateriais) {
  const extracted = matchMateriais[0].replace(`<div className="mt-6 border-t border-slate-100 pt-6">`, '');
  
  // remove from original location
  content = content.replace(extracted, '');
  
  // put it in a new activeTab block after 'perfil' end
  const perfilEnd = `</form>\n          </div>\n        )}`;
  const novaAba = `\n\n        {activeTab === 'materiais' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
             <div className="flex flex-col mb-6 gap-2">
                 <h2 className="text-xl font-bold text-slate-800">Gestão de Materiais</h2>
                 <p className="text-sm text-slate-500">Compartilhe links do Google Drive, Notion ou outras plataformas com seus clientes, como formulários de anamnese, ebooks ou exercícios.</p>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); handleProfileSave(); }}>
                ${extracted}
                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                  <button type="submit" className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition shadow-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5"/>
                    Salvar Alterações
                  </button>
                </div>
             </form>
          </div>
        )}`;

  // find proper place to insert it
  if (content.includes("</form>\n          </div>\n        )")) {
    content = content.replace("</form>\n          </div>\n        )", "</form>\n          </div>\n        )" + novaAba);
  } else if (content.includes("</form>\n             </div>\n          </div>\n        )")) {
    content = content.replace("</form>\n             </div>\n          </div>\n        )", "</form>\n             </div>\n          </div>\n        )" + novaAba);
  }
}

// 5. Add Dashboard Metrics
const metricsBlock = `
             {/* Dashboard Metrics */}
             {clients.length > 0 && appointments.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                       <h3 className="font-medium text-slate-500 mb-1">Total de Pacientes Ativos</h3>
                       <p className="text-2xl font-bold text-slate-800">{clients.filter(c => c.isActive !== false).length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                       <UserCheck className="w-6 h-6 text-emerald-600" />
                    </div>
                 </div>
                 <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                       <h3 className="font-medium text-slate-500 mb-1">Média de Valor de Serviços</h3>
                       <p className="text-2xl font-bold text-slate-800">R$ {appointmentsInPeriod.length > 0 ? ((totalPaidInPeriod + totalPendingInPeriod) / appointmentsInPeriod.length).toFixed(2).replace('.', ',') : '0,00'}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                       <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                 </div>
               </div>
             )}
             
             {/* Dashboard Metrics Charts */}
`;

if (content.includes("{/* Dashboard Metrics */}")) {
  content = content.replace("{/* Dashboard Metrics */}", metricsBlock);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched dashboard successfully');
