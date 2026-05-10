const fs = require('fs');

let file = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

if (!file.includes('const [importStatus, setImportStatus]')) {
  file = file.replace(/(const \[clients, setClients\] = useState<any\[\]>\(\[\]\);)/, `$1\n  const [importStatus, setImportStatus] = useState<{isOpen: boolean, message: string, progress: number, total: number, finished: boolean, added: number, updated: number, sessions: number}>({isOpen: false, message: '', progress: 0, total: 0, finished: false, added: 0, updated: 0, sessions: 0});`);
}

const importRegex = /const handleImportCSV = async \([^)]+\) => \{[\s\S]*?(?=const handleClientSave =)/;

const newImportCode = `const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     
     const text = await file.text();
     
     // basic csv parsing to handle quotes
     const parseCSVLine = (line: string) => {
         const result = [];
         let current = '';
         let inQuotes = false;
         for (let i = 0; i < line.length; i++) {
             const char = line[i];
             if (char === '"' && line[i+1] === '"') {
                 current += '"';
                 i++;
             } else if (char === '"') {
                 inQuotes = !inQuotes;
             } else if (char === ',' && !inQuotes) {
                 result.push(current);
                 current = '';
             } else {
                 current += char;
             }
         }
         result.push(current);
         return result;
     };

     const lines = text.split(/\\r?\\n/).filter(l => l.trim());
     if (lines.length < 2) return alert('O arquivo parece estar vazio ou inválido.');
     
     setImportStatus({
       isOpen: true,
       message: 'Iniciando importação...',
       progress: 0,
       total: lines.length - 1,
       finished: false,
       added: 0,
       updated: 0,
       sessions: 0
     });

     let addedCount = 0;
     let updatedCount = 0;
     let sessionCount = 0;

     // Cache of imported/existing clients by name + dob/cpf to group sessions and avoid duplicate clients
     const processedClients = new Map<string, string>(); // key -> clientId

     for (let i = 1; i < lines.length; i++) {
        setImportStatus(prev => ({ ...prev, progress: i, message: \`Processando linha \${i} de \${lines.length - 1}...\` }));
        
        // Yield to let React render the progress
        if (i % 5 === 0) {
           await new Promise(r => setTimeout(r, 0));
        }

        const cols = parseCSVLine(lines[i]);
        if (cols.length < 2) continue;
        
        const clientPayload: any = {
           name: cols[0]?.trim() || '',
           email: cols[1]?.trim() || '',
           phone: cols[2]?.trim() || '',
           cpf: cols[3]?.trim() || '',
           dob: cols[4]?.trim() || '',
           frequency: cols[5]?.trim() || 'Avulso',
           source: cols[6]?.trim() || 'Outros',
           isActive: cols[7]?.trim() !== 'Inativo',
           notes: cols[8]?.trim() || '',
           lgpdAccepted: true,
           rulesAccepted: false,
        };
        
        if (!clientPayload.name) continue;
        
        const uniqueKey = \`\${clientPayload.name.toLowerCase()} _ \${clientPayload.cpf || clientPayload.dob || ''}\`;
        let clientId = processedClients.get(uniqueKey);

        if (!clientId) {
            // Check if exists in existing clients
            const existing = clients.find(c => 
                c.name.trim().toLowerCase() === clientPayload.name.toLowerCase() && 
                ((clientPayload.cpf && c.cpf === clientPayload.cpf) || (clientPayload.email && c.email === clientPayload.email) || (!clientPayload.cpf && !clientPayload.email && c.dob === clientPayload.dob))
            );

            if (existing) {
               clientId = existing.id;
               try {
                   await updateDoc(doc(db, \`profiles/\${userId}/clients/\${existing.id}\`), clientPayload);
                   setClients(prev => prev.map(p => p.id === existing.id ? { ...p, ...clientPayload } : p));
                   updatedCount++;
               } catch(ex) {}
            } else {
               try {
                  clientPayload.createdAt = new Date().toISOString();
                  const clientRef = await addDoc(collection(db, \`profiles/\${userId}/clients\`), clientPayload);
                  clientId = clientRef.id;
                  setClients(prev => [...prev, { id: clientId, ...clientPayload }]);
                  addedCount++;
               } catch (err: any) {
                  handleFirestoreError(err, OperationType.CREATE, \`profiles/\${userId}/clients\`);
               }
            }
            if (clientId) processedClients.set(uniqueKey, clientId);
        }

        // Deal with sessions if they exist in the row
        if (clientId && cols.length >= 10 && cols[9] && cols[9].trim()) {
            const dateStr = cols[9].trim(); // "dd/MM/yyyy HH:mm"
            const status = cols[10]?.trim() || 'Concluído';
            const paymentStatus = cols[11]?.trim() || 'Pago';
            const totalAmountStr = cols[12]?.trim() || '0,00';
            const sessionNotes = cols[13]?.trim() || '';

            let parsedDate = null;
            try {
                // simple parse for dd/MM/yyyy HH:mm
                const parts = dateStr.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})\\s+(\\d{2}):(\\d{2})/);
                if (parts) {
                   parsedDate = new Date(Number(parts[3]), Number(parts[2])-1, Number(parts[1]), Number(parts[4]), Number(parts[5])).toISOString();
                } else {
                   // Try fallback naive parse if the string doesn't match brazilian exact format
                   const ts = Date.parse(dateStr);
                   if (!isNaN(ts)) parsedDate = new Date(ts).toISOString();
                }
            } catch(e) {}

            if (parsedDate) {
                // Check if session already exists for this client at this exact time to prevent duplicates
                // Since \`appointments\` state might not reflect newly added ones mid-loop easily without extra cache, let's just check state cache
                const existingAppt = appointments.find(a => a.clientId === clientId && a.datetime === parsedDate);
                const sessionPayload = {
                    clientId,
                    clientName: clientPayload.name,
                    datetime: parsedDate,
                    status,
                    paymentStatus,
                    totalAmount: Number(totalAmountStr.replace(',', '.').replace(/[^\\d.-]/g, '')),
                    notes: sessionNotes,
                };
                if (!existingAppt) {
                    try {
                        const sRef = await addDoc(collection(db, \`profiles/\${userId}/appointments\`), { ...sessionPayload, createdAt: serverTimestamp() });
                        setAppointments(prev => [...prev, { id: sRef.id, ...sessionPayload, createdAt: new Date().toISOString() }]);
                        sessionCount++;
                    } catch(e) {
                        handleFirestoreError(e, OperationType.CREATE, \`profiles/\${userId}/appointments\`);
                    }
                }
            }
        }
     }
     
     setImportStatus(prev => ({
       ...prev,
       finished: true,
       message: 'Importação concluída com sucesso!',
       added: addedCount,
       updated: updatedCount,
       sessions: sessionCount
     }));

     if (e.target) e.target.value = '';
  };

  `;

file = file.replace(importRegex, newImportCode);

const modalCode = `
      {/* Import Modal */}
      {importStatus.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            {!importStatus.finished && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Importando Dados</h3>
                <p className="text-sm text-slate-500 mb-4">{importStatus.message}</p>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: \`\${Math.max(5, (importStatus.progress / importStatus.total) * 100)}%\` }}></div>
                </div>
                <p className="text-xs text-slate-400 font-medium">{importStatus.progress} de {importStatus.total} linhas concluídas</p>
              </div>
            )}
            
            {importStatus.finished && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{importStatus.message}</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-left my-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-white pb-2">
                    <span className="text-sm text-slate-600 font-medium">Pacientes Inseridos</span>
                    <span className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{importStatus.added}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white pb-2">
                    <span className="text-sm text-slate-600 font-medium">Pacientes Atualizados</span>
                    <span className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{importStatus.updated}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 font-medium">Sessões Registradas</span>
                    <span className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm">{importStatus.sessions}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setImportStatus({ isOpen: false, message: '', progress: 0, total: 0, finished: false, added: 0, updated: 0, sessions: 0 })}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition"
                >
                  Concluir
                </button>
              </div>
            )}
          </div>
        </div>
      )}
`;

if (!file.includes('{/* Import Modal */}')) {
  file = file.replace(/(\{\/\* Export Drive Modal \*\/\})/, modalCode + '\n      $1');
}

fs.writeFileSync('src/components/Dashboard.tsx', file, 'utf8');
