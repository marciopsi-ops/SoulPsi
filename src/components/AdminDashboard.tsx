import React, { useState, useEffect } from "react";
import { db, storage, handleFirestoreError, OperationType } from "../firebase";
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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
  Database,
  Download,
  Loader2,
  CreditCard,
  Key,
  RefreshCw,
  Play,
  Check,
  HelpCircle,
  Activity,
  Code,
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

  // Backup system states
  const [backupsHistory, setBackupsHistory] = useState<any[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);

  // Stripe configuration and simulator states
  const [stripeConfig, setStripeConfig] = useState({
    mode: "test",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    priceProfMonthly: "",
    priceProfYearly: "",
    pricePremMonthly: "",
    pricePremYearly: "",
    amountProfMonthly: "59.90",
    amountProfYearly: "499.90",
    amountPremMonthly: "99.90",
    amountPremYearly: "839.90",
  });
  const [savingStripe, setSavingStripe] = useState(false);
  const [simulatedUser, setSimulatedUser] = useState("");
  const [simulatedPlan, setSimulatedPlan] = useState("professional");
  const [simulatedBillingCycle, setSimulatedBillingCycle] = useState("monthly");
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<any[]>([]);
  const [activeStripeTab, setActiveStripeTab] = useState<"config" | "instructions" | "simulator">("config");

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

  const fetchBackupsHistory = async () => {
    try {
      const q = query(collection(db, "backups_history"));
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBackupsHistory(list);
    } catch (e) {
      console.error("Error fetching backups history:", e);
    }
  };

  const handleBackup = async () => {
    if (backingUp) return;
    setBackingUp(true);
    setBackupMessage("Iniciando rotina de exportação do Firestore...");

    try {
      setBackupMessage("Buscando perfis dos terapeutas...");
      const q = query(collection(db, "profiles"));
      const snap = await getDocs(q);
      const profilesData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setBackupMessage(`Encontrados ${profilesData.length} terapeutas. Exportando subcoleções...`);

      const fullProfilesBackup = await Promise.all(
        profilesData.map(async (profile) => {
          const subcollections: Record<string, any[]> = {};
          const subcollNames = [
            "clients",
            "appointments",
            "signatures",
            "companies",
            "companyAppointments",
            "interactions",
            "reviews",
            "notifications",
            "system_notifications"
          ];

          await Promise.all(
            subcollNames.map(async (subName) => {
              try {
                const subSnap = await getDocs(collection(db, "profiles", profile.id, subName));
                subcollections[subName] = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              } catch (err) {
                console.warn(`Could not backup subcollection ${subName} for profile ${profile.id}:`, err);
                subcollections[subName] = [];
              }
            })
          );

          return {
            id: profile.id,
            data: profile,
            subcollections,
          };
        })
      );

      setBackupMessage("Exportando lista de convites (allowed_users)...");
      let allowedUsersBackup: any[] = [];
      try {
        const allowedSnap = await getDocs(collection(db, "allowed_users"));
        allowedUsersBackup = allowedSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error("Failed to backup allowed_users:", e);
      }

      setBackupMessage("Exportando configurações administrativas (admin_settings)...");
      let adminSettingsBackup: any[] = [];
      try {
        const settingsSnap = await getDocs(collection(db, "admin_settings"));
        adminSettingsBackup = settingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error("Failed to backup admin_settings:", e);
      }

      setBackupMessage("Gerando arquivo de snapshot JSON...");
      const backupPayload = {
        backupVersion: "1.0",
        exportedAt: new Date().toISOString(),
        totalProfiles: profilesData.length,
        profiles: fullProfilesBackup,
        allowedUsers: allowedUsersBackup,
        adminSettings: adminSettingsBackup,
      };

      const jsonString = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const filename = `backups/therapists_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      setBackupMessage("Enviando snapshot para o Firebase Storage...");
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);

      setBackupMessage("Registrando histórico de backup...");
      await addDoc(collection(db, "backups_history"), {
        filename,
        downloadUrl,
        createdAt: new Date().toISOString(),
        profileCount: profilesData.length,
      });

      setBackupMessage("");
      alert("Backup completo e snapshot salvo no Storage com sucesso!");
      fetchBackupsHistory();
    } catch (error: any) {
      console.error("Error during backup operation:", error);
      alert(`Erro durante a rotina de backup: ${error.message || error}`);
      setBackupMessage("");
    } finally {
      setBackingUp(false);
    }
  };

  const handleDeleteBackup = async (backupId: string, filename: string) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este backup do Storage e do Histórico?")) {
      return;
    }
    setDeletingBackupId(backupId);
    try {
      try {
        const fileRef = ref(storage, filename);
        await deleteObject(fileRef);
      } catch (storageErr) {
        console.warn("Could not delete backup file from storage (it might already be deleted):", storageErr);
      }

      await deleteDoc(doc(db, "backups_history", backupId));
      alert("Backup excluído com sucesso!");
      fetchBackupsHistory();
    } catch (err: any) {
      console.error("Error deleting backup:", err);
      alert(`Erro ao excluir backup: ${err.message || err}`);
    } finally {
      setDeletingBackupId(null);
    }
  };

  useEffect(() => {
    fetchProfiles();
    fetchAllowedUsers();
    fetchSupportSettings();
    fetchBackupsHistory();
    fetchStripeConfig();
    fetchStripeLogs();
  }, []);

  const fetchStripeConfig = async () => {
    try {
      const publicSnap = await getDoc(doc(db, "admin_settings", "stripe_public"));
      const privateSnap = await getDoc(doc(db, "admin_settings", "stripe_private"));
      const plansSnap = await getDoc(doc(db, "admin_settings", "subscription_plans"));
      let loaded = {
        mode: "test",
        publishableKey: "",
        secretKey: "",
        webhookSecret: "",
        priceProfMonthly: "",
        priceProfYearly: "",
        pricePremMonthly: "",
        pricePremYearly: "",
        amountProfMonthly: "59.90",
        amountProfYearly: "499.90",
        amountPremMonthly: "99.90",
        amountPremYearly: "839.90",
      };
      if (publicSnap.exists()) {
        loaded = { ...loaded, ...publicSnap.data() };
      }
      if (privateSnap.exists()) {
        loaded = { ...loaded, ...privateSnap.data() };
      }
      if (plansSnap.exists()) {
        loaded = { ...loaded, ...plansSnap.data() };
      }
      setStripeConfig(loaded);
    } catch (e) {
      console.error("Error loading stripe config:", e);
    }
  };

  const handleSaveStripeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStripe(true);
    try {
      const { secretKey, webhookSecret, ...publicFields } = stripeConfig;
      await setDoc(doc(db, "admin_settings", "stripe_public"), {
        ...publicFields,
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "admin_settings", "stripe_private"), {
        secretKey: secretKey || "",
        webhookSecret: webhookSecret || "",
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "admin_settings", "subscription_plans"), {
        amountProfMonthly: stripeConfig.amountProfMonthly || "59.90",
        amountProfYearly: stripeConfig.amountProfYearly || "499.90",
        amountPremMonthly: stripeConfig.amountPremMonthly || "99.90",
        amountPremYearly: stripeConfig.amountPremYearly || "839.90",
        priceProfMonthly: stripeConfig.priceProfMonthly || "",
        priceProfYearly: stripeConfig.priceProfYearly || "",
        pricePremMonthly: stripeConfig.pricePremMonthly || "",
        pricePremYearly: stripeConfig.pricePremYearly || "",
        updatedAt: serverTimestamp(),
      });
      alert("Configurações do Stripe e Planos de Assinatura salvas com sucesso!");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, "admin_settings/stripe_config");
      alert("Erro ao salvar chaves e preços do Stripe/Planos.");
    } finally {
      setSavingStripe(false);
    }
  };

  const fetchStripeLogs = async () => {
    try {
      const q = query(collection(db, "stripe_logs"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setSimulatedLogs(list);
    } catch (e) {
      console.error("Error loading stripe logs:", e);
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedUser) {
      alert("Selecione um profissional para simular a assinatura!");
      return;
    }
    setSimulatingPayment(true);
    try {
      const targetProfile = profiles.find((p) => p.id === simulatedUser);
      if (!targetProfile) throw new Error("Perfil não encontrado");

      const price = simulatedPlan === "professional" 
        ? (simulatedBillingCycle === "monthly" ? Number(stripeConfig.amountProfMonthly || 59.90) : Number(stripeConfig.amountProfYearly || 499.90))
        : (simulatedBillingCycle === "monthly" ? Number(stripeConfig.amountPremMonthly || 99.90) : Number(stripeConfig.amountPremYearly || 839.90));

      const endsAt = simulatedBillingCycle === "monthly"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const transactionId = "ch_sim_" + Math.random().toString(36).substring(2, 12);
      const subscriptionId = "sub_sim_" + Math.random().toString(36).substring(2, 12);

      const updateData = {
        subscriptionStatus: "active",
        activePlan: simulatedPlan,
        billingCycle: simulatedBillingCycle,
        trialEndsAt: null,
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionExpiresAt: endsAt.toISOString(),
        subscriptionPrice: price,
        paymentMethod: "credit_card",
        lastPaymentDate: new Date().toISOString(),
        stripeSubscriptionId: subscriptionId,
        updatedAt: serverTimestamp(),
      };

      // 1. Update therapist profile subscription
      await updateDoc(doc(db, "profiles", simulatedUser), updateData);

      // 2. Add system notification
      const notifId = `stripe_${Date.now()}`;
      await setDoc(doc(db, "profiles", simulatedUser, "system_notifications", notifId), {
        title: "Assinatura Confirmada! 💳",
        message: `Sua assinatura do plano ${simulatedPlan === "professional" ? "Profissional" : "Premium"} (${simulatedBillingCycle === "monthly" ? "Mensal" : "Anual"}) foi confirmada com sucesso via Stripe! Obrigado por fazer parte da ELO.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // 3. Log webhook event
      await addDoc(collection(db, "stripe_logs"), {
        eventId: "evt_" + Math.random().toString(36).substring(2, 12),
        type: "invoice.payment_succeeded",
        profileId: simulatedUser,
        profileName: targetProfile.name || "Profissional Sem Nome",
        profileEmail: targetProfile.email || "Sem e-mail",
        plan: simulatedPlan,
        cycle: simulatedBillingCycle,
        amount: price,
        transactionId,
        subscriptionId,
        status: "succeeded",
        timestamp: new Date().toISOString(),
      });

      alert(`Simulação de pagamento aprovada para ${targetProfile.name}!`);
      setSimulatedUser("");
      fetchProfiles();
      fetchStripeLogs();
    } catch (err: any) {
      console.error("Simulation error:", err);
      alert(`Erro na simulação do Stripe: ${err.message || err}`);
    } finally {
      setSimulatingPayment(false);
    }
  };

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
              className="flex items-center justify-center gap-1.5 bg-marsala-700 hover:bg-marsala-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
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
                  className="w-full bg-marsala-700 hover:bg-marsala-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {savingSupport ? "Salvando..." : "Salvar Dados"}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-800">
                Backup de Segurança (Firestore Export)
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Gere e salve snapshots completos em formato JSON de todos os terapeutas, convites e configurações no Firebase Storage. Útil para auditoria e recuperação de desastres.
              </p>

              {backingUp ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando backup...</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{backupMessage}</p>
                </div>
              ) : (
                <button
                  onClick={handleBackup}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Database className="w-4 h-4" />
                  Iniciar Novo Backup Completo
                </button>
              )}

              <hr className="border-slate-100" />

              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Histórico de Snapshots Recentes
                </h4>

                {backupsHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Nenhum backup gerado anteriormente.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {backupsHistory.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-medium text-slate-700 truncate">
                            {b.filename.replace("backups/", "")}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(b.createdAt).toLocaleString("pt-BR")} • {b.profileCount || 0} perfis
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={b.downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-150 rounded-lg transition-colors"
                            title="Baixar backup"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteBackup(b.id, b.filename)}
                            disabled={deletingBackupId === b.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-150 rounded-lg transition-colors disabled:opacity-50"
                            title="Excluir backup"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        {/* Painel de Gestão e Integração do Stripe */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mb-8">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Integração e Gestão do Stripe
                </h2>
                <p className="text-xs text-slate-500">
                  Configure as chaves da API, gerencie IDs de planos de assinatura e simule transações do gateway.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-center">
              <button
                type="button"
                onClick={() => setStripeConfig({ ...stripeConfig, mode: "test" })}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  stripeConfig.mode === "test" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"
                )}
              >
                Test Mode
              </button>
              <button
                type="button"
                onClick={() => setStripeConfig({ ...stripeConfig, mode: "live" })}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                  stripeConfig.mode === "live" ? "bg-amber-500 text-white shadow-sm" : "text-slate-400"
                )}
              >
                Live Mode
              </button>
            </div>
          </div>

          {/* Sub-Tabs Nav */}
          <div className="flex border-b border-slate-100 px-5 bg-slate-50/50">
            {[
              { id: "config", label: "Chaves & Preços", icon: Key },
              { id: "instructions", label: "Instruções de Configuração", icon: HelpCircle },
              { id: "simulator", label: "Simulador de Webhooks & Logs", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveStripeTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all -mb-px cursor-pointer",
                    activeStripeTab === tab.id
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Tab 1: Config & Prices */}
            {activeStripeTab === "config" && (
              <form onSubmit={handleSaveStripeConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credentials block */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      Credenciais da API do Stripe
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Stripe Publishable Key ({stripeConfig.mode === "live" ? "Live" : "Test"})
                      </label>
                      <input
                        type="text"
                        value={stripeConfig.publishableKey}
                        onChange={(e) => setStripeConfig({ ...stripeConfig, publishableKey: e.target.value })}
                        placeholder="pk_test_..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Stripe Secret Key ({stripeConfig.mode === "live" ? "Live" : "Test"})
                      </label>
                      <input
                        type="password"
                        value={stripeConfig.secretKey}
                        onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
                        placeholder="sk_test_..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Mantida segura e encriptada. Apenas administradores do sistema podem salvar e visualizar esta chave.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Stripe Webhook Secret
                      </label>
                      <input
                        type="password"
                        value={stripeConfig.webhookSecret}
                        onChange={(e) => setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })}
                        placeholder="whsec_..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Segredo de assinatura para validar que os webhooks realmente vieram do Stripe.
                      </p>
                    </div>
                  </div>

                  {/* Plan Price IDs block */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-slate-400" />
                      Price IDs dos Planos (Stripe Dashboard)
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <span className="text-[11px] font-medium text-slate-400 block mb-2">
                          Copie os Price IDs das assinaturas recorrentes geradas no painel do Stripe para sincronizar os botões de checkout dos terapeutas.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Profissional Mensal (ID)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.priceProfMonthly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, priceProfMonthly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800 mb-2"
                        />
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Valor de Exibição Mensal (R$)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.amountProfMonthly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, amountProfMonthly: e.target.value })}
                          placeholder="59.90"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Profissional Anual (ID)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.priceProfYearly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, priceProfYearly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800 mb-2"
                        />
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Valor de Exibição Anual (R$)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.amountProfYearly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, amountProfYearly: e.target.value })}
                          placeholder="499.90"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Premium Mensal (ID)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.pricePremMonthly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, pricePremMonthly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800 mb-2"
                        />
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Valor de Exibição Mensal (R$)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.amountPremMonthly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, amountPremMonthly: e.target.value })}
                          placeholder="99.90"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Premium Anual (ID)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.pricePremYearly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, pricePremYearly: e.target.value })}
                          placeholder="price_..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-800 mb-2"
                        />
                        <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                          Valor de Exibição Anual (R$)
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.amountPremYearly}
                          onChange={(e) => setStripeConfig({ ...stripeConfig, amountPremYearly: e.target.value })}
                          placeholder="839.90"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700 font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingStripe}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    {savingStripe ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando Chaves...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Salvar Configuração do Stripe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Instructions */}
            {activeStripeTab === "instructions" && (
              <div className="space-y-4 text-sm text-slate-600 leading-relaxed max-w-4xl">
                <h3 className="text-base font-bold text-slate-800">
                  Melhor Arquitetura para Integração do Stripe na Plataforma
                </h3>
                
                <p>
                  Para habilitar o recebimento de pagamentos reais de forma segura e automatizada por parte dos terapeutas, a melhor prática envolve utilizar o <strong>Stripe Checkout</strong> e <strong>Stripe Webhooks</strong> de forma integrada ao Firebase.
                </p>

                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-3">
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                    Como funciona o Fluxo Recomendado:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-900/80">
                    <li><strong>Início da Assinatura:</strong> Quando o profissional clica em "Assinar agora" no painel, o sistema faz uma requisição para a nossa API do servidor (ou Firebase Cloud Function) enviando o <code>Price ID</code> correspondente.</li>
                    <li><strong>Checkout Session:</strong> O servidor inicializa uma sessão do Stripe Checkout via SDK Node.js e retorna o link seguro do Stripe. O terapeuta é redirecionado para concluir o pagamento de forma criptografada.</li>
                    <li><strong>Redirecionamento:</strong> Após preencher o cartão ou pagar o Pix, o Stripe redireciona o usuário de volta para o sistema (página de sucesso).</li>
                    <li><strong>Confirmação via Webhooks:</strong> O Stripe envia um webhook assinado para o nosso endpoint <code>/api/webhooks/stripe</code> no servidor. Ao receber e validar a assinatura com o <code>Webhook Secret</code>, o sistema atualiza o documento <code>profiles/id_do_usuario</code> com status <code>active</code> e datas de expiração corretas de forma segura.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                      Eventos Necessários no Webhook:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-500">
                      <li><code>checkout.session.completed</code>: Libera o plano imediatamente após o primeiro pagamento.</li>
                      <li><code>invoice.payment_succeeded</code>: Executado a cada renovação mensal ou anual para prorrogar a expiração.</li>
                      <li><code>customer.subscription.deleted</code>: Cancela ou bloqueia o acesso se o profissional cancelar a assinatura ou o cartão falhar consecutivamente.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2">
                      Links Úteis no Painel do Stripe:
                    </h4>
                    <ul className="list-none space-y-1.5 text-xs text-slate-500">
                      <li>
                        <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium flex items-center gap-1">
                          Chaves de API (Publishable / Secret Keys) <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <a href="https://dashboard.stripe.com/products" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium flex items-center gap-1">
                          Produtos e Preços das Assinaturas <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-amber-600 hover:underline font-medium flex items-center gap-1">
                          Configuração dos Webhooks <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Simulator */}
            {activeStripeTab === "simulator" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Simulator Form */}
                  <div className="lg:col-span-1 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <Play className="w-4 h-4 text-amber-500" />
                        Gerador de Eventos (Simulador)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Selecione um terapeuta para simular o recebimento de um webhook com sucesso do Stripe e testar a sincronização.
                      </p>
                    </div>

                    <form onSubmit={handleSimulatePayment} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Profissional Destinatário
                        </label>
                        <select
                          value={simulatedUser}
                          onChange={(e) => setSimulatedUser(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700"
                        >
                          <option value="">-- Selecione o Terapeuta --</option>
                          {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || "Sem Nome"} ({p.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Plano Escolhido
                          </label>
                          <select
                            value={simulatedPlan}
                            onChange={(e) => setSimulatedPlan(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                          >
                            <option value="professional">Profissional</option>
                            <option value="premium">Premium</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Recorrência
                          </label>
                          <select
                            value={simulatedBillingCycle}
                            onChange={(e) => setSimulatedBillingCycle(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                          >
                            <option value="monthly">Mensal</option>
                            <option value="yearly">Anual</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={simulatingPayment}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {simulatingPayment ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processando Sincronismo...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Simular Webhook Stripe</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Webhook Log Table */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-slate-400" />
                        Histórico Recente de Webhooks & Eventos Sincronizados
                      </h3>
                      <button
                        type="button"
                        onClick={fetchStripeLogs}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        title="Atualizar Logs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {simulatedLogs.length === 0 ? (
                      <div className="p-8 border border-slate-200 border-dashed rounded-2xl text-center text-slate-400 text-xs">
                        Nenhum evento registrado ainda. Execute uma simulação para visualizar os logs de sincronização aqui.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs divide-y divide-slate-100">
                          <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                            <tr>
                              <th className="p-3">Evento / Data</th>
                              <th className="p-3">Terapeuta</th>
                              <th className="p-3">Plano / Valor</th>
                              <th className="p-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 bg-white">
                            {simulatedLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3">
                                  <span className="font-mono text-amber-600 font-medium block">
                                    {log.type}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-semibold text-slate-700 block">
                                    {log.profileName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {log.profileEmail}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="text-slate-600 font-semibold block uppercase">
                                    {log.plan} ({log.cycle === "monthly" ? "Mensal" : "Anual"})
                                  </span>
                                  <span className="text-[11px] text-slate-500 block font-semibold text-emerald-600 mt-0.5">
                                    R$ {log.amount.toFixed(2).replace(".", ",")}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold border border-emerald-150">
                                    <Check className="w-3 h-3" /> SUCCESS
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
        <div className="fixed inset-0 bg-marsala-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 bg-marsala-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 bg-marsala-800/55 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
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
