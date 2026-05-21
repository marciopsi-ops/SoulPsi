import fs from 'fs';

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!content.includes('const [activeServiceTab, setActiveServiceTab]')) {
   content = content.replace(
      "const [activeTab, setActiveTab] = useState<'pacientes'",
      "const [activeServiceTab, setActiveServiceTab] = useState<'voce' | 'empresa' | 'psicologos' | 'igrejas'>('voce');\n  const [activeTab, setActiveTab] = useState<'pacientes'"
   );
}

// Target the start of servicos div
const oldServicosComponentStart = `{activeTab === 'servicos' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
             <div className="flex flex-col mb-6 gap-2">
                 <h2 className="text-xl font-bold text-slate-800">Meus Serviços</h2>
                 <p className="text-sm text-slate-500">Faça a gestão dos serviços oferecidos no seu perfil público.</p>
             </div>
             
             <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700">Meus Serviços</label>
                  <button type="button" onClick={() => {
                     setEditForm({
                       ...editForm, 
                       services: [{ id: Date.now().toString(), category: 'voce', title: '', description: '', price: 0 }, ...(editForm.services || [])]
                     });
                  }} className="flex items-center gap-2 text-sm text-amber-500 font-medium hover:text-amber-600 transition px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100">
                    <Plus className="w-4 h-4" /> Novo Serviço
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editForm.services || []).map((svc: any, idx: number) => (`;

const newServicosComponentStart = `{activeTab === 'servicos' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
             <div className="flex flex-col mb-6 gap-2">
                 <h2 className="text-xl font-bold text-slate-800">Meus Serviços</h2>
                 <p className="text-sm text-slate-500">Faça a gestão dos serviços oferecidos no seu perfil público.</p>
             </div>
             
             <div className="flex flex-wrap border-b border-slate-200 mb-6 font-medium text-sm gap-6 overflow-x-auto">
               <button type="button" onClick={() => setActiveServiceTab('voce')} className={"pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " + (activeServiceTab === 'voce' ? "border-b-2 border-amber-500 text-amber-600 font-bold" : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")}>
                 Para Você
               </button>
               <button type="button" onClick={() => setActiveServiceTab('empresa')} className={"pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " + (activeServiceTab === 'empresa' ? "border-b-2 border-amber-500 text-amber-600 font-bold" : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")}>
                 Para Empresas
               </button>
               <button type="button" onClick={() => setActiveServiceTab('psicologos')} className={"pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " + (activeServiceTab === 'psicologos' ? "border-b-2 border-amber-500 text-amber-600 font-bold" : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")}>
                 Para Psicólogos
               </button>
               <button type="button" onClick={() => setActiveServiceTab('igrejas')} className={"pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " + (activeServiceTab === 'igrejas' ? "border-b-2 border-amber-500 text-amber-600 font-bold" : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")}>
                 Para Igrejas
               </button>
             </div>
             
             <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700">Meus Serviços - {(activeServiceTab==='voce'?'Para Você':activeServiceTab==='empresa'?'Para Empresas':activeServiceTab==='psicologos'?'Para Psicólogos':'Para Igrejas')}</label>
                  <button type="button" onClick={() => {
                     setEditForm({
                       ...editForm, 
                       services: [{ id: Date.now().toString(), category: activeServiceTab, title: '', description: '', price: 0 }, ...(editForm.services || [])]
                     });
                  }} className="flex items-center gap-2 text-sm text-amber-500 font-medium hover:text-amber-600 transition px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100">
                    <Plus className="w-4 h-4" /> Novo Serviço
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(editForm.services || []).map((svc: any, idx: number) => {
                    const actualCategory = svc.category || 'voce';
                    // We treat 'psicologo' and 'psicologos' identically, default to psicologos
                    const normalizedCategory = actualCategory === 'psicologo' ? 'psicologos' : actualCategory;
                    if (normalizedCategory !== activeServiceTab) return null;
                    return (`;

if (content.indexOf(oldServicosComponentStart) !== -1) {
  content = content.replace(oldServicosComponentStart, newServicosComponentStart);
  console.log("Successfully replaced old servicos block");
  
  // Replace the closing iteration brackets
  content = content.replace(
    `                           />
                         </div>
                       </div>
                    </div>
                  ))}
                </div>`,
    `                           />
                         </div>
                       </div>
                    </div>
                  );
                  })}
                </div>`
  );
  
  // Remove category selection
  const categorySelectionHtml = `                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="block text-xs font-medium text-slate-500 mb-1">Público</label>
                             <select className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-amber-400 focus:outline-none bg-white"
                               value={svc.category || 'voce'}
                               onChange={e => {
                                 const arr = [...editForm.services];
                                 arr[idx].category = e.target.value;
                                 setEditForm({...editForm, services: arr});
                               }}
                             >
                               <option value="voce">Para Você (Pacientes)</option>
                               <option value="empresa">Para sua Empresa</option>
                               <option value="igrejas">Para Igrejas</option>
                               <option value="psicologos">Para Psicólogos</option>
                               <option value="psicologo">Para Psicólogos (Alternativo)</option>
                             </select>
                           </div>
                           <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Preço</label>`;
                            
  const categoryReplacementHtml = `                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           <div className="hidden">
                             <input type="hidden" value={svc.category || activeServiceTab} />
                           </div>
                           <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Preço</label>`;
                            
  content = content.replace(categorySelectionHtml, categoryReplacementHtml);
} else {
  console.log("Could not find old servicos block");
}

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
