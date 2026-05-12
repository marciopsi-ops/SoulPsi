import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, User, Loader2, Info } from 'lucide-react';
import Markdown from 'react-markdown';

export function ClientTerms({ therapistId, isCompany, onSuccess }: { therapistId: string, isCompany: boolean, onSuccess: () => void }) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    identifier: '', // CPF ou CNPJ
    email: '',
    accepted: false
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', therapistId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          setError('Profissional não encontrado.');
        }
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar dados do profissional.');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [therapistId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accepted) {
      alert('Você precisa aceitar os termos para prosseguir.');
      return;
    }

    setSubmitting(true);
    try {
      // Create a signature document in the signatures subcollection
      await addDoc(collection(db, `profiles/${therapistId}/signatures`), {
        name: form.name,
        identifier: form.identifier, // CPF or CNPJ
        email: form.email,
        type: isCompany ? 'company' : 'client',
        termsAccepted: true,
        termsText: profileData?.contractTerms || 'Termos padrão aceitos',
        signedAt: serverTimestamp()
      });
      
      try {
        await addDoc(collection(db, `profiles/${therapistId}/system_notifications`), {
           title: 'Nova Assinatura de Termos',
           message: `${form.name} assinou os termos e contrato.`,
           isRead: false,
           createdAt: new Date().toISOString()
        });
      } catch(e) {}
      
      setSubmitted(true);
    } catch (e: any) {
      console.error(e);
      alert('Erro ao registrar assinatura: ' + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>;
  if (error) return <div className="text-center py-20 text-red-500 font-medium">{error}</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex flex-col items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Termos Assinados!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Sua assinatura e aceitação dos termos de contrato e LGPD foram registrados com sucesso.
          </p>
          <button onClick={onSuccess} className="bg-amber-500 text-white font-medium px-6 py-3 rounded-xl hover:bg-amber-600 transition w-full">
            Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  const defaultTerms = "Declaro para os devidos fins que li e estou ciente das regras de prestação de serviço, remuneração e termos da LGPD (Lei Geral de Proteção de Dados).";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-amber-500 p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 translate-x-1/3 -translate-y-1/3">
             <User className="w-48 h-48 sm:w-64 sm:h-64" />
           </div>
           <div className="relative z-10 flex flex-col items-center">
              {profileData?.profilePhoto ? (
                <img src={profileData.profilePhoto} alt={profileData.name} className="w-20 h-20 rounded-full object-cover border-4 border-white/20 mb-4 shadow-lg" />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/20">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white tracking-tight">{profileData?.name || 'Profissional'}</h2>
              <p className="text-amber-100 font-medium mt-1">Assinatura de Termos e Contrato</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
           <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-8 flex items-start gap-3 border border-blue-100">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                 <p className="font-semibold mb-1">Assinatura Digital de Termos</p>
                 <p>Por favor, leia atentamente o documento abaixo e confirme seus dados para registrar sua concordância e assinatura digital.</p>
              </div>
           </div>

           <div className="mb-8 border border-slate-200 rounded-xl overflow-hidden flex flex-col max-h-[400px]">
             <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 font-semibold text-slate-700">
                Termos de Contrato e LGPD
             </div>
             <div className="p-5 overflow-y-auto bg-slate-50 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed doc-content" style={{ maxHeight: '350px' }}>
                {profileData?.contractTerms || defaultTerms}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo {isCompany && '(Empresa)'}</label>
                <input type="text" required className="w-full p-3 border border-slate-300 rounded-xl focus:ring-amber-400 focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder={isCompany ? "Razão Social da Empresa" : "Seu nome completo"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isCompany ? 'CNPJ' : 'CPF'}</label>
                <input type="text" required className="w-full p-3 border border-slate-300 rounded-xl focus:ring-amber-400 focus:outline-none" value={form.identifier} onChange={e => setForm({...form, identifier: e.target.value})} placeholder={isCompany ? "00.000.000/0000-00" : "000.000.000-00"} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" required className="w-full p-3 border border-slate-300 rounded-xl focus:ring-amber-400 focus:outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Seu melhor e-mail" />
              </div>
           </div>

           <label className="flex items-start gap-3 cursor-pointer group bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition mb-6">
              <div className="mt-1 flex-shrink-0">
                 <input type="checkbox" required className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-400" checked={form.accepted} onChange={e => setForm({...form, accepted: e.target.checked})} />
              </div>
              <div className="text-sm text-slate-700 leading-relaxed">
                 Declaro que li e estou de acordo com os termos estabelecidos acima, prestando minha assinatura digital e concordância integral com as condições.
              </div>
           </label>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
             <button type="submit" disabled={submitting} className="bg-amber-500 text-white font-semibold px-8 py-3 rounded-xl hover:bg-amber-600 transition flex items-center gap-2 disabled:opacity-50">
               {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
               Assinar e Concordar
             </button>
           </div>
        </form>
      </div>
    </div>
  );
}
