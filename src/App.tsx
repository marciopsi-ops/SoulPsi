import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, limit, getDocs, updateDoc } from 'firebase/firestore';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Checkout } from './components/Checkout';
import { AdminDashboard } from './components/AdminDashboard';
import { SubscriptionManager } from './components/SubscriptionManager';
import { PatientRegistration } from './components/PatientRegistration';
import { ServiceDetail } from './components/ServiceDetail';
import { CompanyRegistration } from './components/CompanyRegistration';
import { ClientTerms } from './components/ClientTerms';
import { AuthModal } from './components/AuthModal';
import { FloatingActions } from './components/FloatingActions';
import { LogIn, Loader2, CheckCircle2, CreditCard, Moon, Sun } from 'lucide-react';
import { SaasProductLaunch } from './components/SaasProductLaunch';
import { useTheme } from './contexts/ThemeContext';

export type ViewState = 'landing' | 'dashboard' | 'service_detail' | 'checkout' | 'admin' | 'registration' | 'company_registration' | 'terms' | 'terms_company' | 'saas';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('landing');
  const [bookingData, setBookingData] = useState<any>(null); // For passing info to checkout
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [unblockingCheckout, setUnblockingCheckout] = useState(false);

  // Profile data of the currently viewed or logged-in therapist
  const [profileData, setProfileData] = useState<any>(null);
  // Default to a fake profileId for MVP public view if no one is logged in, 
  // or use the auth.id when logged in as therapist.
  const [therapistId, setTherapistId] = useState<string>('demo-therapist-id');

  const { theme, toggleTheme } = useTheme();

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

    const paramSaas = params.get('saas') === 'true' || params.get('produto') === 'true';

    if (paramSaas) {
       setView('saas');
       setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      let adminStatus = false;
      
      if (paramSaas) {
         setLoading(false);
         return; 
      }
      
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

        if (paramSaas) {
           setView('saas');
        } else if (adminStatus) {
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
        if (paramSaas) {
          setView('saas');
        } else if (paramTherapistId) {
          setTherapistId(paramTherapistId);
          await fetchPublicProfile(paramTherapistId);
          setView('landing');
        } else {
          await fetchDemoProfile();
          setView('landing');
        }
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
      
      let finalStatus = 'trial';
      const promises = [getDoc(docRef)];
      if (email) {
        promises.push(getDoc(doc(db, 'allowed_users', email.toLowerCase())));
      }
      
      const results = await Promise.all(promises.map(p => p.catch(e => {
        console.error(e);
        return null;
      })));
      
      const docSnap = results[0];
      const allowedSnap = email ? results[1] : null;

      if (allowedSnap && (allowedSnap as any).exists && (allowedSnap as any).exists()) {
         finalStatus = (allowedSnap as any).data().status || 'active';
      }

      const trialDays = 7;
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);

      if (!docSnap || !docSnap.exists()) {
        const newProfile = {
          userId: uid,
          name: name || 'Dr. Therapist',
          email: email || '',
          createdAt: serverTimestamp(),
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
          trialEndsAt: trialEndDate.toISOString(),
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 print:bg-white transition-colors">
      {/* Global Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-50 print:hidden transition-colors">
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
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50 rounded-full transition-colors"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <nav>
              {user ? (
                <div className="flex items-center gap-4">
                  {isAdminUser && (
                    <button 
                      onClick={() => setView('admin')}
                      className={`text-sm font-medium transition-colors ${view === 'admin' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                      Painel Admin
                    </button>
                  )}
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => signOut(auth)}
                    className="text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    Sair
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 sm:gap-2 text-sm font-medium text-amber-500 bg-amber-50 px-3 py-2 sm:px-4 sm:py-2 rounded-full hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Acesso Profissional</span>
                  <span className="sm:hidden">Acesso</span>
                </button>
              )}
            </nav>
          </div>
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
        {view === 'dashboard' && user && !isAdminUser && (() => {
          const isTrial = profileData?.subscriptionStatus === 'trial';
          const isTrialValid = isTrial && profileData?.trialEndsAt && new Date(profileData.trialEndsAt) > new Date();
          const isExpiredTrial = isTrial && !isTrialValid;

          if (profileData?.subscriptionStatus === 'active' || isTrialValid) {
            return (
              <Dashboard 
                userId={user.uid} 
                profileData={profileData}
                onUpdateProfile={setProfileData}
              />
            );
          }

          if (isExpiredTrial) {
            if (unblockingCheckout) {
              return (
                <div className="py-8 max-w-4xl mx-auto px-4">
                  <SubscriptionManager
                    userId={user.uid}
                    profileData={profileData}
                    onUpdateProfile={(newData) => {
                      setProfileData(newData);
                      setUnblockingCheckout(false);
                    }}
                    onClose={() => setUnblockingCheckout(false)}
                  />
                </div>
              );
            }

            return (
              <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 shadow-2xl shadow-red-100/40 p-10 rounded-[2rem] max-w-lg w-full text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-400 to-red-600"></div>
                  <h2 className="text-3xl font-extrabold mb-3 text-slate-800 tracking-tight">Período de Teste Expirado</h2>
                  <p className="text-slate-600 mb-8 text-lg px-2">
                    Seu período de teste gratuito de 7 dias chegou ao fim. Assine agora mesmo para reativar seu acesso completo instantaneamente.
                  </p>
                  <button 
                    onClick={() => setUnblockingCheckout(true)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-md hover:shadow-lg mb-3 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5 text-amber-450" /> Assinar com Stripe / Pix agora
                  </button>
                  <button 
                    onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                    className="w-full bg-transparent text-slate-500 hover:text-slate-800 font-semibold py-2 px-8 text-xs transition-colors mb-3"
                  >
                    Falar com o Comercial
                  </button>
                  <button 
                    onClick={() => auth.signOut()}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3 px-8 rounded-xl transition-all shadow-sm w-full"
                  >
                    Sair
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="min-h-[70vh] flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 shadow-2xl shadow-indigo-100/40 p-10 rounded-[2rem] max-w-lg w-full text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner border border-amber-100/50">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-3xl font-extrabold mb-3 text-slate-800 tracking-tight">Aguardando Avaliação</h2>
                <p className="text-slate-600 mb-8 text-lg px-2">
                  Seu perfil foi criado com sucesso! Ele encontra-se em etapa de revisão.
                </p>
                
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/60 mb-8 text-left flex gap-4 items-start shadow-sm">
                   <CheckCircle2 className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-sm text-amber-800 leading-relaxed font-medium">
                     O acesso à plataforma ELO é restrito aos profissionais aprovados. Assim que a análise for concluída, 
                     as funcionalidades serão liberadas automaticamente. Caso tenha urgência, contate nosso suporte.
                   </p>
                </div>

                <button 
                  onClick={() => auth.signOut()}
                  className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold py-3 px-8 rounded-xl transition-all shadow-sm hover:shadow"
                >
                  Sair ou trocar de conta
                </button>
              </div>
            </div>
          );
        })()}
        {view === 'saas' && (
          <SaasProductLaunch user={user} onLogin={() => setAuthModalOpen(true)} />
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
