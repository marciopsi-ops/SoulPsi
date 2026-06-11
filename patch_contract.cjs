const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Remove the "Termos de Contrato" div from Meu Perfil
content = content.replace(/<div className="mt-4">\s*<label className="block text-sm font-medium text-slate-700 mb-1">\s*Termos de Contrato e Prestação de Serviços Técnicos \(LGPD e\s*Regras\)\s*<\/label>[\s\S]*?<\/textarea>\s*<\/div>/g, '');

// 2. Add `companyContractTerms` to allowedKeys
if (!content.includes('"companyContractTerms"')) {
    content = content.replace(/"contractTerms",/g, '"contractTerms",\n        "companyContractTerms",');
}

// 3. Add `showContractEditor` state
if (!content.includes('const [showContractEditor')) {
    content = content.replace(/const \[activeTab, setActiveTab\] = useState/, 
                              'const [showContractEditor, setShowContractEditor] = useState<"paciente" | "empresa" | null>(null);\n  const [activeTab, setActiveTab] = useState');
}

// 4. Add the button next to the link copying part

// 4a. Pacientes
const pacienteLinkBtn = `getPublicLink(\`/?terms=\${userId}\`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>`;
const pacienteLinkBtnReplace = `getPublicLink(\`/?terms=\${userId}\`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                      <button
                        onClick={() => setShowContractEditor("paciente")}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                        title="Editar Contrato"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>`;
content = content.replace(pacienteLinkBtn, pacienteLinkBtnReplace);

// 4b. Empresas
const empresaLinkBtn = `getPublicLink(\`/?terms_company=\${userId}\`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>`;
const empresaLinkBtnReplace = `getPublicLink(\`/?terms_company=\${userId}\`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                      <button
                        onClick={() => setShowContractEditor("empresa")}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                        title="Editar Contrato"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>`;
content = content.replace(empresaLinkBtn, empresaLinkBtnReplace);

// 5. Add the modal for editing the contract
const modalHtml = `
      {showContractEditor && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Editar Termos de Contrato ({showContractEditor === "paciente" ? "Pacientes" : "Empresas"})
              </h3>
              <button
                onClick={() => setShowContractEditor(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-4">
                Este texto será exibido aos {showContractEditor === "paciente" ? "pacientes" : "empresas"} quando você enviar o
                link de termos para assinatura online.
              </p>
              <textarea
                rows={15}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-400 font-mono text-sm leading-relaxed"
                value={
                  showContractEditor === "paciente"
                    ? profileData?.contractTerms || ""
                    : profileData?.companyContractTerms || ""
                }
                onChange={(e) => {
                  onUpdateProfile({
                    ...profileData,
                    [showContractEditor === "paciente" ? "contractTerms" : "companyContractTerms"]: e.target.value
                  });
                }}
                placeholder="Insira as cláusulas do contrato aqui..."
              />
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md">
              <button
                onClick={() => setShowContractEditor(null)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const field = showContractEditor === "paciente" ? "contractTerms" : "companyContractTerms";
                    await updateDoc(doc(db, "profiles", userId), {
                       [field]: profileData?.[field] || "",
                       updatedAt: serverTimestamp(),
                    });
                    alert("Contrato salvo com sucesso!");
                    setShowContractEditor(null);
                  } catch(e) {
                    alert("Erro ao salvar");
                  }
                  setSaving(false);
                }}
                disabled={saving}
                className="px-5 py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 rounded-xl transition flex items-center gap-2"
              >
                {saving ? "Salvando..." : "Salvar Contrato"}
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('Editar Termos de Contrato ({showContractEditor')) {
    content = content.replace('      {editingCompanyId && editingCompanyId !== "new" && (', modalHtml + '\n      {editingCompanyId && editingCompanyId !== "new" && (');
}

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
