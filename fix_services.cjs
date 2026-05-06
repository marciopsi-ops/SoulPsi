const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const regex = /<label className="block text-xs font-medium text-slate-500 mb-1">Descrição<\/label>[\s\S]*?<\/textarea>\s*<\/div>\s*<\/div>\s*\)\)/g;

content = content.replace(regex, (match) => {
    // Return original match without the ending `</div>\n))`
    let str = match.replace(/<\/div>\s*\)\)$/, '');
    
    // Add the new fields
    const additions = `
                        <div className="mt-4 border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-2">Opções de Liberação para o Paciente</label>
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input 
                                  type="checkbox" 
                                  checked={svc.allowScheduling !== false}
                                  onChange={e => {
                                    const arr = [...editForm.services];
                                    arr[idx].allowScheduling = e.target.checked;
                                    setEditForm({...editForm, services: arr});
                                  }}
                                  className="rounded text-amber-500"
                                /> 
                                Liberar Agendamento de Dia e Hora pela plataforma
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input 
                                  type="checkbox" 
                                  checked={svc.allowPayment !== false}
                                  onChange={e => {
                                    const arr = [...editForm.services];
                                    arr[idx].allowPayment = e.target.checked;
                                    setEditForm({...editForm, services: arr});
                                  }}
                                  className="rounded text-amber-500"
                                /> 
                                Liberar opções de pagamento (PIX ou Combinar por WhatsApp)
                              </label>
                            </div>
                          </div>
                        </div>
                    </div>
                  ))`;
                  
    return str + additions;
});

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Services edited successfully");
