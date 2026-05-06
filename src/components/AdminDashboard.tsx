import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Shield, Search, AlertCircle, CheckCircle2, UserX } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const q = query(collection(db, 'profiles'));
      const snap = await getDocs(q);
      setProfiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (profileId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'profiles', profileId), {
        subscriptionStatus: status,
        updatedAt: serverTimestamp()
      });
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, subscriptionStatus: status } : p));
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profileId}`);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchText.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
         <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Shield className="w-8 h-8 text-amber-500" /> Painel Administrativo
            </h1>
            <p className="text-slate-500 mt-2">Visão geral dos profissionais da empresa e seus acessos</p>
         </div>
         <div className="flex-1 w-full max-w-sm relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar profissional..." 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-slate-500">Carregando dados...</div>
        ) : (
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200">
                 <th className="p-4 font-medium text-slate-600">Profissional</th>
                 <th className="p-4 font-medium text-slate-600">Status de Acesso</th>
                 <th className="p-4 font-medium text-slate-600 text-right">Ação</th>
               </tr>
             </thead>
             <tbody>
               {filteredProfiles.length === 0 ? (
                 <tr>
                   <td colSpan={3} className="p-8 text-center text-slate-500">
                     Nenhum profissional encontrado.
                   </td>
                 </tr>
               ) : (
                 filteredProfiles.map(p => {
                    const isDefaulter = p.subscriptionStatus !== 'active';
                    
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                {p.profilePhoto ? (
                                  <img src={p.profilePhoto} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <UserX className="w-6 h-6 text-slate-400 m-auto mt-2" />
                                )}
                              </div>
                              <div>
                                 <p className="font-semibold text-slate-800">{p.name || p.email}</p>
                                 <p className="text-sm text-slate-500 truncate max-w-[200px]">{p.title || 'Membro'}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-4">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5",
                             isDefaulter ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                           )}>
                             {isDefaulter ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                             {isDefaulter ? 'Pendente / Bloqueado' : 'Aprovado'}
                           </span>
                        </td>
                        <td className="p-4 text-right">
                           <select 
                             className="text-sm border border-slate-300 rounded-lg p-2 focus:ring-amber-400 focus:outline-none"
                             value={p.subscriptionStatus || 'pending'}
                             onChange={e => handleUpdateStatus(p.id, e.target.value)}
                           >
                             <option value="active">Permitir Acesso</option>
                             <option value="pending">Bloquear Acesso</option>
                           </select>
                        </td>
                      </tr>
                    );
                 })
               )}
             </tbody>
           </table>
        )}
      </div>
    </div>
  );
}
