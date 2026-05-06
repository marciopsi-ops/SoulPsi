const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const targetForm = `                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
                                 <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.name || ''} onChange={e => setCompanyEditForm({...companyEditForm, name: e.target.value})} />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                                 <input required type="email" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.email || ''} onChange={e => setCompanyEditForm({...companyEditForm, email: e.target.value})} />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                                 <input required type="tel" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.phone || ''} onChange={e => setCompanyEditForm({...companyEditForm, phone: e.target.value})} />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">Fonte</label>
                                 <select required className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.source || 'Outros'} onChange={e => setCompanyEditForm({...companyEditForm, source: e.target.value})}>
                                   <option value="Indicação de profissional">Indicação de profissional</option>
                                   <option value="Instituição/ Igreja">Instituição/ Igreja</option>
                                   <option value="Amigos/ conhecidos">Amigos/ conhecidos</option>
                                   <option value="Google/ Site">Google/ Site</option>
                                   <option value="Empresas">Empresas</option>
                                   {clients.length > 0 && (
                                     <optgroup label="Pacientes Cadastrados">
                                       {clients.map(c => (
                                         <option key={c.id} value={\`Paciente: \${c.name}\`}>Paciente: {c.name}</option>
                                       ))}
                                     </optgroup>
                                   )}
                                   <option value="Outros">Outros</option>
                                 </select>
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ</label>
                                 <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.cnpj || ''} onChange={e => setCompanyEditForm({...companyEditForm, cnpj: e.target.value})} />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">Pessoa de Contato</label>
                                 <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.contactPerson || ''} onChange={e => setCompanyEditForm({...companyEditForm, contactPerson: e.target.value})} />
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-slate-700 mb-1">Departamento</label>
                                 <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm" value={companyEditForm.department || ''} onChange={e => setCompanyEditForm({...companyEditForm, department: e.target.value})} />
                               </div>
                               <div className="flex items-center gap-2 mt-6">
                                 <input type="checkbox" id={\`active-\${company.id}\`} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={companyEditForm.isActive} onChange={e => setCompanyEditForm({...companyEditForm, isActive: e.target.checked})} />
                                 <label htmlFor={\`active-\${company.id}\`} className="text-sm font-medium text-slate-700">Empresa Ativo</label>
                               </div>
                            </div>`.replace(/\s+/g, ' ');

const replacementForm = `                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.name || ''} onChange={e => setCompanyEditForm({...companyEditForm, name: e.target.value})} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nome Fantasia</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.tradeName || ''} onChange={e => setCompanyEditForm({...companyEditForm, tradeName: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.cnpj || ''} onChange={e => setCompanyEditForm({...companyEditForm, cnpj: e.target.value})} />
                              </div>
                              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                                 <div className="col-span-12 md:col-span-10">
                                   <label className="block text-xs font-medium text-slate-700 mb-1">Logradouro / Rua</label>
                                   <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.addressStreet || ''} onChange={e => setCompanyEditForm({...companyEditForm, addressStreet: e.target.value})} />
                                 </div>
                                 <div className="col-span-12 md:col-span-2">
                                   <label className="block text-xs font-medium text-slate-700 mb-1">Número</label>
                                   <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.addressNumber || ''} onChange={e => setCompanyEditForm({...companyEditForm, addressNumber: e.target.value})} />
                                 </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">CEP</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.addressZipcode || ''} onChange={e => setCompanyEditForm({...companyEditForm, addressZipcode: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Cidade - UF</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.addressCity || ''} onChange={e => setCompanyEditForm({...companyEditForm, addressCity: e.target.value})} placeholder="Ex: Pouso Alegre - MG" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Pessoa de Contato</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.contactPerson || ''} onChange={e => setCompanyEditForm({...companyEditForm, contactPerson: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Departamento</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.department || ''} onChange={e => setCompanyEditForm({...companyEditForm, department: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                                <input required type="tel" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.phone || ''} onChange={e => setCompanyEditForm({...companyEditForm, phone: e.target.value})} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
                                <input required type="email" className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.email || ''} onChange={e => setCompanyEditForm({...companyEditForm, email: e.target.value})} />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Fonte</label>
                                <select required className="w-full p-2 border border-slate-300 rounded focus:ring-blue-500 focus:outline-none text-sm bg-white" value={companyEditForm.source || 'Outros'} onChange={e => setCompanyEditForm({...companyEditForm, source: e.target.value})}>
                                  <option value="Indicação de profissional">Indicação de profissional</option>
                                  <option value="Instituição/ Igreja">Instituição/ Igreja</option>
                                  <option value="Amigos/ conhecidos">Amigos/ conhecidos</option>
                                  <option value="Google/ Site">Google/ Site</option>
                                  <option value="Empresas">Empresas</option>
                                  {clients.length > 0 && (
                                    <optgroup label="Pacientes Cadastrados">
                                      {clients.map(c => (
                                        <option key={c.id} value={\`Paciente: \${c.name}\`}>Paciente: {c.name}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  <option value="Outros">Outros</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 flex items-center gap-2 mt-6">
                                <input type="checkbox" id={\`active-\${company.id}\`} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" checked={companyEditForm.isActive} onChange={e => setCompanyEditForm({...companyEditForm, isActive: e.target.checked})} />
                                <label htmlFor={\`active-\${company.id}\`} className="text-sm font-medium text-slate-700">Empresa Ativa</label>
                              </div>
                            </div>`;

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Convert content into a normalized spacing string for search
const normalizedContent = content.replace(/\s+/g, ' ');

// Find the index of the normalized target in the normalized content
const startIndex = normalizedContent.indexOf(targetForm);

if (startIndex === -1) {
    console.error("Target not found!");
    process.exit(1);
} else {
    console.log("Target found!");
    // We will do a smart replace. Let's just create a regex that matches the exact structure with variable whitespace
    let regexStr = escapeRegExp(targetForm)
        .replace(/\\\s+/g, '\\s+') // make spaces match any whitespace
        .replace(/ +/g, '\\s+'); // ensure regular spaces are \s+

    const regex = new RegExp(regexStr);
    
    if (regex.test(content)) {
        console.log("Regex match successful");
        content = content.replace(regex, replacementForm);
        fs.writeFileSync('src/components/Dashboard.tsx', content);
        console.log("Replacement applied");
    } else {
        console.error("Regex could not match exact whitespace pattern in original string");
    }
}
