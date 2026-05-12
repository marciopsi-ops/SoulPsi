import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, updateDoc } from 'firebase/firestore';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function PatientRegistration({ therapistId, onSuccess }: { therapistId: string, onSuccess: () => void }) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    cpf: '',
    source: '',
    lgpdAccepted: false
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const docRef = doc(db, 'profiles', therapistId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
           setProfileData(docSnap.data());
        } else {
           setError('Perfil do profissional não encontrado.');
        }
      } catch(e: any) {
        console.error(e);
        setError('Erro ao carregar dados do profissional.');
      } finally {
        setLoading(false);
      }
    }
    if (therapistId) {
       fetchProfile();
    } else {
       setError('ID do profissional ausente.');
       setLoading(false);
    }
  }, [therapistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lgpdAccepted) {
      alert('Você precisa aceitar os termos de LGPD para prosseguir.');
      return;
    }
    if (!form.source) {
      alert('Por favor, informe a fonte de indicação.');
      return;
    }

    setSubmitting(true);
    try {
      if (form.cpf) {
         const cleanCpf = form.cpf.replace(/\D/g, '');
         const clientsRef = collection(db, `profiles/${therapistId}/clients`);
         const q = query(clientsRef);
         const querySnapshot = await getDocs(q);
         
         let existingClient = null;
         querySnapshot.forEach((doc) => {
             const data = doc.data();
             if (data.cpf && data.cpf.replace(/\D/g, '') === cleanCpf) {
                 existingClient = { id: doc.id, ...data };
             }
         });

         if (existingClient) {
             const updatePayload = { ...form };
             delete (updatePayload as any).lgpdAccepted;
             await updateDoc(doc(db, `profiles/${therapistId}/clients/${existingClient.id}`), updatePayload);
         } else {
             await addDoc(collection(db, `profiles/${therapistId}/clients`), {
               ...form,
               isActive: true,
               createdAt: serverTimestamp()
             });
         }
      } else {
          await addDoc(collection(db, `profiles/${therapistId}/clients`), {
            ...form,
            isActive: true,
            createdAt: serverTimestamp()
          });
      }
      
      try {
        await addDoc(collection(db, `profiles/${therapistId}/system_notifications`), {
           title: 'Novo Cadastro de Paciente',
           message: `${form.name} preencheu a ficha de cadastro de pacientes.`,
           isRead: false,
           createdAt: new Date().toISOString()
        });
      } catch(e) {}
      
      setSubmitted(true);
      setTimeout(() => {
         onSuccess();
      }, 3000);
    } catch(e) {
      console.error(e);
      alert('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full"></div></div>;
  }

  if (error) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-red-800 text-center max-w-sm">
           <AlertCircle className="w-8 h-8 mx-auto mb-3" />
           <p className="font-bold">{error}</p>
        </div>
     </div>;
  }

  if (submitted) {
     return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full shadow-sm animate-in fade-in zoom-in duration-300">
           <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-slate-800 mb-2">Cadastro Enviado!</h2>
           <p className="text-slate-600 mb-6">Agradecemos as informações. Seus dados foram salvos com segurança.</p>
           <button onClick={onSuccess} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition">
              Voltar ao Início
           </button>
        </div>
     </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
       <div className="flex items-center gap-2 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-2 rounded-xl shadow-sm">
             <span className="font-black text-white text-sm tracking-wider leading-none flex items-center justify-center w-6 h-6">ELO</span>
          </div>
          <span className="font-bold text-xl sm:text-2xl tracking-tight text-slate-600">Soluções Humanas</span>
       </div>

       <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8 duration-500 fade-in">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-8 text-white">
             <h1 className="text-xl sm:text-2xl font-bold mb-2">Ficha de Cadastro do Paciente</h1>
             <p className="opacity-90">Profissional: <strong>{profileData?.name || 'Psicólogo(a)'}</strong></p>
             <p className="text-sm opacity-80 mt-1">Preencha seus dados abaixo para registro em prontuário.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome Completo *</label>
                   <input required type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-mail *</label>
                   <input required type="email" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Telefone/WhatsApp *</label>
                   <input required type="tel" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Nascimento *</label>
                   <input required type="date" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">CPF *</label>
                   <input required type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-semibold text-slate-700 mb-1.5">De onde você nos conheceu? (Fonte de Indicação) *</label>
                   <select required className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                      <option value="" disabled>Selecione uma opção...</option>
                      <option value="Indicação de profissional">Indicação de profissional</option>
                      <option value="Instituição/ Igreja">Instituição/ Igreja</option>
                      <option value="Amigos/ conhecidos">Amigos/ conhecidos</option>
                      <option value="Google/ Site">Google/ Site</option>
                      <option value="Pacientes">Pacientes</option>
                      <option value="Outros">Outros</option>
                   </select>
                </div>
             </div>

             <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg mb-2">Termos e Acordos</h3>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                   <div className="mt-1 flex-shrink-0">
                      <input type="checkbox" required className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400" checked={form.lgpdAccepted} onChange={e => setForm({...form, lgpdAccepted: e.target.checked})} />
                   </div>
                   <div className="text-sm text-slate-600 leading-relaxed">
                      <strong>Ciente sobre o uso de dados (LGPD):</strong> Autorizo a coleta, armazenamento e tratamento dos meus dados pessoais informados neste formulário pela clínica profissional, estritamente para as finalidades de prestação de serviços psicológicos, contatos de agendamento, emissão de recibos/notas fiscais e cumprimento de obrigações legais, conforme estabelecido pelas leis e pela Lei Geral de Proteção de Dados (LGPD).
                   </div>
                </label>
             </div>

             <button type="submit" disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 rounded-xl transition shadow-sm hover:shadow flex items-center justify-center gap-2">
                {submitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Finalizar Cadastro'}
             </button>
          </form>
       </div>
    </div>
  );
}
