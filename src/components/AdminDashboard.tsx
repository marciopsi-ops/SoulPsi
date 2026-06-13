import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import {
  Shield,
  Search,
  AlertCircle,
  CheckCircle2,
  UserX,
  MailPlus,
  Trash2,
  Link as LinkIcon,
  Copy,
  Settings,
  ExternalLink,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";

const getReadjustmentAlert = (createdAtDate: Date | null) => {
  if (!createdAtDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const birthMonth = createdAtDate.getMonth();
  const birthDay = createdAtDate.getDate();

  // Anniversary in current year
  const anniversary = new Date(today.getFullYear(), birthMonth, birthDay);
  anniversary.setHours(0, 0, 0, 0);

  let diffTime = anniversary.getTime() - today.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // If the anniversary has already passed this year (by more than 10 days), the next one is next year
  if (diffDays < -10) {
    const nextAnniversary = new Date(
      today.getFullYear() + 1,
      birthMonth,
      birthDay,
    );
    nextAnniversary.setHours(0, 0, 0, 0);
    diffTime = nextAnniversary.getTime() - today.getTime();
    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Alert if within 30 days before the anniversary OR up to 10 days after it
  if (diffDays >= -10 && diffDays <= 30) {
    return {
      daysRemaining: diffDays,
      dateFormatted: format(new Date(2000, birthMonth, birthDay), "dd/MM"),
    };
  }

  return null;
};

export function AdminDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportSettings, setSupportSettings] = useState({
    phone: "",
    email: "",
    message: "",
    saas_enabled: true,
  });
  const [savingSupport, setSavingSupport] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [admissionDate, setAdmissionDate] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [savingAdminData, setSavingAdminData] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "profile" | "invite" | null;
    id: string;
    title: string;
    message: string;
  }>({ type: null, id: "", title: "", message: "" });
  const [deleting, setDeleting] = useState(false);

  // Notification dispatch states
  const [notifyingProfile, setNotifyingProfile] = useState<any | null>(null);
  const [notifTemplate, setNotifTemplate] = useState<string>("trial_expiring");
  const [notifTitle, setNotifTitle] = useState<string>("");
  const [notifMessage, setNotifMessage] = useState<string>("");
  const [sendingNotif, setSendingNotif] = useState<boolean>(false);

  const getTemplatesForProfile = (p: any) => {
    const name = p?.name?.split(" ")[0] || "Profissional";
    return {
      trial_expiring: {
        title: "Aviso: Período de Testes Expirando",
        message: `Olá ${name}, identificamos que o seu período de testes gratuito de 7 dias está próximo do vencimento. Faça sua assinatura para continuar usando sem interrupções!`,
      },
      payment_overdue: {
        title: "Aviso: Pendência de Pagamento",
        message: `Olá ${name}, identificamos uma pendência no processamento da sua última fatura de assinatura. Por favor, regularize para evitar o bloqueio de acessos ao consultório.`,
      },
      platform_news: {
        title: "Novidades na Plataforma 🚀",
        message: `Olá ${name}, adicionamos recursos novinhos para simplificar a gestão de seus arquivos e pacientes! Acesse o painel para conferir o que há de novo.`,
      },
      custom: {
        title: "Comunicado Importante",
        message: `Olá ${name}, `,
      },
    };
  };

  const handleSendNotification = async () => {
    if (!notifyingProfile) return;
    if (!notifTitle.trim() || !notifMessage.trim()) {
      alert("Por favor, preencha o título e a mensagem da notificação.");
      return;
    }

    setSendingNotif(true);
    try {
      await addDoc(
        collection(db, `profiles/${notifyingProfile.id}/system_notifications`),
        {
          title: notifTitle,
          message: notifMessage,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      );
      alert("Notificação enviada com sucesso para a área do profissional!");
      setNotifyingProfile(null);
    } catch (e: any) {
      console.error("Error sending notification:", e);
      alert("Erro ao enviar notificação. Detalhes: " + e.message);
    } finally {
      setSendingNotif(false);
    }
  };

  const handleUpdateAutoNotifications = async (
    profileId: string,
    enabled: boolean,
    period?: string,
    frequency?: string,
  ) => {
    try {
      const pIndex = profiles.findIndex((p) => p.id === profileId);
      if (pIndex === -1) return;
      const current = profiles[pIndex];

      const updateData: any = {
        autoNotifEnabled: enabled,
        autoNotifPeriod:
          period !== undefined ? period : current.autoNotifPeriod || "monthly",
        autoNotifFrequency:
          frequency !== undefined
            ? frequency
            : current.autoNotifFrequency || "due_day",
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "profiles", profileId), updateData);

      setProfiles(
        profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                autoNotifEnabled: enabled,
                autoNotifPeriod: updateData.autoNotifPeriod,
                autoNotifFrequency: updateData.autoNotifFrequency,
              }
            : p,
        ),
      );
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profileId}`);
    }
  };

  useEffect(() => {
    if (selectedProfile) {
      let dateStr = "";
      if (selectedProfile.createdAt) {
        try {
          const d = selectedProfile.createdAt.toDate
            ? selectedProfile.createdAt.toDate()
            : new Date(selectedProfile.createdAt);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().split("T")[0];
          }
        } catch (e) {
          console.error(e);
        }
      }
      setAdmissionDate(dateStr);
      setAdminNotes(selectedProfile.adminNotes || "");
    } else {
      setAdmissionDate("");
      setAdminNotes("");
    }
  }, [selectedProfile]);

  const handleSaveAdminData = async () => {
    if (!selectedProfile) return;
    setSavingAdminData(true);
    try {
      const docRef = doc(db, "profiles", selectedProfile.id);

      const updateData: any = {
        adminNotes: adminNotes,
        updatedAt: serverTimestamp(),
      };

      if (admissionDate) {
        const parsedDate = new Date(admissionDate + "T12:00:00");
        updateData.createdAt = parsedDate.toISOString();
      } else {
        updateData.createdAt = null;
      }

      await updateDoc(docRef, updateData);

      setProfiles(
        profiles.map((p) =>
          p.id === selectedProfile.id
            ? { ...p, adminNotes: adminNotes, createdAt: updateData.createdAt }
            : p,
        ),
      );

      setSelectedProfile({
        ...selectedProfile,
        adminNotes: adminNotes,
        createdAt: updateData.createdAt,
      });

      alert("Dados administrativos salvos com sucesso!");
    } catch (e: any) {
      handleFirestoreError(
        e,
        OperationType.UPDATE,
        `profiles/${selectedProfile.id}`,
      );
      alert("Erro ao salvar dados administrativos.");
    } finally {
      setSavingAdminData(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAllowedUsers();
    fetchSupportSettings();
  }, []);

  const fetchSupportSettings = async () => {
    try {
      const docSnap = await getDoc(doc(db, "admin_settings", "support"));
      if (docSnap.exists()) {
        setSupportSettings({
          phone: "",
          email: "",
          message: "",
          saas_enabled: true,
          ...docSnap.data(),
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSupportSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupport(true);
    try {
      await setDoc(doc(db, "admin_settings", "support"), {
        ...supportSettings,
        updatedAt: serverTimestamp(),
      });
      alert("Configurações de suporte salvas com sucesso!");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, "admin_settings/support");
    } finally {
      setSavingSupport(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const q = query(collection(db, "profiles"));
      const snap = await getDocs(q);
      setProfiles(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowedUsers = async () => {
    try {
      const q = query(collection(db, "allowed_users"));
      const snap = await getDocs(q);
      setAllowedUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (profileId: string, status: string) => {
    try {
      const updateData: any = {
        subscriptionStatus: status,
        updatedAt: serverTimestamp(),
      };

      let newTrialEnd = null;
      if (status === "trial") {
        const t = new Date();
        t.setDate(t.getDate() + 7);
        newTrialEnd = t.toISOString();
        updateData.trialEndsAt = newTrialEnd;
      }

      await updateDoc(doc(db, "profiles", profileId), updateData);

      setProfiles(
        profiles.map((p) =>
          p.id === profileId
            ? {
                ...p,
                subscriptionStatus: status,
                ...(newTrialEnd ? { trialEndsAt: newTrialEnd } : {}),
              }
            : p,
        ),
      );
      alert("Status atualizado com sucesso!");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${profileId}`);
    }
  };

  const handleDeleteProfile = (profileId: string, profileName: string) => {
    setConfirmDelete({
      type: "profile",
      id: profileId,
      title: "Excluir Usuário",
      message: `Tem certeza que deseja excluir permanentemente o usuário ${profileName}?`,
    });
  };

  const executeDeleteAction = async () => {
    if (!confirmDelete.type || !confirmDelete.id) return;
    setDeleting(true);
    try {
      if (confirmDelete.type === "profile") {
        await deleteDoc(doc(db, "profiles", confirmDelete.id));
        setProfiles(profiles.filter((p) => p.id !== confirmDelete.id));
        alert("Usuário excluído com sucesso!");
      } else if (confirmDelete.type === "invite") {
        await deleteDoc(doc(db, "allowed_users", confirmDelete.id));
        fetchAllowedUsers();
        alert("Acesso removido com sucesso!");
      }
    } catch (e: any) {
      if (confirmDelete.type === "profile") {
        handleFirestoreError(
          e,
          OperationType.DELETE,
          `profiles/${confirmDelete.id}`,
        );
      } else {
        handleFirestoreError(
          e,
          OperationType.DELETE,
          `allowed_users/${confirmDelete.id}`,
        );
      }
    } finally {
      setDeleting(false);
      setConfirmDelete({ type: null, id: "", title: "", message: "" });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setInviting(true);
    try {
      const emailLower = newEmail.trim().toLowerCase();
      await setDoc(doc(db, "allowed_users", emailLower), {
        email: emailLower,
        status: "active",
        createdAt: serverTimestamp(),
      });
      setNewEmail("");
      fetchAllowedUsers();
      alert("Convite enviado com sucesso!");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `allowed_users/${newEmail}`);
      alert("Erro ao adicionar email.");
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvite = (id: string, email: string) => {
    setConfirmDelete({
      type: "invite",
      id: id,
      title: "Remover Acesso",
      message: `Tem certeza que deseja remover o acesso inicial de ${email}? Ele não poderá criar conta a menos que seja convidado novamente.`,
    });
  };

  const copySharingLink = () => {
    const url = `${window.location.origin}/?saas=true`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredProfiles = profiles.filter((p) => {
    const search = searchText.toLowerCase();
    const cleanSearchText = search.replace(/\D/g, "");
    const cleanCpf = p.cpf?.replace(/\D/g, "") || "";

    return (
      p.name?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search) ||
      p.cpf?.toLowerCase().includes(search) ||
      (cleanSearchText && cleanCpf.includes(cleanSearchText))
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Shield className="w-8 h-8 text-amber-500" /> Painel Administrativo
          </h1>
          <p className="text-slate-500 mt-2">
            Visão geral dos profissionais da empresa e seus acessos
          </p>
        </div>
        <div className="flex-1 w-full max-w-sm relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-amber-600" /> Link de Vendas da
            Plataforma (Landing Page SaaS)
          </h3>
          <p className="text-sm text-amber-800 mt-1">
            Compartilhe este link com profissionais para que conheçam a
            plataforma e iniciem o teste de 7 dias gratuito.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-2xl">
          <div className="flex items-center bg-white px-4 py-3 rounded-xl border border-amber-200 shadow-sm w-full">
            <span className="text-sm text-slate-600 font-mono select-all truncate">
              {window.location.origin}/?saas=true
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copySharingLink}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Link Copiado!" : "Copiar Link"}
            </button>
            <a
              href="/?saas=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Acessar Landing Page
            </a>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">
                Configurações & Suporte da Plataforma
              </h2>
            </div>
            <div className="p-4">
              <form
                onSubmit={handleSaveSupportSettings}
                className="flex flex-col gap-4"
              >
                {/* Ativação/Desativação de Vendas/SaaS */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-700 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Fluxo de Vendas e Testes (SaaS)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Ative ou desative o acesso à página comercial, checkout e fluxo de testes para novos psicólogos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSupportSettings({
                        ...supportSettings,
                        saas_enabled: !supportSettings.saas_enabled,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500",
                      supportSettings.saas_enabled ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        supportSettings.saas_enabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                <hr className="border-slate-100 dark:border-slate-700 my-1" />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={supportSettings.phone}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Ex: 5511999999999"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={supportSettings.email}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        email: e.target.value,
                      })
                    }
                    placeholder="Ex: suporte@plataforma.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mensagem (Opcional)
                  </label>
                  <textarea
                    value={supportSettings.message}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        message: e.target.value,
                      })
                    }
                    placeholder="Ex: Olá, preciso de ajuda com a plataforma..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingSupport}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {savingSupport ? "Salvando..." : "Salvar Dados"}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <MailPlus className="w-5 h-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">
                Convites Iniciais
              </h2>
            </div>
            <div className="p-4 border-b border-slate-100">
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="E-mail do profissional"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={inviting || !newEmail}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50"
                >
                  Convidar
                </button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                O profissional poderá logar usando a conta Google vinculada a
                este e-mail.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {allowedUsers.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Nenhum convite pendente/ativo na lista.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {allowedUsers.map((user) => (
                    <li
                      key={user.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="truncate pr-4 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Status inicial:{" "}
                          {user.status === "active" ? "Aprovado" : "Pendente"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteInvite(user.id, user.email)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remover convite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <UserX className="w-5 h-5 text-slate-500" />
            <h2 className="font-semibold text-slate-800">
              Profissionais Autenticados
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Carregando dados...
            </div>
          ) : (
            <div className="flex flex-col p-4 gap-4 bg-slate-50">
              {filteredProfiles.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                  Nenhum profissional encontrado.
                </div>
              ) : (
                filteredProfiles.map((p) => {
                  const isDefaulter =
                    p.subscriptionStatus !== "active" &&
                    p.subscriptionStatus !== "trial";
                  const isTrial = p.subscriptionStatus === "trial";
                  const isExpiredTrial =
                    isTrial &&
                    p.trialEndsAt &&
                    new Date(p.trialEndsAt) < new Date();

                  const createdAtDate = p.createdAt
                    ? p.createdAt.toDate
                      ? p.createdAt.toDate()
                      : new Date(p.createdAt)
                    : null;
                  const readjustment = getReadjustmentAlert(createdAtDate);

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-amber-200 hover:shadow transition-all flex items-start gap-4"
                    >
                      {/* Photo Column */}
                      <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-slate-100 mt-1">
                        {p.profilePhoto ? (
                          <img
                            src={p.profilePhoto}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserX className="w-8 h-8 text-slate-400 m-auto mt-2.5" />
                        )}
                      </div>

                      {/* 4-Line Content Column */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                        {/* Linha 1: Nome + Status Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-slate-800">
                            {p.name || p.email || "Profissional Sem Nome"}
                          </p>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border",
                              p.subscriptionStatus === "active"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isTrial && !isExpiredTrial
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200",
                            )}
                          >
                            {p.subscriptionStatus === "active" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {p.subscriptionStatus === "active"
                              ? "Assinatura Ativa"
                              : isTrial
                                ? isExpiredTrial
                                  ? "Teste Expirado"
                                  : "Em Teste (7 dias)"
                                : "Acesso Bloqueado"}
                          </span>

                          {p.trialEndsAt && isTrial && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              (Vence:{" "}
                              {format(new Date(p.trialEndsAt), "dd/MM/yyyy")})
                            </span>
                          )}
                        </div>

                        {/* Linha 2: Cargo e Especialidade */}
                        <div className="flex flex-wrap items-center gap-x-3 text-xs md:text-sm font-semibold text-slate-500">
                          <span className="text-amber-600">
                            {p.title || "Psicólogo(a) Clínico(a)"}
                          </span>
                          {p.specialties &&
                            (Array.isArray(p.specialties)
                              ? p.specialties.length > 0
                              : typeof p.specialties === "string") && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-600 font-medium select-all">
                                  {Array.isArray(p.specialties)
                                    ? p.specialties.join(", ")
                                    : p.specialties}
                                </span>
                              </>
                            )}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-normal truncate select-all">
                            {p.email || "E-mail não informado"}
                          </span>
                        </div>

                        {/* Linha 3: Dados de Cadastro */}
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-550">
                            <span className="flex items-center gap-1">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                CPF:
                              </span>{" "}
                              <span className="text-slate-600">
                                {p.cpf || "Não informado"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                CRP:
                              </span>{" "}
                              <span className="text-slate-600">
                                {p.crp || "Não informado"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                CNPJ:
                              </span>{" "}
                              <span className="text-slate-600">
                                {p.cnpj || "Não informado"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                WhatsApp:
                              </span>{" "}
                              <span className="text-slate-600">
                                {p.whatsapp || "Não informado"}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                Admissão:
                              </span>{" "}
                              <span className="text-slate-600">
                                {createdAtDate
                                  ? format(createdAtDate, "dd/MM/yyyy")
                                  : "Não informada"}
                              </span>
                            </span>
                          </div>

                          {p.adminNotes && (
                            <div className="flex items-start gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-lg mt-0.5 italic max-w-lg">
                              <span className="font-bold text-slate-600 not-italic shrink-0 mr-1">
                                📝 Notas:
                              </span>
                              <p className="line-clamp-2">{p.adminNotes}</p>
                            </div>
                          )}

                          {readjustment && (
                            <div
                              className={cn(
                                "mt-0.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 border max-w-md",
                                readjustment.daysRemaining >= 0 &&
                                  readjustment.daysRemaining <= 7
                                  ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                                  : readjustment.daysRemaining < 0
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200",
                              )}
                            >
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {readjustment.daysRemaining === 0
                                  ? `Reajuste Anual HOJE (${readjustment.dateFormatted})!`
                                  : readjustment.daysRemaining < 0
                                    ? `Reajuste Anual Vencido (${readjustment.dateFormatted} - há ${Math.abs(readjustment.daysRemaining)} dias)`
                                    : `Reajuste Anual Próximo (${readjustment.dateFormatted} - em ${readjustment.daysRemaining} dias)`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Linha das Notificações Automáticas */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-xl text-sans">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`autoNotif-${p.id}`}
                              checked={!!p.autoNotifEnabled}
                              onChange={(e) =>
                                handleUpdateAutoNotifications(
                                  p.id,
                                  e.target.checked,
                                )
                              }
                              className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-400 focus:ring-2 pointer-events-auto"
                            />
                            <label
                              htmlFor={`autoNotif-${p.id}`}
                              className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 py-0.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />{" "}
                              Ativar Alertas Automáticos (Vencimento/Atrasos)
                            </label>
                          </div>

                          {p.autoNotifEnabled && (
                            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">
                                  Plano/Período:
                                </span>
                                <select
                                  value={p.autoNotifPeriod || "monthly"}
                                  onChange={(e) =>
                                    handleUpdateAutoNotifications(
                                      p.id,
                                      true,
                                      e.target.value,
                                      p.autoNotifFrequency,
                                    )
                                  }
                                  className="text-[11px] border border-slate-200 bg-white rounded-lg py-1 px-1.5 font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans"
                                >
                                  <option value="weekly">Semanal</option>
                                  <option value="biweekly">Quinzenal</option>
                                  <option value="monthly">Mensal</option>
                                  <option value="yearly">Anual</option>
                                </select>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">
                                  Freq/Faturamento:
                                </span>
                                <select
                                  value={p.autoNotifFrequency || "due_day"}
                                  onChange={(e) =>
                                    handleUpdateAutoNotifications(
                                      p.id,
                                      true,
                                      p.autoNotifPeriod,
                                      e.target.value,
                                    )
                                  }
                                  className="text-[11px] border border-slate-200 bg-white rounded-lg py-1 px-1.5 font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans"
                                >
                                  <option value="3_days_before">
                                    3 dias antes
                                  </option>
                                  <option value="1_day_before">
                                    1 dia antes
                                  </option>
                                  <option value="due_day">No vencimento</option>
                                  <option value="3_days_after">
                                    3 dias de atraso
                                  </option>
                                  <option value="5_days_after">
                                    5 dias de atraso
                                  </option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Linha 4: Botões (ver detalhes, caixa de seleção e lixeira) */}
                        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 mt-1">
                          <button
                            onClick={() => setSelectedProfile(p)}
                            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors font-sans"
                          >
                            Ver Detalhes
                          </button>

                          <button
                            onClick={() => {
                              setNotifyingProfile(p);
                              const templates = getTemplatesForProfile(p);
                              setNotifTemplate("trial_expiring");
                              setNotifTitle(templates.trial_expiring.title);
                              setNotifMessage(templates.trial_expiring.message);
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 rounded-lg border border-amber-200/50 transition-colors inline-flex items-center gap-1.5 font-sans"
                            title="Enviar Alerta Customizado ou por Modelo"
                          >
                            <Bell className="w-3.5 h-3.5" /> Mandar Alerta
                          </button>

                          <select
                            className="text-xs border border-slate-300 rounded-lg py-1.5 px-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-semibold text-slate-700 font-sans"
                            value={p.subscriptionStatus || "pending"}
                            onChange={(e) =>
                              handleUpdateStatus(p.id, e.target.value)
                            }
                          >
                            <option value="active">✓ Ativar</option>
                            <option value="trial">⏳ Teste Grátis</option>
                            <option value="pending">⨯ Bloquear</option>
                          </select>
                          <button
                            onClick={() =>
                              handleDeleteProfile(p.id, p.name || p.email)
                            }
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 font-sans">
                Detalhes do Profissional
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors text-xl font-sans"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto font-sans">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border">
                  {selectedProfile.profilePhoto ? (
                    <img
                      src={selectedProfile.profilePhoto}
                      alt={selectedProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserX className="w-8 h-8 text-slate-400 m-auto mt-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-xl text-slate-800">
                    {selectedProfile.name || "Sem nome"}
                  </p>
                  <p className="text-sm text-amber-600 font-semibold">
                    {selectedProfile.title || "Psicólogo(a) Clínico(a)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    E-mail
                  </p>
                  <p className="text-sm text-slate-800 font-semibold break-all">
                    {selectedProfile.email || "Não informado"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Telefone / WhatsApp
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {selectedProfile.whatsapp ||
                      selectedProfile.phone ||
                      "Não informado"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    CPF
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {selectedProfile.cpf || "Não informado"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    CRP
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {selectedProfile.crp || "Não informado"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    CNPJ
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {selectedProfile.cnpj || "Não informado"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Endereço
                  </p>
                  <p className="text-sm text-slate-800 font-semibold">
                    {[
                      selectedProfile.address,
                      selectedProfile.neighborhood,
                      selectedProfile.city,
                      selectedProfile.state,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Nenhum endereço informado"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    📅 Data de Admissão
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 bg-white text-slate-800 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    Vence anualmente para reajuste
                  </p>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    📝 Anotações do Cadastro
                  </label>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Regras de comissão, observações cadastrais, anotações de reajuste..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 font-sans">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAdminData}
                disabled={savingAdminData}
                className="px-6 py-2.5 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow"
              >
                {savingAdminData ? "Salvando..." : "Salvar Informações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Notification Dispatch Modal */}
      {notifyingProfile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-550" />
                <h2 className="text-xl font-bold text-slate-800">
                  Nova Notificação ao Profissional
                </h2>
              </div>
              <button
                onClick={() => setNotifyingProfile(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors text-xl font-sans"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider mb-0.5">
                  Destinatário
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                    {notifyingProfile.name
                      ? notifyingProfile.name.charAt(0)
                      : "P"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {notifyingProfile.name || "Sem nome"}
                    </p>
                    <p className="text-xs text-slate-500 break-all">
                      {notifyingProfile.email || "Sem email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Selecionar Modelo de Alerta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "trial_expiring", label: "⏳ Teste Expirando" },
                    { id: "payment_overdue", label: "💸 Fatura em Atraso" },
                    { id: "platform_news", label: "🚀 Novidades" },
                    { id: "custom", label: "✏️ Customizado" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setNotifTemplate(t.id);
                        const templates =
                          getTemplatesForProfile(notifyingProfile);
                        const tmpl = templates[
                          t.id as keyof typeof templates
                        ] || { title: "", message: "" };
                        setNotifTitle(tmpl.title);
                        setNotifMessage(tmpl.message);
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-xs font-bold text-left transition-all",
                        notifTemplate === t.id
                          ? "bg-amber-50 text-amber-900 border-amber-300 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Título do Alerta
                </label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="Ex: Mensagem de Apoio Técnica..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-bold"
                />
              </div>

              {/* Notification Message Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mensagem do Alerta (Será mostrada no painel do usuário)
                </label>
                <textarea
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Digite o conteúdo da notificação direta..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setNotifyingProfile(null)}
                className="px-5 py-2.5 bg-slate-200 text-slate-755 font-bold text-sm rounded-xl hover:bg-slate-300 transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                disabled={sendingNotif}
                className="px-6 py-2.5 bg-amber-550 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow"
              >
                {sendingNotif ? "Enviando..." : "Enviar Alerta Agora"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {confirmDelete.type && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 font-sans">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="text-red-500">⚠️</span> {confirmDelete.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {confirmDelete.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setConfirmDelete({
                    type: null,
                    id: "",
                    title: "",
                    message: "",
                  })
                }
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteAction}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow"
              >
                {deleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
