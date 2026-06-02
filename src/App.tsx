import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, limit, getDocs, updateDoc } from 'firebase/firestore';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Checkout } from './components/Checkout';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientRegistration } from './components/PatientRegistration';
import { ServiceDetail } from './components/ServiceDetail';
import { CompanyRegistration } from './components/CompanyRegistration';
import { ClientTerms } from './components/ClientTerms';
import { AuthModal } from './components/AuthModal';
import { FloatingActions } from './components/FloatingActions';
import { LogIn, Loader2, CheckCircle2 } from 'lucide-react';

export type ViewState = 'landing' | 'dashboard' | 'service_detail' | 'checkout' | 'admin' | 'registration' | 'company_registration' | 'terms' | 'terms_company';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('landing');
  const [bookingData, setBookingData] = useState<any>(null); // For passing info to checkout
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile data of the currently viewed or logged-in therapist
  const [profileData, setProfileData] = useState<any>(null);
  // Default to a fake profileId for MVP public view if no one is logged in, 
  // or use the auth.id when logged in as therapist.
  const [therapistId, setTherapistId] = useState<string>('demo-therapist-id');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramTherapistId = params.get('t');
    const paramRegisterId = params.get('register');
    const paramRegisterCompanyId = params.get('register_company');
    const paramTermsId = params.get('terms');
    const paramTermsCompanyId = params.get('terms_company');
    const paramServiceId = params.get('service');

    if (paramTermsId) {
       setTherapistId(paramTermsId);
       fetchPublicProfile(paramTermsId).then(() => {
         setView('terms');
         setLoading(false);
       });
       return;
    }

    if (paramTermsCompanyId) {
       setTherapistId(paramTermsCompanyId);
       fetchPublicProfile(paramTermsCompanyId).then(() => {
         setView('terms_company');
         setLoading(false);
       });
       return;
    }

    if (paramServiceId && paramTherapistId) {
       setTherapistId(paramTherapistId);
       fetchPublicProfile(paramTherapistId).then(() => {
         setView('service_detail');
         setLoading(false);
       });
       return;
    }

    if (paramRegisterId) {
       setTherapistId(paramRegisterId);
       fetchPublicProfile(paramRegisterId).then(() => {
         setView('registration');
         setLoading(false);
       });
       return;
    }
    
    if (paramRegisterCompanyId) {
       setTherapistId(paramRegisterCompanyId);
       fetchPublicProfile(paramRegisterCompanyId).then(() => {
         setView('company_registration');
         setLoading(false);
       });
       return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      let adminStatus = false;
      if (currUser) {
        // Check if admin
        try {
          const adminDocRef = doc(db, 'admins', currUser.uid);
          let adminDoc = await getDoc(adminDocRef);
          
          // Auto-bootstrap Admin for Master User
          if (!adminDoc.exists() && currUser.email === 'marciopsi@elosolucoeshumanas.com') {
             await setDoc(adminDocRef, { email: currUser.email, createdAt: serverTimestamp() });
             adminDoc = await getDoc(adminDocRef);
          }

          adminStatus = adminDoc.exists();
          setIsAdminUser(adminStatus);
        } catch(e) {
          console.error('Error checking admin state:', e);
        }

        if (adminStatus) {
           setTherapistId(currUser.uid);
           await initTherapistProfile(currUser.uid, currUser.displayName || '', currUser.email || '');
           setView('admin');
        } else if (paramTherapistId && paramTherapistId !== currUser.uid) {
           setTherapistId(paramTherapistId);
           await fetchPublicProfile(paramTherapistId);
           setView('landing');
        } else {
           setTherapistId(currUser.uid);
           await initTherapistProfile(currUser.uid, currUser.displayName || '', currUser.email || '');
           setView('dashboard');
        }
      } else {
        setIsAdminUser(false);
        if (paramTherapistId) {
          setTherapistId(paramTherapistId);
          await fetchPublicProfile(paramTherapistId);
        } else {
          await fetchDemoProfile();
        }
        setView('landing');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchPublicProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    } catch (e: any) {
      console.error("Public profile fetch failed:", e);
    }
  };

  const fetchDemoProfile = async () => {
    try {
      // Pega os primeiros 10 perfis e encontra o mais 'configurado' (com mais serviços)
      const q = query(collection(db, 'profiles'), limit(10));
      const snap = await getDocs(q);
      if (!snap.empty) {
         let bestProfile = snap.docs[0];
         let maxScore = 0;
         snap.docs.forEach(doc => {
            const data = doc.data();
            const score = (data.services?.length || 0) + (data.about?.length || 0) / 100;
            if (score > maxScore) {
               maxScore = score;
               bestProfile = doc;
            }
         });
         setTherapistId(bestProfile.id);
         setProfileData(bestProfile.data());
      } else {
         setTherapistId('demo-therapist-id');
      }
    } catch (e) {
      console.error("Demo profile fetch failed:", e);
    }
  };

  const initTherapistProfile = async (uid: string, name: string, email: string) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      
      let finalStatus = 'pending';
      if (email) {
        try {
          const allowedSnap = await getDoc(doc(db, 'allowed_users', email.toLowerCase()));
          if (allowedSnap.exists()) {
             finalStatus = allowedSnap.data().status || 'active';
          }
        } catch(err) {
           console.error("Error checking allowed user:", err);
        }
      }

      if (!docSnap.exists()) {
        const newProfile = {
          userId: uid,
          name: name || 'Dr. Therapist',
          title: 'Psicólogo(a) Clínico(a)',
          about: 'Especialista em saúde mental e desenvolvimento pessoal.',
          specialties: ['Terapia Cognitivo-Comportamental', 'Ansiedade', 'Depressão'],
          whatsapp: '11999999999',
          coverPhoto: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1600&h=400',
          profilePhoto: 'https://images.unsplash.com/photo-1594824432258-2bafe75cdbeb?auto=format&fit=crop&q=80&w=400&h=400',
          calendarSync: false,
          driveSync: false,
          materials: [],
          subscriptionStatus: finalStatus,
          services: [
             { id: 's1', category: 'voce', title: 'Terapia Individual', description: 'Acolhimento e suporte especializado focado no autoconhecimento e no diagnóstico de doenças psicológicas. Oferecemos um espaço seguro para o enfrentamento de problemas variados e desafios do cotidiano.', price: 200 },
             { id: 's2', category: 'voce', title: 'Terapia Familiar', description: 'Suporte especializado para o fortalecimento dos vínculos familiares. Auxiliamos na mediação de conflitos e na construção de uma comunicação mais harmoniosa e funcional.', price: 250 },
             { id: 's3', category: 'voce', title: 'Terapia de Casal', description: 'Espaço de diálogo para casais que buscam superar crises, melhorar a parceria e ressignificar a relação, focando no entendimento mútuo.', price: 280 },
             { id: 's4', category: 'voce', title: 'Orientação Vocacional', description: 'Apoio estratégico para a escolha da primeira profissão ou redirecionamento de carreira com ferramentas de mapeamento de perfil.', price: 150 },
             { id: 's5', category: 'voce', title: 'Laudo para Cirurgias', description: 'Avaliação psicológica técnica e criteriosa para procedimentos cirúrgicos específicos (Bariátrica, Vasectomia e outras).', price: 300 },
             { id: 's6', category: 'empresa', title: 'Treinamento, Consultoria e Palestras', description: 'Desenvolvimento humano sob medida para empresas e grupos. Soluções focadas em liderança e performance.', price: 500 },
             { id: 's7', category: 'empresa', title: 'Mapeamento de Risco (NR1)', description: 'Diagnóstico e gestão dos fatores psicossociais no ambiente de trabalho. Conformidade com a NR1.', price: 800 },
             { id: 's8', category: 'empresa', title: 'Consultoria em Gestão de Pessoas', description: 'Apoio técnico para estruturação de processos de RH e desenvolvimento de equipes.', price: 700 },
             { id: 's9', category: 'psicologos', title: 'Supervisão Clínica', description: 'Acompanhamento técnico e suporte para psicólogos. Foco no manejo de casos complexos.', price: 250 },
             { id: 's10', category: 'psicologos', title: 'Consultoria Financeira/Fiscal', description: 'Orientação especializada para gestão de consultórios: Carnê-Leão e planejamento tributário.', price: 300 },
             { id: 's11', category: 'psicologos', title: 'Marketing para Psicólogos', description: 'Estratégias de posicionamento e visibilidade com rigor ético.', price: 350 },
             { id: 's12', category: 'psicologos', title: 'Soluções em Tecnologia', description: 'Desenvolvimento de sites e implementação de plataformas de gestão para clínicas.', price: 400 }
          ],
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, newProfile);
        setProfileData(newProfile);
      } else {
        const existingData = docSnap.data();
        if (existingData.subscriptionStatus !== 'active' && finalStatus === 'active') {
           existingData.subscriptionStatus = 'active';
           await updateDoc(docRef, { subscriptionStatus: 'active' });
        }
        setProfileData(existingData);
      }
    } catch (e: any) {
      if (e.message && e.message.includes('missing or insufficient permissions')) {
        handleFirestoreError(e, OperationType.GET, `profiles/${uid}`);
      }
      console.error(e);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
         alert("O domínio atual não está autorizado.\n\nPor favor, acesse o painel do Firebase > Authentication > Settings > Authorized domains e adicione o domínio atual à lista.");
      } else {
         alert("Falha no login. Verifique sua conexão ou configuração de cookies/popups de terceiros.\nErro: " + error.message);
      }
    }
  };

  const navigateToCheckout = (data: any) => {
    setBookingData(data);
    setView('checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 print:bg-white">
      {/* Global Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => {
            if (window.history.pushState) {
              window.history.pushState({}, '', window.location.pathname);
            }
            if (!user || isAdminUser) {
              fetchDemoProfile();
            } else {
              setTherapistId(user.uid);
              fetchPublicProfile(user.uid);
            }
            setView('landing');
          }}>
            <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-1.5 sm:p-2 rounded-xl shadow-sm">
              <span className="font-black text-white text-[9px] sm:text-sm tracking-wider leading-none flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6">ELO</span>
            </div>
            <span className="font-bold text-sm sm:text-2xl tracking-tight text-slate-600 whitespace-nowrap hidden min-[360px]:inline">Soluções Humanas</span>
            <span className="font-bold text-sm tracking-tight text-slate-600 whitespace-nowrap min-[360px]:hidden">Soluções</span>
          </div>
          <nav>
            {user ? (
              <div className="flex items-center gap-4">
                {isAdminUser && (
                  <button 
                    onClick={() => setView('admin')}
                    className={`text-sm font-medium transition-colors ${view === 'admin' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Painel Admin
                  </button>
                )}
                <button 
                  onClick={() => setView('dashboard')}
                  className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="text-sm font-medium text-slate-500 hover:text-red-600"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 sm:gap-2 text-sm font-medium text-amber-500 bg-amber-50 px-3 py-2 sm:px-4 sm:py-2 rounded-full hover:bg-amber-100 transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Acesso Profissional</span>
                <span className="sm:hidden">Acesso</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pb-20">
        {view === 'landing' && (
          <LandingPage 
            therapistId={therapistId} 
            profileData={profileData} 
            onBook={navigateToCheckout} 
            isLoggedIn={!!user}
          />
        )}
        {view === 'dashboard' && user && !isAdminUser && (
          profileData?.subscriptionStatus !== 'active' ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 py-12">
              <div className="bg-white border border-slate-200 shadow-xl p-8 rounded-2xl max-w-lg w-full text-center">
                <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <span className="font-bold text-2xl">Elo</span>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800">Aguardando Aprovação</h2>
                <p className="text-slate-600 mb-8">Seu perfil foi criado e está aguardando a aprovação do administrador da empresa para o uso da plataforma.</p>
                
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 mb-6 text-left">
                   O acesso é restrito aos profissionais da Elo Soluções Humanas. Por favor, contate o administrador caso demore.
                </div>
              </div>
            </div>
          ) : (
            <Dashboard 
              userId={user.uid} 
              profileData={profileData}
              onUpdateProfile={setProfileData}
            />
          )
        )}
        {view === 'admin' && user && isAdminUser && (
          <AdminDashboard />
        )}
        {view === 'checkout' && (
          <Checkout 
            therapistId={therapistId}
            profileData={profileData}
            bookingData={bookingData}
            onSuccess={() => setView('landing')}
            onCancel={() => setView('landing')}
          />
        )}
        {view === 'registration' && (
          <PatientRegistration 
            therapistId={therapistId}
            onSuccess={() => {
              if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
              setView('landing');
            }}
          />
        )}
        {view === 'company_registration' && (
          <CompanyRegistration 
            therapistId={therapistId}
            onSuccess={() => {
              if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
              setView('landing');
            }}
          />
        )}
        {view === 'terms' && (
          <ClientTerms
            therapistId={therapistId}
            isCompany={false}
            onSuccess={() => {
              if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
              setView('landing');
            }}
          />
        )}
        {view === 'terms_company' && (
          <ClientTerms
            therapistId={therapistId}
            isCompany={true}
            onSuccess={() => {
              if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
              setView('landing');
            }}
          />
        )}
        {view === 'service_detail' && (
          <ServiceDetail 
            therapistId={new URLSearchParams(window.location.search).get('t') || 'demo-therapist-id'}
            service={profileData?.services?.find((s: any) => s.id === new URLSearchParams(window.location.search).get('service'))}
            profileData={profileData}
            onBack={() => {
              if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
              setView('landing');
            }}
          />
        )}
      </main>

      {['landing', 'service_detail', 'checkout', 'registration', 'company_registration', 'terms', 'terms_company'].includes(view) && (
        <FloatingActions whatsapp={profileData?.whatsapp || '5511999999999'} />
      )}

      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
}
