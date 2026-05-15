const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

const materialsAppend = `                     {profileData?.materials && profileData.materials.length > 0 && (
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Anexar Materiais Exclusivos (Links)</label>
                           <div className="flex flex-col gap-2">
                             {profileData.materials.map((mat: any, idx: number) => {
                                const url = typeof mat === 'string' ? mat : (mat.url || '');
                                const desc = typeof mat === 'string' ? 'Material' : (mat.description || 'Material');
                                if (!url) return null;
                                return (
                                   <label key={idx} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                                     <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4" 
                                        onChange={(e) => {
                                          const textToAppend = \`\\n\\n\${desc}: \${url}\`;
                                          if (e.target.checked) {
                                            setNotificationMessage(prev => prev + textToAppend);
                                          } else {
                                            setNotificationMessage(prev => prev.replace(textToAppend, ''));
                                          }
                                        }}
                                     />
                                     <span className="font-medium text-slate-800">{desc}</span>
                                     <span className="text-slate-500 truncate max-w-sm block">{url}</span>
                                   </label>
                                );
                             })}
                           </div>
                        </div>
                     )}
`;

const originalTextarea = `                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mensagem</label>`;

if (content.includes(originalTextarea) && !content.includes("Anexar Materiais Exclusivos")) {
  content = content.replace(originalTextarea, materialsAppend + "\n" + originalTextarea);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Notification modal patched successfully');
