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
import { LogIn, Loader2, CheckCircle2, CreditCard, Moon, Sun, Shield, AlertCircle, X, Mail, MessageSquare, Menu } from 'lucide-react';
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
  const [saasEnabled, setSaasEnabled] = useState<boolean>(true);
  const [firstAccessBlocked, setFirstAccessBlocked] = useState<boolean>(false);
  const [supportInfo, setSupportInfo] = useState<{ phone: string; email: string; message: string }>({
    phone: '',
    email: '',
    message: ''
  });

  // Profile data of the currently viewed or logged-in therapist
  const [profileData, setProfileData] = useState<any>(null);
  // Default to a fake profileId for MVP public view if no one is logged in, 
  // or use the auth.id when logged in as therapist.
  const [therapistId, setTherapistId] = useState<string>('demo-therapist-id');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // Close menu when view changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [view]);

  useEffect(() => {
    // Fetch global platform settings on mount
    const fetchPlatformSettings = async () => {
      try {
        const docRef = doc(db, 'admin_settings', 'support');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.saas_enabled !== undefined) {
            setSaasEnabled(data.saas_enabled);
          }
          setSupportInfo({
            phone: data.phone || '',
            email: data.email || '',
            message: data.message || ''
          });
        }
      } catch (e) {
        console.error("Erro ao carregar configurações da plataforma:", e);
      }
    };
    fetchPlatformSettings();

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
        // Bloquear primeiro acesso se o fluxo SaaS/vendas estiver desativado
        if (!saasEnabled && email !== 'marciopsi@elosolucoeshumanas.com') {
          setFirstAccessBlocked(true);
          await signOut(auth);
          setUser(null);
          setProfileData(null);
          setLoading(false);
          return;
        }

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
            <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-1.5 sm:p-2 rounded-xl shadow-sm shrink-0">
              <span className="font-black text-white text-[10px] sm:text-sm tracking-wider leading-none flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6">ELO</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center leading-tight sm:leading-none">
              <div>
                <span className="font-bold text-base sm:text-2xl tracking-tight text-slate-700 whitespace-nowrap hidden min-[360px]:inline">Soluções Humanas</span>
                <span className="font-bold text-base tracking-tight text-slate-700 whitespace-nowrap min-[360px]:hidden">Soluções</span>
              </div>
              
              {profileData?.name && view === 'landing' && (
                 <>
                   <span className="text-slate-300 text-xl font-light mx-2 hidden sm:inline">|</span>
                   <span className="font-semibold text-xs sm:text-lg tracking-tight text-slate-500 whitespace-nowrap truncate max-w-[180px] sm:max-w-[200px] md:max-w-[300px] lg:max-w-[400px]">
                     {profileData.name}
                   </span>
                 </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <nav className="flex items-center">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  {isAdminUser && (
                    <button 
                      onClick={() => setView('admin')}
                      className={`text-sm font-medium transition-colors hidden md:block ${view === 'admin' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                      Painel Admin
                    </button>
                  )}
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`text-sm font-medium transition-colors hidden md:block ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}
                  >
                    Dashboard
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="p-1 sm:p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 rounded-lg transition"
                    >
                      <Menu className="w-6 h-6 sm:w-6 sm:h-6" />
                    </button>
                    {isMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          <button
                            onClick={() => { setIsMenuOpen(false); setView('dashboard'); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-600 md:hidden dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            Dashboard
                          </button>
                          {isAdminUser && (
                            <button
                              onClick={() => { setIsMenuOpen(false); setView('admin'); }}
                              className="w-full text-left px-4 py-2 text-sm text-slate-600 md:hidden dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            >
                              Painel Admin
                            </button>
                          )}
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 md:hidden"></div>
                          
                          <button
                            onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'voce' })), 50); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            Para Você
                          </button>
                          <button
                            onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'empresa' })), 50); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            Para sua Empresa
                          </button>
                          <button
                            onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'psicologos' })), 50); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            Para Psicólogos
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                          <button 
                            onClick={() => { setIsMenuOpen(false); signOut(auth); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Sair
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 sm:p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 rounded-lg transition"
                  >
                    <Menu className="w-6 h-6 sm:w-6 sm:h-6" />
                  </button>
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <button
                          onClick={() => { setIsMenuOpen(false); setAuthModalOpen(true); }}
                          className="w-full text-left px-4 py-2 text-sm text-amber-600 font-medium hover:bg-amber-50 dark:hover:bg-slate-700/50"
                        >
                          Acesso Profissional
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                        <button
                          onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'voce' })), 50); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          Para Você
                        </button>
                        <button
                          onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'empresa' })), 50); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          Para sua Empresa
                        </button>
                        <button
                          onClick={() => { setIsMenuOpen(false); setView('landing'); setTimeout(() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'psicologos' })), 50); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          Para Psicólogos
                        </button>
                      </div>
                    </>
                  )}
                </div>
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
          (!saasEnabled && !isAdminUser) ? (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 shadow-2xl p-8 sm:p-10 rounded-[2rem] max-w-lg w-full text-center relative overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 to-amber-650"></div>
                <div className="w-20 h-20 bg-amber-55 dark:bg-amber-900/20 text-amber-500 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-inner border border-amber-100/50 dark:border-amber-900/30">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-4 text-slate-800 dark:text-slate-100 tracking-tight">
                  Página em Manutenção
                </h3>
                <p className="text-slate-650 dark:text-slate-300 mb-8 text-base leading-relaxed px-2">
                  A página comercial e o fluxo de vendas da plataforma estão temporariamente pausados pelo gestor para melhorias e manutenção.
                </p>
                
                <div className="bg-amber-50/60 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-200/50 dark:border-amber-950/30 mb-8 text-left flex gap-3.5 items-start">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-350 leading-normal font-medium">
                    Se você é profissional cadastrado, ainda pode acessar seu painel clicando em <strong>Acesso Profissional</strong> no topo da página.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => {
                      if (window.history.pushState) window.history.pushState({}, '', window.location.pathname);
                      setView('landing');
                    }}
                    className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow"
                  >
                    Voltar para Início
                  </button>
                  <button 
                    onClick={() => setAuthModalOpen(true)}
                    className="flex-1 bg-white dark:bg-slate-750 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm"
                  >
                    Acesso Profissional
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <SaasProductLaunch user={user} onLogin={() => setAuthModalOpen(true)} />
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
        <AuthModal 
          onClose={() => setAuthModalOpen(false)} 
          saasEnabled={saasEnabled}
          supportInfo={supportInfo}
        />
      )}

      {firstAccessBlocked && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                Cadastro Desativado
              </h2>
              <button
                onClick={() => setFirstAccessBlocked(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-100/50 dark:border-amber-900/30">
                <Shield className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Novos Acessos não Disponíveis
                </h3>
                <p className="text-slate-650 dark:text-slate-400 text-sm leading-relaxed px-1">
                  O fluxo de cadastros para novos profissionais está pausado temporariamente pelo administrador. Para obter o seu primeiro acesso, entre em contato com a nossa empresa:
                </p>
              </div>

              {supportInfo.message && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 italic leading-relaxed">
                  "{supportInfo.message}"
                </div>
              )}

              <div className="space-y-2 pt-2">
                {supportInfo.phone && (
                  <button
                    onClick={() => window.open(`https://wa.me/${supportInfo.phone.replace(/\D/g, '')}`, '_blank')}
                    className="w-full flex items-center justify-center gap-3 bg-emerald-550 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Falar via WhatsApp
                  </button>
                )}

                {supportInfo.email && (
                  <a
                    href={`mailto:${supportInfo.email}`}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    Enviar E-mail para Suporte
                  </a>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setFirstAccessBlocked(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
