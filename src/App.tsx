import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, limit, getDocs, updateDoc } from 'firebase/firestore';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Checkout } from './components/Checkout';
import { AdminDashboard } from './components/AdminDashboard';
import { PatientRegistration } from './components/PatientRegistration';
import { CompanyRegistration } from './components/CompanyRegistration';
import { LogIn, Loader2, CheckCircle2 } from 'lucide-react';

export type ViewState = 'landing' | 'dashboard' | 'checkout' | 'admin' | 'registration' | 'company_registration';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('landing');
  const [bookingData, setBookingData] = useState<any>(null); // For passing info to checkout
  const [isAdminUser, setIsAdminUser] = useState(false);

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
           setView('admin');
        } else if (paramTherapistId && paramTherapistId !== currUser.uid) {
           setTherapistId(paramTherapistId);
           await fetchPublicProfile(paramTherapistId);
           setView('landing');
        } else {
           setTherapistId(currUser.uid);
           await initTherapistProfile(currUser.uid, currUser.displayName || '');
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
      const q = query(collection(db, 'profiles'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
         setTherapistId(snap.docs[0].id);
         setProfileData(snap.docs[0].data());
      } else {
         setTherapistId('demo-therapist-id');
      }
    } catch (e) {
      console.error("Demo profile fetch failed:", e);
    }
  };

  const initTherapistProfile = async (uid: string, name: string) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
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
          subscriptionStatus: 'pending',
          services: [
             { id: 's1', category: 'voce', title: 'Terapia Individual', description: 'Agende uma sessão e dê o primeiro passo para o seu bem-estar emocional. As sessões duram 50 minutos e ocorrem de forma online.', price: 200 },
             { id: 's2', category: 'psicologos', title: 'Supervisão Clínica', description: 'Orientação técnica e discussão de casos para recém-formados e profissionais que buscam aprimoramento em Terapia Cognitivo-Comportamental.', price: 250 }
          ],
          updatedAt: serverTimestamp()
        };
        await setDoc(docRef, newProfile);
        setProfileData(newProfile);
      } else {
        setProfileData(docSnap.data());
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
        // Ignorar interrupções de popup
        return;
      }
      console.error("Login failed", error);
      alert("Falha no login: " + error.message);
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Global Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (window.history.pushState) {
              window.history.pushState({}, '', window.location.pathname);
            }
            if (!user && !isAdminUser) {
              fetchDemoProfile();
            } else if (user && !isAdminUser) {
              setTherapistId(user.uid);
              fetchPublicProfile(user.uid);
            }
            setView('landing');
          }}>
            <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-2 rounded-xl shadow-sm">
              <span className="font-black text-white text-sm tracking-wider leading-none flex items-center justify-center w-6 h-6">ELO</span>
            </div>
            <span className="font-bold text-lg sm:text-2xl tracking-tight text-slate-600">Soluções Humanas</span>
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
                {!isAdminUser && (
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`text-sm font-medium transition-colors ${view === 'dashboard' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Dashboard
                  </button>
                )}
                <button 
                  onClick={() => signOut(auth)}
                  className="text-sm font-medium text-slate-500 hover:text-red-600"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 text-sm font-medium text-amber-500 bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Acesso Profissional
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pb-20">
        {view === 'landing' && (
          profileData?.subscriptionStatus !== 'active' && !isAdminUser ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-8 rounded-2xl max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">Perfil Indisponível</h2>
                <p>Este perfil pertence a um profissional da Elo Soluções Humanas e não está com o agendamento público ativo no momento.</p>
              </div>
            </div>
          ) : (
            <LandingPage 
              therapistId={therapistId} 
              profileData={profileData} 
              onBook={navigateToCheckout} 
              isLoggedIn={!!user}
            />
          )
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
      </main>
    </div>
  );
}
