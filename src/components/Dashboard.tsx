import React, { useState, useEffect, useMemo } from "react";
import { Joyride, STATUS } from "react-joyride";
import {
  db,
  storage,
  auth,
  handleFirestoreError,
  OperationType,
} from "../firebase";
import {
  collection,
  query,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  LayoutDashboard,
  Loader2,
  CheckCircle2,
  User,
  Calendar as CalendarIcon,
  MessageSquare,
  Settings,
  Check,
  X,
  RefreshCw,
  Plus,
  Copy,
  Trash2,
  Upload,
  DollarSign,
  Filter,
  Edit2,
  Gift,
  Send,
  MessageCircle,
  Mail,
  Building,
  Download,
  FileUp,
  Zap,
  AlertCircle,
  Bell,
  Search,
  BookOpen,
  Link,
  UserCheck,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Wallet,
  UserMinus,
  MessagesSquare,
  Video,
  ExternalLink,
  ReceiptText,
  FileText,
  LifeBuoy,
  HelpCircle,
  CreditCard,
  Star,
  Eye,
  EyeOff,
  Globe,
  AlertTriangle,
  Percent,
  SlidersHorizontal,
} from "lucide-react";
import { DocumentManager } from "./DocumentManager";
import { SubscriptionManager } from "./SubscriptionManager";
import { ReadjustmentHistoryManager } from "./ReadjustmentHistoryManager";
import { cn, formatWa, validateEmailDomain, ALLOWED_CORPORATE_DOMAINS } from "../lib/utils";
import { createMeetSpace } from "../services/meetService";
import { format } from "date-fns";
import { FastAverageColor } from "fast-average-color";
import { THEMES } from "../lib/themes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const formatMoneyUI = (value: any, hideFinance: boolean = false) => {
  if (hideFinance) return "R$ •••••";
  if (value === undefined || value === null) return "R$ 0,00";
  const num = Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
};

function CostManager({
  costsStr,
  type,
  userId,
  onUpdates,
  filterMonths,
  filterYear,
  isIncome = false,
  billingAccounts = ["ELO", "MEI Carla", "CPF Marcio", "CPF Carla", "Dinheiro"],
  onManageAccounts,
  hideFinance = true,
  additionalUpdates,
}: {
  costsStr: string;
  type:
    | "patientCostsStr"
    | "companyCostsStr"
    | "generalCostsStr"
    | "generalIncomesStr";
  userId: string;
  onUpdates: (newStr: string) => void;
  filterMonths: number[];
  filterYear: number;
  isIncome?: boolean;
  billingAccounts?: string[];
  onManageAccounts?: () => void;
  hideFinance?: boolean;
  additionalUpdates?: Record<string, any>;
}) {
  const [costs, setCosts] = useState<
    {
      id: string;
      name: string;
      amount: number;
      month?: string;
      year?: string;
      status?: "pago" | "pendente";
      account?: string;
    }[]
  >(() => {
    try {
      return JSON.parse(costsStr || "[]");
    } catch {
      return [];
    }
  });

  // Keep state sync with props
  useEffect(() => {
    try {
      setCosts(JSON.parse(costsStr || "[]"));
    } catch {
      setCosts([]);
    }
  }, [costsStr]);

  const currentYear = new Date().getFullYear().toString();
  const [form, setForm] = useState({
    name: "",
    amount: "",
    month: "",
    year: currentYear,
    status: "pago" as "pago" | "pendente",
    account: "",
  });
  const [saving, setSaving] = useState(false);

  const suggestions =
    type === "patientCostsStr"
      ? [
          "Aluguel sala",
          "Material de escritório",
          "Internet",
          "Luz",
          "Testes psicológicos",
          "Marketing",
        ]
      : type === "generalIncomesStr"
        ? [
            "Aulas e Cursos",
            "Supervisão",
            "Palestras",
            "Consultoria",
            "Venda de Material",
          ]
        : [
            "Contabilidade",
            "Impostos",
            "Licenças software",
            "Deslocamento",
            "Refeições",
            "Eventos",
          ];

  const addCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    const newCost = {
      id: Math.random().toString(),
      name: form.name,
      amount: Number(form.amount),
      month: form.month,
      year: form.month ? form.year : undefined,
      status: form.status,
      account: form.account.trim(),
    };
    const newCosts = [...costs, newCost];
    await saveCosts(newCosts);
    setForm({
      name: "",
      amount: "",
      month: form.month,
      year: form.year,
      status: "pago",
      account: "",
    });
  };

  const toggleStatus = async (item: any) => {
    const updated = costs.map((c) => {
      if (c.id === item.id) {
        return {
          ...c,
          status:
            (c.status || "pago") === "pendente"
              ? "pago"
              : ("pendente" as "pago" | "pendente"),
        };
      }
      return c;
    });
    setCosts(updated);
    await saveCosts(updated);
  };

  const removeCost = async (id: string) => {
    const newCosts = costs.filter((c) => c.id !== id);
    await saveCosts(newCosts);
  };

  const saveCosts = async (newCosts: any[]) => {
    setSaving(true);
    try {
      const str = JSON.stringify(newCosts);
      const updateData: any = {
        [type]: str,
        updatedAt: serverTimestamp(),
      };
      if (additionalUpdates) {
        Object.assign(updateData, additionalUpdates);
      }
      await updateDoc(doc(db, "profiles", userId), updateData);
      setCosts(newCosts);
      onUpdates(str);
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${userId}`);
    } finally {
      setSaving(false);
    }
  };

  const monthsArray = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const stringMonths = filterMonths.map((i) => monthsArray[i]);

  const filteredCosts = costs.filter((c) => {
    if (!c.month) return true; // Fixed costs are shown in all months
    if (stringMonths.length > 0) {
      return stringMonths.includes(c.month) && c.year === filterYear.toString();
    }
    return true;
  });

  const currentTotal = filteredCosts.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <DollarSign
            className={`w-5 h-5 ${isIncome ? "text-emerald-500" : "text-red-500"}`}
          />
          {isIncome ? "Outras Receitas" : "Custos e Despesas"}
        </h3>
      </div>

      <div
        className={`p-3 rounded-lg border flex items-center justify-between mb-4 ${isIncome ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100"}`}
      >
        <div className="text-sm font-semibold">
          Total para o Período Filtrado{" "}
          <span
            className={`font-normal text-xs ml-1 ${isIncome ? "text-emerald-500" : "text-red-500"}`}
          >
            (inclui {isIncome ? "valores" : "custos"} fixos)
          </span>
        </div>
        <div className="text-lg font-bold">
          {formatMoneyUI(currentTotal, hideFinance)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setForm({ ...form, name: s })}
            className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
          >
            + {s}
          </button>
        ))}
      </div>
      <form
        onSubmit={addCost}
        className="flex flex-wrap items-center gap-2 mb-4"
      >
        <input
          type="text"
          placeholder={isIncome ? "Nome da receita..." : "Nome do custo..."}
          className="flex-1 min-w-[150px] p-2 border rounded-lg text-sm bg-white focus:ring-amber-400 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <div className="flex w-full sm:w-auto gap-2">
          <select
            className="p-2 border rounded-lg text-sm bg-white focus:ring-amber-400 flex-1 sm:flex-none text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
            value={form.month}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          >
            <option value="">Todo mês / Fixo</option>
            <option value="Jan">Janeiro</option>
            <option value="Fev">Fevereiro</option>
            <option value="Mar">Março</option>
            <option value="Abr">Abril</option>
            <option value="Mai">Maio</option>
            <option value="Jun">Junho</option>
            <option value="Jul">Julho</option>
            <option value="Ago">Agosto</option>
            <option value="Set">Setembro</option>
            <option value="Out">Outubro</option>
            <option value="Nov">Novembro</option>
            <option value="Dez">Dezembro</option>
          </select>
          {form.month && (
            <input
              type="number"
              min="2000"
              max="2099"
              step="1"
              className="w-20 p-2 border rounded-lg text-sm bg-white focus:ring-amber-400 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              required
            />
          )}
        </div>

        {/* Status Selection */}
        <select
          className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-amber-450 font-medium text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as any })}
        >
          <option value="pago">&#x1F4AC; Pago</option>
          <option value="pendente">&#x23F3; Pendente</option>
        </select>

        {/* Billing Account/Location Selection field */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <select
            className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-amber-400 w-full sm:w-48 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
          >
            <option value="">Conta / Destino...</option>
            {billingAccounts.map((acc: string) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>
          {onManageAccounts && (
            <button
              type="button"
              onClick={onManageAccounts}
              className="p-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-lg hover:text-amber-500 transition shadow-sm h-[38px] flex items-center justify-center"
              title="Gerenciar Contas"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="R$ 0,00"
          className="w-28 p-2 border rounded-lg text-sm bg-white focus:ring-amber-400 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50"
        >
          Incluir
        </button>
      </form>
      {filteredCosts.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredCosts.map((c, idx) => (
            <div
              key={`${c.id}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 px-4 rounded-xl border border-slate-200 gap-2 text-sm shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-slate-700">{c.name}</span>
                {c.month ? (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                    {c.month}/{c.year}
                  </span>
                ) : (
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                    Fixo
                  </span>
                )}

                {/* Account specification */}
                {c.account && (
                  <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-lg text-[11px] font-medium">
                    <Wallet className="w-3 h-3 text-slate-400" />
                    {c.account}
                  </span>
                )}

                {/* Status indicator - Click to Toggle */}
                <button
                  type="button"
                  onClick={() => toggleStatus(c)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer hover:brightness-95 active:scale-95",
                    (c.status || "pago") === "pago"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                      : "bg-amber-50 text-amber-700 border-amber-150",
                  )}
                  title="Clique para alternar Pago / Pendente"
                >
                  {(c.status || "pago") === "pago" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Pago
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      Pendente
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                <span className="font-bold text-slate-800">
                  {formatMoneyUI(c.amount, hideFinance)}
                </span>
                <button
                  onClick={() => removeCost(c.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {filteredCosts.length === 0 && (
        <div className="text-center py-4 text-slate-500 text-sm">
          Nenhum registro encontrado para este filtro.
        </div>
      )}
    </div>
  );
}

const TabHeader = ({ icon: Icon, title, description, badge }: any) => (
  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-[rgb(var(--theme-primary))]">
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 bg-[rgba(var(--theme-primary),0.1)] text-[rgb(var(--theme-primary))] text-xs font-medium rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const uploadMultipartToDrive = async (
  token: string,
  filename: string,
  mimeType: string,
  content: any,
  fields: string = "id,webViewLink"
): Promise<Response> => {
  const boundary = "314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const metadata = {
    name: filename,
    mimeType: mimeType,
  };

  const metadataPart = [
    delimiter,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(metadata),
  ].join("");

  const mediaPartHeader = [
    delimiter,
    "Content-Type: " + mimeType + "\r\n\r\n",
  ].join("");

  const body = new Blob([
    metadataPart,
    mediaPartHeader,
    content,
    close_delim
  ], { type: "multipart/related; boundary=" + boundary });

  const url = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart${fields ? `&fields=${fields}` : ""}`;

  return withTimeout(
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: body,
    }),
    20000,
    "Timeout: A conexão com o Google Drive demorou muito."
  );
};

export function Dashboard({ userId, profileData, onUpdateProfile }: any) {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (profileData) {
      const hasSeenTour = profileData.hasSeenTour;
      const localSeen = localStorage.getItem(`has_seen_tour_${userId}`);
      if (!hasSeenTour && !localSeen) {
        setRunTour(true);
      }
    }
  }, [profileData, userId]);

  const handleTourCallback = async (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem(`has_seen_tour_${userId}`, "true");
      try {
        await updateDoc(doc(db, "profiles", userId), {
          hasSeenTour: true,
        });
        if (onUpdateProfile) {
          onUpdateProfile({
            ...profileData,
            hasSeenTour: true,
          });
        }
      } catch (err) {
        console.error("Error updating tour status in Firestore:", err);
      }
    }
  };

  const tourSteps = useMemo(() => [
    {
      target: "body",
      placement: "center" as const,
      title: "🎉 Bem-vindo à ELO!",
      content: "Olá! Vamos fazer um tour guiado rápido de 1 minuto para você conhecer os principais recursos do seu novo consultório virtual.",
    },
    {
      target: "#tour-visao-geral",
      placement: "right" as const,
      title: "📊 Painel de Visão Geral",
      content: "Aqui é o seu ponto de partida. Um resumo completo com seus indicadores financeiros, faturamento consolidado e progresso das configurações de boas-vindas.",
    },
    {
      target: "#tour-visao-geral-faturamento",
      placement: "bottom" as const,
      title: "💰 Faturamento Consolidado",
      content: "Visualize seu faturamento global integrado (valores recebidos e pendentes de pacientes, empresas conveniadas e outras receitas).",
    },
    {
      target: "#tour-visao-geral-metricas",
      placement: "top" as const,
      title: "📈 Indicadores em Tempo Real",
      content: "Veja detalhadamente os recebíveis e as despesas do seu consultório clínico separados por categorias para facilitar sua contabilidade.",
    },
    {
      target: "#tour-ocultar-valores",
      placement: "bottom" as const,
      title: "👁️ Privacidade no Atendimento",
      content: "Caso esteja projetando sua tela ou com o paciente no consultório, clique aqui a qualquer momento para ocultar todos os valores financeiros.",
    },
    {
      target: "#tour-perfil",
      placement: "right" as const,
      title: "⚙️ Seu Perfil e Integrações",
      content: "Cadastre sua foto profissional, biografia, chaves PIX de faturamento, configure modelos de mensagens de WhatsApp e faça a integração com o Google Drive.",
    },
    {
      target: "#tour-servicos",
      placement: "right" as const,
      title: "🔗 Landing Page e Serviços",
      content: "Crie e gerencie os serviços clínicos que você oferece e configure sua página de agendamentos online para novos pacientes.",
    },
    {
      target: "#tour-agenda",
      placement: "right" as const,
      title: "📅 Agenda Digital",
      content: "Monitore e organize seus horários de atendimento, crie bloqueios e gerencie compromissos clínicos diretamente na plataforma.",
    },
    {
      target: "#tour-assinatura",
      placement: "right" as const,
      title: "💳 Seu Plano & Assinatura",
      content: "Acompanhe os detalhes da sua assinatura (Essencial ou Gestão Total). No plano Gestão Total, você tem faturamento ilimitado, relatórios avançados, webhooks e geração automatizada de contratos.",
    },
    {
      target: "body",
      placement: "center" as const,
      title: "🚀 Tudo Pronto!",
      content: "Você está pronto para gerenciar seu consultório. Se precisar de ajuda, acesse a aba 'Suporte' para falar com nossa equipe! Desejamos muito sucesso em sua jornada.",
    }
  ], []);

  const fireWebhook = (event: string, data: any) => {
    if (profileData && profileData.webhookUrl) {
      fetch(profileData.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.warn("Falha ao notificar webhook:", err);
      });
    }
  };

  const [activeServiceTab, setActiveServiceTab] = useState<
    "voce" | "empresa" | "psicologos" | "igrejas"
  >("voce");
  const [showContractEditor, setShowContractEditor] = useState<
    "paciente" | "empresa" | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    | "visao_geral"
    | "pacientes"
    | "empresas"
    | "avaliacoes"
    | "agenda"
    | "perfil"
    | "servicos"
    | "automacoes"
    | "notificacoes"
    | "materiais"
    | "documentos"
    | "suporte"
    | "assinatura"
  >("visao_geral");
  const [clients, setClients] = useState<any[]>([]);
  const isRestrictedByPlan = profileData?.activePlan === "essencial";
  const [hideFinance, setHideFinance] = useState(true);

  const [supportSettings, setSupportSettings] = useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const snap = await getDoc(doc(db, "admin_settings", "support"));
        if (snap.exists()) setSupportSettings(snap.data());
      } catch (e) {
        console.error("Error fetching support settings:", e);
      }
    };
    fetchSupport();
  }, []);

  const [importStatus, setImportStatus] = useState<{
    isOpen: boolean;
    message: string;
    progress: number;
    total: number;
    finished: boolean;
    added: number;
    updated: number;
    sessions: number;
  }>({
    isOpen: false,
    message: "",
    progress: 0,
    total: 0,
    finished: false,
    added: 0,
    updated: 0,
    sessions: 0,
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyAppointments, setCompanyAppointments] = useState<any[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);

  // Browser notifications states & functions
  const [notiPermission, setNotiPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotiPermission(permission);
      return permission;
    }
    return "default";
  };

  const sendBrowserNotification = (
    title: string,
    body: string,
    tabToOnOpen?: string,
  ) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const notification = new Notification(title, {
        body: body,
        icon: "/icon.png",
        tag: title + body,
      });
      notification.onclick = () => {
        window.focus();
        if (tabToOnOpen) {
          setActiveTab(tabToOnOpen as any);
        }
      };
    }
  };

  const billingAccounts = (() => {
    try {
      if (profileData?.billingAccountsStr) {
        return JSON.parse(profileData.billingAccountsStr);
      }
    } catch (e) {
      console.error("Erro ao analisar billingAccountsStr:", e);
    }
    return ["ELO", "MEI Carla", "CPF Marcio", "CPF Carla", "Dinheiro"];
  })();

  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");

  const handleAddBillingAccount = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (billingAccounts.includes(trimmed)) {
      alert("Esta conta/local de faturamento já existe!");
      return;
    }
    const updated = [...billingAccounts, trimmed];
    onUpdateProfile({
      ...profileData,
      billingAccountsStr: JSON.stringify(updated),
    });
    setNewAccountName("");
  };

  const handleDeleteBillingAccount = (name: string) => {
    askConfirm(
      "Excluir Conta de Faturamento",
      `Tem certeza que deseja excluir a conta "${name}" de todas as listas de faturamento?`,
      () => {
        const updated = billingAccounts.filter((acc: string) => acc !== name);
        onUpdateProfile({
          ...profileData,
          billingAccountsStr: JSON.stringify(updated),
        });
      },
    );
  };

  const checkTodayBirthdays = (clientList: any[]) => {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // 1-based
      const dateKey = `${today.getFullYear()}-${currentMonth}-${currentDay}`;

      const storageKey = `notified_birthdays_${userId}_${dateKey}`;
      const notifiedListRaw = localStorage.getItem(storageKey);
      const notifiedIds = notifiedListRaw ? JSON.parse(notifiedListRaw) : [];

      const newNotifiedIds = [...notifiedIds];

      clientList.forEach((client) => {
        if (!client.dob || notifiedIds.includes(client.id)) return;

        // Match DOB (YYYY-MM-DD)
        const parts = client.dob.split("-");
        if (parts.length === 3) {
          const monthPart = parseInt(parts[1], 10);
          const dayPart = parseInt(parts[2], 10);

          if (dayPart === currentDay && monthPart === currentMonth) {
            sendBrowserNotification(
              "🎂 Aniversário Hoje!",
              `Hoje é aniversário de seu paciente ${client.name}! Envie os parabéns.`,
              "pacientes",
            );
            newNotifiedIds.push(client.id);
          }
        } else {
          // DD/MM/YYYY
          const slashParts = client.dob.split("/");
          if (slashParts.length === 3) {
            const dayPart = parseInt(slashParts[0], 10);
            const monthPart = parseInt(slashParts[1], 10);
            if (dayPart === currentDay && monthPart === currentMonth) {
              sendBrowserNotification(
                "🎂 Aniversário Hoje!",
                `Hoje é aniversário de seu paciente ${client.name}! Envie os parabéns.`,
                "pacientes",
              );
              newNotifiedIds.push(client.id);
            }
          }
        }
      });

      if (newNotifiedIds.length !== notifiedIds.length) {
        localStorage.setItem(storageKey, JSON.stringify(newNotifiedIds));
      }
    } catch (e) {
      console.error("Error checking birthdays: ", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        setTimeout(() => {
          Notification.requestPermission().then((permission) => {
            setNotiPermission(permission);
          });
        }, 1500);
      }
    }
  }, []);

  // Profile Editable Form
  const [editForm, setEditForm] = useState(profileData || {});
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [specialtiesText, setSpecialtiesText] = useState(
    (profileData?.specialties || []).join(", "),
  );
  const [approachesText, setApproachesText] = useState(
    (profileData?.approaches || []).join(", "),
  );
  const [saving, setSaving] = useState(false);
  const [widgetSaved, setWidgetSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isConnectingMeet, setIsConnectingMeet] = useState(false);
  const [isConnectingBusiness, setIsConnectingBusiness] = useState(false);

  const getDriveToken = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const stored = localStorage.getItem("google_drive_token");
      if (stored) {
        try {
          const { token, expiresAt } = JSON.parse(stored);
          if (Date.now() < expiresAt) {
            return resolve(token);
          }
        } catch (e) {}
      }

      if (!(window as any).google?.accounts?.oauth2) {
        return reject(new Error("Google OAuth client not loaded"));
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id:
          (import.meta as any).env.VITE_CLIENT_ID ||
          "your-client-id.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email",
        prompt: "select_account",
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!userInfoRes.ok) {
                throw new Error("Não foi possível verificar os dados do seu e-mail do Google.");
              }
              const userInfo = await userInfoRes.json();
              const email = userInfo.email || "";
              
              if (!validateEmailDomain(email)) {
                reject(new Error(`Este serviço só pode ser conectado com um e-mail profissional com o domínio da plataforma (@elosolucoeshumanas.com). Você tentou conectar com o e-mail pessoal: ${email}`));
                return;
              }

              const expiresAt = Date.now() + 3500 * 1000;
              localStorage.setItem(
                "google_drive_token",
                JSON.stringify({ token: response.access_token, email, expiresAt })
              );
              resolve(response.access_token);
            } catch (err: any) {
              reject(err);
            }
          } else {
            reject(new Error("Token não obtido"));
          }
        },
        error_callback: (err: any) => {
          reject(err);
        },
      });
      client.requestAccessToken();
    });
  };

  const handleDriveConnect = async () => {
    setIsConnectingDrive(true);
    try {
      const userEmail = editForm.email || profileData?.email || auth.currentUser?.email || "";
      const isCorporate = validateEmailDomain(userEmail);
      
      if (!isCorporate) {
        const proceed = window.confirm(
          `AVISO DE INTEGRAÇÃO CORPORATIVA:\n\n` +
          `O Google Drive exige conexão com um e-mail profissional com o domínio da plataforma (@elosolucoeshumanas.com ou @elosolucoes.com.br).\n\n` +
          `Identificamos que seu e-mail cadastrado (${userEmail || "não identificado"}) não é corporativo. Se prosseguir, você DEVERÁ obrigatoriamente selecionar ou fazer login em uma conta Google corporativa válida durante o processo.\n\n` +
          `Deseja prosseguir?`
        );
        if (!proceed) {
          setIsConnectingDrive(false);
          return;
        }
      } else {
        const proceed = window.confirm(
          `AVISO DE INTEGRAÇÃO CORPORATIVA:\n\n` +
          `Você iniciará a conexão com o Google Drive.\n` +
          `Certifique-se de escolher exatamente a sua conta profissional (${userEmail}) no painel de login do Google.\n\n` +
          `Deseja prosseguir?`
        );
        if (!proceed) {
          setIsConnectingDrive(false);
          return;
        }
      }

      await getDriveToken();
      const stored = localStorage.getItem("google_drive_token");
      let email = "";
      if (stored) {
        try {
          email = JSON.parse(stored).email || "";
        } catch (e) {}
      }
      setEditForm((prev: any) => ({ ...prev, driveSync: true, driveEmail: email }));
      alert(`Google Drive conectado com sucesso com a conta corporativa ${email}! Lembre-se de salvar suas alterações de perfil.`);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao conectar Google Drive: " + e.message);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleMeetConnect = async () => {
    if (isRestrictedByPlan) {
      alert("A integração com Google Meet, gravação, transcrição e resumos automatizados com domínio corporativo são exclusivas do plano Gestão Total.");
      return;
    }
    setIsConnectingMeet(true);
    try {
      const userEmail = editForm.email || profileData?.email || auth.currentUser?.email || "";
      const isCorporate = validateEmailDomain(userEmail);
      
      if (!isCorporate) {
        const proceed = window.confirm(
          `AVISO DE INTEGRAÇÃO CORPORATIVA:\n\n` +
          `O Google Meet exige conexão com um e-mail profissional com o domínio da plataforma (@elosolucoeshumanas.com ou @elosolucoes.com.br).\n\n` +
          `Identificamos que seu e-mail cadastrado (${userEmail || "não identificado"}) não é corporativo. Se prosseguir, você DEVERÁ obrigatoriamente selecionar ou fazer login em uma conta Google corporativa válida durante o processo.\n\n` +
          `Deseja prosseguir?`
        );
        if (!proceed) {
          setIsConnectingMeet(false);
          return;
        }
      } else {
        const proceed = window.confirm(
          `AVISO DE INTEGRAÇÃO CORPORATIVA:\n\n` +
          `Você iniciará a conexão com o Google Meet.\n` +
          `Certifique-se de escolher exatamente a sua conta profissional (${userEmail}) no painel de login do Google.\n\n` +
          `Deseja prosseguir?`
        );
        if (!proceed) {
          setIsConnectingMeet(false);
          return;
        }
      }

      const { signInAndGetTokenForMeet } = await import("../services/meetService");
      const token = await signInAndGetTokenForMeet();
      const stored = localStorage.getItem("google_meet_token");
      let email = "";
      if (stored) {
        try {
          email = JSON.parse(stored).email || "";
        } catch (e) {}
      }
      setEditForm((prev: any) => ({ ...prev, meetSync: true, meetEmail: email }));
      alert(`Google Meet conectado com sucesso com a conta corporativa ${email}! Lembre-se de salvar suas alterações de perfil.`);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao conectar Google Meet: " + e.message);
    } finally {
      setIsConnectingMeet(false);
    }
  };

  const handleGoogleBusinessConnect = async () => {
    setIsConnectingBusiness(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const email = result.user?.email || "";
      setEditForm((prev: any) => ({
        ...prev,
        googleBusinessSync: true,
        googleBusinessEmail: email,
      }));
      alert(`Google Perfil da Empresa conectado com sucesso com a conta ${email}! Lembre-se de salvar suas alterações de perfil.`);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao conectar Google Perfil da Empresa: " + e.message);
    } finally {
      setIsConnectingBusiness(false);
    }
  };

  const handleCalendarSync = () => {
    setIsSyncing(true);
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id:
          (import.meta as any).env.VITE_CLIENT_ID ||
          "your-client-id.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/calendar.events.readonly",
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const timeMin = new Date();
              const maxDate = new Date();
              maxDate.setDate(maxDate.getDate() + 7);

              const res = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${maxDate.toISOString()}&singleEvents=true`,
                {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                },
              );
              const data = await res.json();
              const events = data.items || [];

              const newSchedule: any = {
                0: [],
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
                6: [],
              };
              const slotsPerDay = [
                "09:00",
                "10:00",
                "11:00",
                "13:00",
                "14:00",
                "15:00",
                "16:00",
                "17:00",
              ];

              for (let i = 0; i < 7; i++) {
                const date = new Date(timeMin);
                date.setDate(date.getDate() + i);
                const dayOfWeek = date.getDay();

                // Default to no weekend slots (unless they configure, but MVP keeps it simple)
                if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                const dayStr = date.toISOString().split("T")[0];
                const busyHours = events
                  .map((ev: any) => {
                    if (!ev.start?.dateTime) return null;
                    if (ev.start.dateTime.startsWith(dayStr)) {
                      return new Date(ev.start.dateTime).getHours();
                    }
                    return null;
                  })
                  .filter((h: any) => h !== null);

                const availableSlots = slotsPerDay.filter((slot) => {
                  const slotHour = parseInt(slot.split(":")[0]);
                  return !busyHours.includes(slotHour);
                });
                newSchedule[dayOfWeek] = availableSlots;
              }

              setEditForm((prev: any) => ({
                ...prev,
                schedule: newSchedule,
                calendarSync: true,
              }));
            } catch (e) {
              console.error("Error fetching calendar", e);
              alert("Erro ao sincronizar eventos do calendário.");
            } finally {
              setIsSyncing(false);
            }
          } else {
            setIsSyncing(false);
          }
        },
        error_callback: () => {
          setIsSyncing(false);
          alert("Permissão negada ou erro na conexão com o Google.");
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error(e);
      setIsSyncing(false);
      alert("Erro ao iniciar conexão com o Google.");
    }
  };

  useEffect(() => {
    // Sync local form state if prop updates
    setEditForm(profileData || {});
    setSpecialtiesText((profileData?.specialties || []).join(", "));
    setApproachesText((profileData?.approaches || []).join(", "));
  }, [profileData]);

  useEffect(() => {
    if (!userId) return;

    // Fetch static dashboard data
    const fetchStaticData = async () => {
      try {
        const [revSnap, compSnap, sigSnap] = await Promise.all([
          getDocs(query(collection(db, `profiles/${userId}/reviews`))),
          getDocs(query(collection(db, `profiles/${userId}/companies`))),
          getDocs(query(collection(db, `profiles/${userId}/signatures`))),
        ]);
        setReviews(revSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCompanies(compSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSignatures(sigSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e: any) {
        console.error("Error fetching static dashboard data:", e);
      }
      
      try {
        const intSnap = await getDocs(query(collection(db, `profiles/${userId}/interactions`)));
        setInteractions(intSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e: any) {
        console.error("Error fetching interactions dashboard data:", e);
      }
    };
    fetchStaticData();

    // 1) Real-time listener for clients
    let isClientsInitial = true;
    const unsubClients = onSnapshot(
      query(collection(db, `profiles/${userId}/clients`)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setClients(list);

        // Check birthdays for today
        checkTodayBirthdays(list);

        if (!isClientsInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const clientData = change.doc.data();
              sendBrowserNotification(
                "👤 Novo Paciente Cadastrado",
                `O paciente ${clientData.name || "Sem nome"} foi adicionado ao sistema.`,
                "pacientes",
              );
            }
          });
        }
        isClientsInitial = false;
      },
      (err) => console.error("Clients listener error:", err),
    );

    // 2) Real-time listener for individual appointments
    let isApptsInitial = true;
    const unsubAppts = onSnapshot(
      query(collection(db, `profiles/${userId}/appointments`)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAppointments(list);

        if (!isApptsInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const apptData = change.doc.data();
              const formattedValue = apptData.totalAmount
                ? ` no valor de R$ ${Number(apptData.totalAmount)}`
                : "";
              sendBrowserNotification(
                "📅 Novo Agendamento Recebido",
                `Consulta de ${apptData.clientName || "Paciente"} agendada${formattedValue}.`,
                "agenda",
              );
            }
          });
        }
        isApptsInitial = false;
      },
      (err) => console.error("Appointments listener error:", err),
    );

    // 3) Real-time listener for company appointments
    let isCompApptsInitial = true;
    const unsubCompAppts = onSnapshot(
      query(collection(db, `profiles/${userId}/companyAppointments`)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCompanyAppointments(list);

        if (!isCompApptsInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const apptData = change.doc.data();
              const formattedValue = apptData.totalAmount
                ? ` no valor de R$ ${Number(apptData.totalAmount)}`
                : "";
              sendBrowserNotification(
                "🏢 Novo Agendamento de Empresa",
                `Agendamento corporativo para ${apptData.companyName || "Empresa"} recebido${formattedValue}.`,
                "empresas",
              );
            }
          });
        }
        isCompApptsInitial = false;
      },
      (err) => console.error("Company appointments listener error:", err),
    );

    // 4) Real-time listener for system notifications
    let isNotifsInitial = true;
    const unsubNotifs = onSnapshot(
      query(collection(db, `profiles/${userId}/system_notifications`)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSystemNotifications(list);

        if (!isNotifsInitial) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const notifData = change.doc.data();
              if (!notifData.isRead) {
                sendBrowserNotification(
                  notifData.title || "🔔 Nova Notificação",
                  notifData.message ||
                    "Você recebeu uma nova notificação do sistema.",
                  "notificacoes",
                );
              }
            }
          });
        }
        isNotifsInitial = false;
      },
      (err) => console.error("System notifications listener error:", err),
    );

    return () => {
      unsubClients();
      unsubAppts();
      unsubCompAppts();
      unsubNotifs();
    };
  }, [userId]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dbRef = doc(db, "profiles", userId);
      const rawPayload: any = {
        ...editForm,
        specialties: specialtiesText
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s),
        approaches: approachesText
          .split(",")
          .map((s: string) => s.trim())
          .filter((s: string) => s),
        materials: (editForm.materials || [])
          .map((m: any) =>
            typeof m === "string" ? { url: m, description: "" } : m,
          )
          .filter((m: any) => m.url.trim() !== ""),
        updatedAt: serverTimestamp(),
      };

      if (isRestrictedByPlan) {
        // Check if restricted fields were changed
        const hasWebhookChanged = editForm.webhookUrl !== (profileData?.webhookUrl || "");
        const hasMaterialsChanged = JSON.stringify(rawPayload.materials) !== JSON.stringify(profileData?.materials || []);
        const hasContractTermsChanged = editForm.contractTerms !== (profileData?.contractTerms || "");
        const hasCompanyContractTermsChanged = editForm.companyContractTerms !== (profileData?.companyContractTerms || "");
        
        if (hasWebhookChanged || hasMaterialsChanged || hasContractTermsChanged || hasCompanyContractTermsChanged) {
          alert("O salvamento de automações (webhooks), materiais de apoio e customização de contratos/termos são exclusivos do plano Gestão Total.");
          setEditForm((prev: any) => ({
            ...prev,
            webhookUrl: profileData?.webhookUrl || "",
            materials: profileData?.materials || [],
            contractTerms: profileData?.contractTerms || "",
            companyContractTerms: profileData?.companyContractTerms || "",
          }));
          setSaving(false);
          return;
        }
      }

      const allowedKeys = [
        "name",
        "title",
        "bio",
        "crp",
        "cpf",
        "email",
        "city",
        "about",
        "specialties",
        "approaches",
        "companyName",
        "cnpj",
        "companyLogo",
        "whatsapp",
        "coverPhoto",
        "profilePhoto",
        "calendarSync",
        "calendarUrl",
        "calendarEmbed",
        "calendarEmail",
        "driveSync",
        "driveEmail",
        "meetSync",
        "meetEmail",
        "googleBusinessSync",
        "googleBusinessEmail",
        "materials",
        "services",
        "schedule",
        "theme",
        "themeColor",
        "inPersonEnabled",
        "address",
        "howToGetThere",
        "googleMapsUrl",
        "googleMapsEmbed",
        "googleReviewsUrl",
        "pixKey",
        "pixQrCode",
        "paymentFlow",
        "instagramUrl",
        "facebookUrl",
        "linkedinUrl",
        "youtubeUrl",
        "tiktokUrl",
        "publicDomain",
        "footerEmail",
        "footerPhone",
        "footerAddress",
        "footerText",
        "patientCostsStr",
        "companyCostsStr",
        "generalCostsStr",
        "generalIncomesStr",
        "contractTerms",
        "companyContractTerms",
        "webhookUrl",
        "updatedAt",
        "isPublicSiteActive",
        "subscriptionStatus",
        "hideReviewsOnSite",
        "useGoogleReviewsWidget",
        "googleReviewsWidgetCode",
        "whatsappReminderTemplate",
        "whatsappFinancialTemplate",
        "whatsappBirthdayTemplate",
        "whatsappOtherTemplate",
        "coverPhotoPosition",
      ];

      const payload: any = {};
      for (const key of allowedKeys) {
        if (rawPayload[key] !== undefined) {
          payload[key] = rawPayload[key];
        }
      }

      await updateDoc(dbRef, payload);
      onUpdateProfile({ ...profileData, ...payload });
      alert("Perfil atualizado com sucesso!");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${userId}`);
    } finally {
      setSaving(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            reject(new Error("Canvas ctx not found"));
          }
        };
        img.onerror = () => reject(new Error("Image load error"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverPhoto" | "profilePhoto" | "companyLogo" | "pixQrCode",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(field);
    try {
      // For cover photo, max 1200x600, for profile photo max 400x400
      const maxWidth = field === "coverPhoto" ? 1200 : 400;
      const maxHeight = field === "coverPhoto" ? 600 : 400;
      const dataUrl = await resizeImage(file, maxWidth, maxHeight);
      let extractedColor = undefined;
      // If uploading cover photo, extract average color!
      if (field === "coverPhoto") {
        try {
          const fac = new FastAverageColor();
          const imgElement = document.createElement("img");
          imgElement.src = dataUrl;
          const color = await fac.getColorAsync(imgElement);
          extractedColor = color.hex;
        } catch (e) {
          console.error("Failed to extract color", e);
        }
      }

      setEditForm((prev) => {
        const updated = { ...prev, [field]: dataUrl };
        if (extractedColor) {
          updated.themeColor = extractedColor;
          if (!updated.theme) updated.theme = "auto";
        }
        return updated;
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert(
        "Erro ao enviar imagem. Verifique as permissões ou tente novamente.",
      );
    } finally {
      setUploadingImage(null);
    }
  };

  const handleReviewAction = async (
    reviewId: string,
    status: "approved" | "hidden",
  ) => {
    try {
      await updateDoc(doc(db, `profiles/${userId}/reviews`, reviewId), {
        status,
      });
      setReviews(
        reviews.map((r) => (r.id === reviewId ? { ...r, status } : r)),
      );
    } catch (e: any) {
      handleFirestoreError(
        e,
        OperationType.UPDATE,
        `profiles/${userId}/reviews/${reviewId}`,
      );
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    askConfirm(
      "Excluir Avaliação",
      "Certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.",
      async () => {
        try {
          await deleteDoc(doc(db, `profiles/${userId}/reviews`, reviewId));
          setReviews(reviews.filter((r) => r.id !== reviewId));
        } catch (e: any) {
          handleFirestoreError(
            e,
            OperationType.DELETE,
            `profiles/${userId}/reviews/${reviewId}`,
          );
        }
      },
    );
  };

  const getPublicLink = (path: string) => {
    let base = profileData?.publicDomain
      ? profileData.publicDomain
      : window.location.origin;
    if (base.endsWith("/")) base = base.slice(0, -1);
    if (!base.startsWith("http")) base = "https://" + base;
    return `${base}${path}`;
  };

  const [clientSearchText, setClientSearchText] = useState("");
  const [showBirthdays, setShowBirthdays] = useState(false);
  const [showInactiveClients, setShowInactiveClients] = useState(false);
  const [companySearchText, setCompanySearchText] = useState("");
  const [showInactiveCompanies, setShowInactiveCompanies] = useState(false);
  const [clientGlobalInvoiceFilter, setClientGlobalInvoiceFilter] = useState<
    "all" | "issued" | "pending"
  >("all");
  const [companyGlobalInvoiceFilter, setCompanyGlobalInvoiceFilter] = useState<
    "all" | "issued" | "pending"
  >("all");

  const [globalBillingFilter, setGlobalBillingFilter] = useState<
    "all" | "paid" | "pending"
  >("all");

  const [pacientesBillingFilter, setPacientesBillingFilter] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [empresasBillingFilter, setEmpresasBillingFilter] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [filterMonths, setFilterMonths] = useState<number[]>([
    new Date().getMonth(),
  ]);
  const [filterYear, setFilterYear] = useState<number>(
    new Date().getFullYear(),
  );

  const appointmentsInPeriod = appointments.filter((appt) => {
    if (!appt.datetime) return false;
    const date = new Date(appt.datetime);
    return (
      filterMonths.includes(date.getMonth()) &&
      date.getFullYear() === filterYear
    );
  });

  const companyAppointmentsInPeriod = companyAppointments.filter((appt) => {
    if (!appt.datetime) return false;
    const date = new Date(appt.datetime);
    return (
      filterMonths.includes(date.getMonth()) &&
      date.getFullYear() === filterYear
    );
  });

  const clientsInPeriod = clients.filter((c) => {
    const dStr = c.entryDate || c.createdAt;
    if (!dStr) return true;
    const date = new Date(dStr || "");
    if (isNaN(date.getTime())) return true;
    const month =
      typeof dStr === "string" && !dStr.includes("T")
        ? date.getUTCMonth()
        : date.getMonth();
    const year =
      typeof dStr === "string" && !dStr.includes("T")
        ? date.getUTCFullYear()
        : date.getFullYear();
    return filterMonths.includes(month) && year === filterYear;
  });

  const totalPendingInPeriod = appointmentsInPeriod
    .filter((a) => (a.paymentStatus || "pending") === "pending")
    .reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);

  const totalCompanyPendingInPeriod = companyAppointmentsInPeriod
    .filter((a) => (a.paymentStatus || "pending") === "pending")
    .reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);

  const totalPaidInPeriod = appointmentsInPeriod
    .filter((a) => (a.paymentStatus || "pending") === "paid")
    .reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);

  const totalByBillingAccount = appointmentsInPeriod.reduce(
    (acc, a) => {
      if ((a.paymentStatus || "pending") === "paid") {
        const account = a.billingAccount || "Não informado";
        acc[account] = (acc[account] || 0) + Number(a.totalAmount || 0);
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalCompanyPaidInPeriod = companyAppointmentsInPeriod
    .filter((a) => (a.paymentStatus || "pending") === "paid")
    .reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);

  const totalCompanyByBillingAccount = companyAppointmentsInPeriod.reduce(
    (acc, a) => {
      if ((a.paymentStatus || "pending") === "paid") {
        const account = a.billingAccount || "Não informado";
        acc[account] = (acc[account] || 0) + Number(a.totalAmount || 0);
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const clientIdsWithBillingFilter = new Set(
    appointmentsInPeriod
      .filter((a) =>
        globalBillingFilter === "all"
          ? true
          : (a.paymentStatus || "pending") === globalBillingFilter,
      )
      .map((a) => a.clientId),
  );

  const clientIdsWithInvoiceFilter = new Set(
    appointmentsInPeriod
      .filter((a) =>
        clientGlobalInvoiceFilter === "all"
          ? true
          : (a.invoiceStatus || "pending") === clientGlobalInvoiceFilter,
      )
      .map((a) => a.clientId),
  );

  const companyIdsWithBillingFilter = new Set(
    companyAppointmentsInPeriod
      .filter((a) =>
        globalBillingFilter === "all"
          ? true
          : (a.paymentStatus || "pending") === globalBillingFilter,
      )
      .map((a) => a.companyId),
  );

  const companyIdsWithInvoiceFilter = new Set(
    companyAppointmentsInPeriod
      .filter((a) =>
        companyGlobalInvoiceFilter === "all"
          ? true
          : (a.invoiceStatus || "pending") === companyGlobalInvoiceFilter,
      )
      .map((a) => a.companyId),
  );

  const clientIdsWithPacientesBillingFilter = new Set(
    appointmentsInPeriod
      .filter((a) =>
        pacientesBillingFilter === "all"
          ? true
          : (a.paymentStatus || "pending") === pacientesBillingFilter,
      )
      .map((a) => a.clientId),
  );

  const companyIdsWithEmpresasBillingFilter = new Set(
    companyAppointmentsInPeriod
      .filter((a) =>
        empresasBillingFilter === "all"
          ? true
          : (a.paymentStatus || "pending") === empresasBillingFilter,
      )
      .map((a) => a.companyId),
  );

  const filteredClients = clients.filter((client) => {
    if (!showInactiveClients && client.isActive === false) return false;

    const searchLower = clientSearchText.toLowerCase();
    const matchesSearch = !searchLower ||
      (client.name || "").toLowerCase().includes(searchLower) ||
      (client.email || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (showBirthdays) {
      if (!client.dob) return false;
      const currentMonth = new Date().getMonth();
      const [, month] = client.dob.split("-");
      const clientMonth = parseInt(month, 10) - 1;
      if (clientMonth !== currentMonth) return false;
    }

    // Se houver busca, ignoramos o filtro de período para permitir encontrar o paciente de qualquer época
    if (!searchLower) {
      // Apply Global Period Filter (Must have appointment in period OR be registered in period)
      const hasApptInPeriod = appointmentsInPeriod.some(
        (a) => a.clientId === client.id,
      );
      const isRegisteredInPeriod = clientsInPeriod.some(
        (c) => c.id === client.id,
      );
      if (!hasApptInPeriod && !isRegisteredInPeriod) return false;
    }

    if (globalBillingFilter !== "all") {
      if (!clientIdsWithBillingFilter.has(client.id)) return false;
    }

    if (pacientesBillingFilter !== "all") {
      if (!clientIdsWithPacientesBillingFilter.has(client.id)) return false;
    }

    if (clientGlobalInvoiceFilter !== "all") {
      if (!clientIdsWithInvoiceFilter.has(client.id)) return false;
    }

    return true;
  });

  const filteredCompanies = companies.filter((company) => {
    if (!showInactiveCompanies && company.isActive === false) return false;

    const searchLower = companySearchText.toLowerCase();
    const matchesSearch = !searchLower ||
      (company.name || "").toLowerCase().includes(searchLower) ||
      (company.email || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (globalBillingFilter !== "all") {
      if (!companyIdsWithBillingFilter.has(company.id)) return false;
    }

    if (empresasBillingFilter !== "all") {
      if (!companyIdsWithEmpresasBillingFilter.has(company.id)) return false;
    }

    if (companyGlobalInvoiceFilter !== "all") {
      if (!companyIdsWithInvoiceFilter.has(company.id)) return false;
    }

    return true;
  });

  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientEditForm, setClientEditForm] = useState<any>({});
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyEditForm, setCompanyEditForm] = useState<any>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  const [readjustmentConfirmModal, setReadjustmentConfirmModal] = useState<{
    isOpen: boolean;
    entity: any;
    type: "client" | "company" | null;
  }>({ isOpen: false, entity: null, type: null });
  const [readjustmentPercent, setReadjustmentPercent] = useState<string>("");
  const [readjustmentNewValue, setReadjustmentNewValue] = useState<string>("");
  const [readjustmentNotes, setReadjustmentNotes] = useState<string>("");

  const askConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(
    null,
  );
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editingCompanyAppointmentId, setEditingCompanyAppointmentId] =
    useState<string | null>(null);
  const [appointmentEditForm, setAppointmentEditForm] = useState<any>({});
  const [companyAppointmentEditForm, setCompanyAppointmentEditForm] =
    useState<any>({});
  const [sessionFilter, setSessionFilter] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [companySessionInvoiceFilter, setCompanySessionInvoiceFilter] =
    useState<"all" | "issued" | "pending">("all");
  const [sessionMonthFilter, setSessionMonthFilter] = useState<number | "all">(
    "all",
  );
  const [sessionYearFilter, setSessionYearFilter] = useState<number | "all">(
    "all",
  );
  const [uploadingAppointmentId, setUploadingAppointmentId] = useState<
    string | null
  >(null);
  const [uploadingClientId, setUploadingClientId] = useState<string | null>(null);

  const [notificationModalClient, setNotificationModalClient] = useState<
    any | null
  >(null);
  const [notificationTemplate, setNotificationTemplate] = useState<
    | "financial"
    | "referral"
    | "reminder"
    | "receipt"
    | "invoice"
    | "birthday"
    | "readjustment"
    | "other"
  >("financial");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [receiptSessionIds, setReceiptSessionIds] = useState<string[]>([]);
  const [selectedMaterialIndices, setSelectedMaterialIndices] = useState<
    number[]
  >([]);
  const [notificationSubject, setNotificationSubject] = useState("");

  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleOpenNotification = (client: any) => {
    setNotificationModalClient(client);
    handleTemplateChange("financial", client);
  };

  const handleTemplateChange = (
    template:
      | "financial"
      | "referral"
      | "reminder"
      | "receipt"
      | "invoice"
      | "birthday"
      | "readjustment"
      | "other",
    client: any,
  ) => {
    setNotificationTemplate(template);
    setSelectedMaterialIndices([]);
    setReceiptSessionIds([]);
    const firstName = client.name ? client.name.split(" ")[0] : "Paciente";
    const fullName = client.name || "Paciente";

    // Find next scheduled appointment for datetime replacement
    const clientAppts = appointments.filter((a) => a.clientId === client.id);
    const nextAppt = clientAppts
      .filter((a) => !a.status || a.status === "scheduled")
      .sort((a, b) => {
        const da = !isNaN(new Date(a.datetime).getTime())
          ? new Date(a.datetime).getTime()
          : 0;
        const db = !isNaN(new Date(b.datetime).getTime())
          ? new Date(b.datetime).getTime()
          : 0;
        return da - db;
      })[0];

    let apptDate = "___/___/_____";
    let apptTime = "__:__";
    if (nextAppt && nextAppt.datetime) {
      const dt = new Date(nextAppt.datetime);
      if (!isNaN(dt.getTime())) {
        apptDate = format(dt, "dd/MM/yyyy");
        apptTime = nextAppt.time || format(dt, "HH:mm");
      }
    }

    // Find pending value
    const pendingAppts = clientAppts.filter(
      (a) => (a.paymentStatus || "pending") === "pending",
    );
    const totalPending = pendingAppts.reduce(
      (acc, curr) => acc + Number(curr.totalAmount || 0),
      0,
    );
    const valorPending = totalPending;

    const replaceTags = (text: string) => {
      if (!text) return "";
      return text
        .replace(/{nome}/g, firstName)
        .replace(/{nome_completo}/g, fullName)
        .replace(/{data}/g, apptDate)
        .replace(/{hora}/g, apptTime)
        .replace(/{valor}/g, valorPending)
        .replace(/{pix}/g, profileData?.pixKey || "SUA_CHAVE_PIX_AQUI")
        .replace(/{meunome}/g, profileData?.name || "Psicólogo(a)");
    };

    if (template === "financial") {
      setNotificationSubject("Fechamento Financeiro - Sessões de Psicologia");
      if (profileData?.whatsappFinancialTemplate) {
        setNotificationMessage(
          replaceTags(profileData.whatsappFinancialTemplate),
        );
      } else {
        setNotificationMessage(
          `Olá ${firstName},\n\nSegue o resumo do nosso fechamento financeiro.\nO valor total de sessões pendentes é de R$ ${totalPending}.\n\nPode ser transferido para o Pix: ${profileData?.pixKey || "SUA_CHAVE_PIX_AQUI"}\n\nQualquer dúvida, estou à disposição.\n\nAbraço,\n${profileData?.name || "Psicólogo(a)"}`,
        );
      }
    } else if (template === "receipt") {
      setNotificationSubject("Recibo de Sessão");
      setNotificationMessage(
        `Olá ${firstName},\n\nSegue o recibo referente às sessões realizadas:\n\nTotal: R$ 0,00\n\nAgradeço a confiança,\n${profileData?.name || "Psicólogo(a)"}`,
      );
      setReceiptSessionIds([]);
    } else if (template === "invoice") {
      setNotificationSubject("Nota Fiscal Emitida");
      const profName = profileData?.name || "Nome do Profissional";
      const profTitle = profileData?.title || "Título do cargo";
      const profCrp = profileData?.crp ? `CRP: ${profileData.crp}` : "CRP";
      setNotificationMessage(
        `${profName}\n` +
        `${profTitle}\n` +
        `${profCrp}\n\n` +
        `Nota emitida referente às seguintes sessões de Psicoterapia realizadas na modalidade remota (online):\n\n` +
        `Total: R$ 0,00`
      );
      setReceiptSessionIds([]);
    } else if (template === "referral") {
      setNotificationSubject("Encaminhamento / Documentos");
      setNotificationMessage(
        `Olá ${firstName},\n\nSegue em anexo o documento / encaminhamento conversado em nossa sessão.\n\nAbraço,\n${profileData?.name || "Psicólogo(a)"}`,
      );
    } else if (template === "reminder") {
      setNotificationSubject("Lembrete de Sessão");
      if (profileData?.whatsappReminderTemplate) {
        setNotificationMessage(
          replaceTags(profileData.whatsappReminderTemplate),
        );
      } else {
        setNotificationMessage(
          `Olá ${firstName},\n\nPassando para confirmar a nossa próxima sessão!\n\nAbraço,\n${profileData?.name || "Psicólogo(a)"}`,
        );
      }
    } else if (template === "birthday") {
      setNotificationSubject("Feliz Aniversário!");
      if (profileData?.whatsappBirthdayTemplate) {
        setNotificationMessage(
          replaceTags(profileData.whatsappBirthdayTemplate),
        );
      } else {
        setNotificationMessage(
          `Olá ${firstName}!\n\nPassando para lhe desejar um feliz aniversário! Muita paz, saúde, felicidade e realizações em sua jornada. Que o seu dia seja repleto de sorrisos!\n\nAbraço,\n${profileData?.name || "Psicólogo(a)"}`,
        );
      }
    } else if (template === "readjustment") {
      setNotificationSubject("Reajuste Anual de Honorários");
      setNotificationMessage(
        `Olá ${firstName},\n\nPassando para informar que, conforme nosso contrato e/ou tempo de acompanhamento (anual), no próximo mês haverá o reajuste anual dos honorários das sessões. O objetivo desse reajuste é manter a qualidade do suporte, acompanhar a atualização da inflação e os novos investimentos em formação contínua.\n\nFico à disposição caso tenha alguma dúvida sobre os novos valores.\n\nAbraço,\n${profileData?.name || "Psicólogo(a)"}`,
      );
    } else {
      setNotificationSubject("Contato");
      if (profileData?.whatsappOtherTemplate) {
        setNotificationMessage(replaceTags(profileData.whatsappOtherTemplate));
      } else {
        setNotificationMessage(`Olá ${firstName},\n\n`);
      }
    }
  };

  const handleAddCompanySession = (companyId: string, companyName: string) => {
    setEditingCompanyAppointmentId("new");
    setCompanyAppointmentEditForm({
      companyId,
      companyName,
      date: new Date().toISOString().slice(0, 10),
      hoursQty: 1,
      status: "scheduled",
      totalAmount: 0,
      paymentStatus: "pending",
      invoiceStatus: "pending",
      serviceDescription: "",
    });
  };

  const handleDuplicateLastCompanySession = (
    companyId: string,
    companyName: string,
  ) => {
    const compAppts = companyAppointments
      .filter((a) => a.companyId === companyId)
      .sort((a, b) => {
        const da = !isNaN(new Date(a.datetime).getTime())
          ? new Date(a.datetime).getTime()
          : 0;
        const db = !isNaN(new Date(b.datetime).getTime())
          ? new Date(b.datetime).getTime()
          : 0;
        return db - da;
      });
    if (compAppts.length === 0) {
      alert("Não há serviços anteriores para duplicar.");
      return;
    }
    const lastSession = compAppts[0];
    setEditingCompanyAppointmentId("new");
    setCompanyAppointmentEditForm({
      companyId,
      companyName,
      date: new Date().toISOString().slice(0, 10),
      hoursQty: lastSession.hoursQty || 1,
      serviceId: lastSession.serviceId || null,
      serviceName: lastSession.serviceName || "",
      status: lastSession.status || "scheduled",
      totalAmount: lastSession.totalAmount || 0,
      paymentStatus: lastSession.paymentStatus || "pending",
      invoiceStatus: lastSession.invoiceStatus || "pending",
      serviceDescription: lastSession.serviceDescription || "",
      modality: lastSession.modality || "",
      billingAccount: lastSession.billingAccount || "",
      priceAdjust: lastSession.priceAdjust || "",
    });
  };

  const handleEditCompanySession = (appt: any) => {
    setEditingCompanyAppointmentId(appt.id);
    const dateObj = new Date(appt.datetime);
    setCompanyAppointmentEditForm({
      ...appt,
      date: dateObj.toISOString().slice(0, 10),
      time: dateObj.toTimeString().slice(0, 5),
    });
  };

  const handleAddSession = (clientId: string, clientName: string) => {
    setEditingAppointmentId("new");
    setAppointmentEditForm({
      clientId,
      clientName,
      date: new Date().toISOString().slice(0, 10),
      hoursQty: 1,
      status: "completed",
      paymentStatus: "pending",
      invoiceStatus: "pending",
      totalAmount: profileData?.services?.[0]?.price || 0,
      notes: "",
    });
  };

  const handleDuplicateLastSession = (clientId: string, clientName: string) => {
    const clientAppts = appointments
      .filter((a) => a.clientId === clientId)
      .sort((a, b) => {
        const da = !isNaN(new Date(a.datetime).getTime())
          ? new Date(a.datetime).getTime()
          : 0;
        const db = !isNaN(new Date(b.datetime).getTime())
          ? new Date(b.datetime).getTime()
          : 0;
        return db - da;
      });
    if (clientAppts.length === 0) {
      alert("Não há serviços anteriores para duplicar.");
      return;
    }
    const lastSession = clientAppts[0];
    setEditingAppointmentId("new");
    setAppointmentEditForm({
      clientId,
      clientName,
      date: new Date().toISOString().slice(0, 10),
      hoursQty: lastSession.hoursQty || 1,
      serviceId: lastSession.serviceId || null,
      serviceName: lastSession.serviceName || "",
      status: lastSession.status || "completed",
      paymentStatus: lastSession.paymentStatus || "pending",
      invoiceStatus: lastSession.invoiceStatus || "pending",
      totalAmount: lastSession.totalAmount || 0,
      notes: lastSession.notes || "",
      modality: lastSession.modality || "",
      billingAccount: lastSession.billingAccount || "",
      priceAdjust: lastSession.priceAdjust || "",
    });
  };

  const handleEditSession = (appt: any) => {
    setEditingAppointmentId(appt.id);
    const dt = new Date(appt.datetime);
    setAppointmentEditForm({
      ...appt,
      date: dt.toISOString().slice(0, 10),
      time: dt.toISOString().slice(11, 16),
    });
  };

  const handleCompanyAppointmentSave = async (
    e: React.FormEvent,
    companyId: string,
  ) => {
    e.preventDefault();
    try {
      const payload = { ...companyAppointmentEditForm, companyId };

      if (!payload.date) {
        return;
      }

      const datetime = `${payload.date}T00:00:00`;
      payload.datetime = datetime;
      delete payload.date;
      delete payload.time;
      delete payload.id;

      if (editingCompanyAppointmentId === "new") {
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(
          collection(db, `profiles/${userId}/companyAppointments`),
          payload,
        );
        const newAppt = {
          id: docRef.id,
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setCompanyAppointments([...companyAppointments, newAppt]);
        fireWebhook("company_appointment_created", newAppt);
      } else {
        const updatePayload = {
          datetime: payload.datetime,
          status: payload.status,
          paymentStatus: payload.paymentStatus,
          invoiceStatus: payload.invoiceStatus || "pending",
          serviceDescription:
            payload.serviceDescription || payload.serviceName || "",
          serviceId: payload.serviceId || null,
          hoursQty: payload.hoursQty || 1,
          totalAmount: payload.totalAmount,
          notes: payload.notes || "",
          companyName: payload.companyName,
          modality: payload.modality || "",
          billingAccount: payload.billingAccount || "",
          priceAdjust: payload.priceAdjust || "",
        };
        await updateDoc(
          doc(
            db,
            `profiles/${userId}/companyAppointments/${editingCompanyAppointmentId}`,
          ),
          updatePayload,
        );
        setCompanyAppointments(
          companyAppointments.map((a) =>
            a.id === editingCompanyAppointmentId
              ? { ...a, ...updatePayload }
              : a,
          ),
        );
        fireWebhook("company_appointment_updated", {
          id: editingCompanyAppointmentId,
          ...updatePayload,
        });
      }
      setEditingCompanyAppointmentId(null);
    } catch (error: any) {
      handleFirestoreError(
        error,
        editingCompanyAppointmentId === "new"
          ? OperationType.CREATE
          : OperationType.UPDATE,
        `profiles/${userId}/companyAppointments`,
      );
    }
  };

  const handleClientInvoiceStatusChange = async (
    apptId: string,
    newStatus: string,
  ) => {
    try {
      await updateDoc(doc(db, `profiles/${userId}/appointments/${apptId}`), {
        invoiceStatus: newStatus,
      });
      setAppointments(
        appointments.map((a) =>
          a.id === apptId ? { ...a, invoiceStatus: newStatus } : a,
        ),
      );
    } catch (error: any) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `profiles/${userId}/appointments/${apptId}`,
      );
    }
  };

  const handleCompanyInvoiceStatusChange = async (
    apptId: string,
    newStatus: string,
  ) => {
    try {
      await updateDoc(
        doc(db, `profiles/${userId}/companyAppointments/${apptId}`),
        { invoiceStatus: newStatus },
      );
      setCompanyAppointments(
        companyAppointments.map((a) =>
          a.id === apptId ? { ...a, invoiceStatus: newStatus } : a,
        ),
      );
    } catch (error: any) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `profiles/${userId}/companyAppointments/${apptId}`,
      );
    }
  };

  const handleClientPaymentStatusChange = async (
    apptId: string,
    newStatus: string,
  ) => {
    try {
      await updateDoc(doc(db, `profiles/${userId}/appointments/${apptId}`), {
        paymentStatus: newStatus,
      });
      setAppointments(
        appointments.map((a) =>
          a.id === apptId ? { ...a, paymentStatus: newStatus } : a,
        ),
      );
    } catch (error: any) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `profiles/${userId}/appointments/${apptId}`,
      );
    }
  };

  const handleCompanyPaymentStatusChange = async (
    apptId: string,
    newStatus: string,
  ) => {
    try {
      await updateDoc(
        doc(db, `profiles/${userId}/companyAppointments/${apptId}`),
        { paymentStatus: newStatus },
      );
      setCompanyAppointments(
        companyAppointments.map((a) =>
          a.id === apptId ? { ...a, paymentStatus: newStatus } : a,
        ),
      );
    } catch (error: any) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `profiles/${userId}/companyAppointments/${apptId}`,
      );
    }
  };

  const handleCompanyFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    appointmentId: string,
  ) => {
    const target = e.target;
    const file = target.files && target.files[0];
    if (!file) return;

    try {
      setUploadingAppointmentId(appointmentId);
      let downloadURL = "";
      let useFirebaseFallback = true;
      let driveToken = "";

      if (profileData?.driveSync) {
        try {
          driveToken = await getDriveToken();
          if (driveToken) {
            useFirebaseFallback = false;
          }
        } catch (authError: any) {
          console.error("Erro auth Drive:", authError);
          alert("Sua sessão do Google Drive expirou ou falhou. O arquivo será salvo no sistema local. Por favor, reconecte o Drive na aba Perfil.");
        }
      }

      if (!useFirebaseFallback && driveToken) {
        // Upload to Google Drive
        const res = await uploadMultipartToDrive(
          driveToken,
          file.name,
          file.type || "application/octet-stream",
          file,
          "id,webViewLink"
        );

        if (!res.ok) throw new Error("Falha no upload para o Drive.");
        const data = await res.json();
        downloadURL = data.webViewLink;
      } 
      
      if (useFirebaseFallback || !downloadURL) {
        if (file.size > 800 * 1024) {
          throw new Error("Arquivo muito grande para o armazenamento padrão. Conecte o Google Drive na aba Integrações (Perfil) para enviar arquivos maiores que 800KB.");
        }
        downloadURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Erro ao ler o arquivo para base64."));
        });
      }

      const appointment = companyAppointments.find(
        (a) => a.id === appointmentId,
      );
      const documents = [...(appointment?.documents || [])];
      documents.push({ name: file.name, url: downloadURL });

      const appointmentRef = doc(
        db,
        `profiles/${userId}/companyAppointments/${appointmentId}`,
      );
      await updateDoc(appointmentRef, { documents });

      setCompanyAppointments(
        companyAppointments.map((a) =>
          a.id === appointmentId ? { ...a, documents } : a,
        ),
      );
    } catch (error: any) {
      console.error(error);
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.message !== "Login process cancelled by user."
      ) {
        alert(
          "Erro ao fazer upload do arquivo da empresa. (" + (error.message || error.code || "Desconhecido") + ")"
        );
      }
    } finally {
      setUploadingAppointmentId(null);
      if (target) target.value = '';
    }
  };

  const handleCompanyAppointmentDelete = async (apptId: string) => {
    askConfirm(
      "Excluir Faturamento",
      "Tem certeza que deseja excluir este faturamento/serviço?",
      async () => {
        try {
          await deleteDoc(
            doc(db, `profiles/${userId}/companyAppointments/${apptId}`),
          );
          setCompanyAppointments((prev) => {
            const deletedAppt = prev.find((a) => a.id === apptId);
            if (deletedAppt)
              fireWebhook("company_appointment_deleted", deletedAppt);
            return prev.filter((a) => a.id !== apptId);
          });
        } catch (error: any) {
          handleFirestoreError(
            error,
            OperationType.DELETE,
            `profiles/${userId}/companyAppointments/${apptId}`,
          );
        }
      },
    );
  };

  const handleAppointmentSave = async (
    e: React.FormEvent,
    clientId: string,
  ) => {
    e.preventDefault();
    try {
      const payload = { ...appointmentEditForm, clientId };

      if (!payload.date) {
        return;
      }

      // Convert date and time to datetime
      const datetime = `${payload.date}T00:00:00`;
      payload.datetime = datetime;
      delete payload.date;
      delete payload.time;
      delete payload.id;

      if (editingAppointmentId === "new") {
        payload.createdAt = serverTimestamp();
        const docRef = await addDoc(
          collection(db, `profiles/${userId}/appointments`),
          payload,
        );
        const newAppt = {
          id: docRef.id,
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setAppointments([...appointments, newAppt]);
        fireWebhook("appointment_created", newAppt);
      } else {
        const updatePayload = {
          datetime: payload.datetime,
          status: payload.status,
          paymentStatus: payload.paymentStatus,
          totalAmount: payload.totalAmount,
          notes: payload.notes || "",
          clientName: payload.clientName,
          serviceId: payload.serviceId || null,
          serviceName: payload.serviceName || "",
          hoursQty: payload.hoursQty || 1,
          modality: payload.modality || "",
          billingAccount: payload.billingAccount || "",
          priceAdjust: payload.priceAdjust || "",
        };
        await updateDoc(
          doc(db, `profiles/${userId}/appointments/${editingAppointmentId}`),
          updatePayload,
        );
        setAppointments(
          appointments.map((a) =>
            a.id === editingAppointmentId ? { ...a, ...updatePayload } : a,
          ),
        );
        fireWebhook("appointment_updated", {
          id: editingAppointmentId,
          ...updatePayload,
        });
      }
      setEditingAppointmentId(null);
    } catch (error: any) {
      handleFirestoreError(
        error,
        editingAppointmentId === "new"
          ? OperationType.CREATE
          : OperationType.UPDATE,
        `profiles/${userId}/appointments`,
      );
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    appointmentId: string,
  ) => {
    const target = e.target;
    const file = target.files && target.files[0];
    if (!file) return;

    try {
      setUploadingAppointmentId(appointmentId);
      let downloadURL = "";
      let useFirebaseFallback = true;
      let driveToken = "";

      if (profileData?.driveSync) {
        try {
          driveToken = await getDriveToken();
          if (driveToken) {
            useFirebaseFallback = false;
          }
        } catch (authError: any) {
          console.error("Erro auth Drive:", authError);
          alert("Sua sessão do Google Drive expirou ou falhou. O arquivo será salvo no sistema local. Por favor, reconecte o Drive na aba Perfil.");
        }
      }

      if (!useFirebaseFallback && driveToken) {
        // Upload to Google Drive
        const res = await uploadMultipartToDrive(
          driveToken,
          file.name,
          file.type || "application/octet-stream",
          file,
          "id,webViewLink"
        );

        if (!res.ok) throw new Error("Falha no upload para o Drive.");
        const data = await res.json();
        downloadURL = data.webViewLink;
      } 
      
      if (useFirebaseFallback || !downloadURL) {
        if (file.size > 800 * 1024) {
          throw new Error("Arquivo muito grande para o armazenamento padrão. Conecte o Google Drive na aba Integrações (Perfil) para enviar arquivos maiores que 800KB.");
        }
        downloadURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Erro ao ler o arquivo para base64."));
        });
      }

      const appointment = appointments.find((a) => a.id === appointmentId);
      const documents = [...(appointment?.documents || [])];
      documents.push({ name: file.name, url: downloadURL });

      const appointmentRef = doc(
        db,
        `profiles/${userId}/appointments/${appointmentId}`
      );
      await updateDoc(appointmentRef, { documents });

      setAppointments(
        appointments.map((a) =>
          a.id === appointmentId ? { ...a, documents } : a
        )
      );
    } catch (error: any) {
      console.error(error);
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.message !== "Login process cancelled by user."
      ) {
        alert(
          "Erro ao fazer upload do arquivo. (" + (error.message || error.code || "Desconhecido") + ")"
        );
      }
    } finally {
      setUploadingAppointmentId(null);
      if (target) target.value = '';
    }
  };

  const handleClientFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    clientId: string,
  ) => {
    const target = e.target;
    const file = target.files && target.files[0];
    if (!file) return;

    try {
      setUploadingClientId(clientId);
      let downloadURL = "";
      let useFirebaseFallback = true;
      let driveToken = "";

      if (profileData?.driveSync) {
        try {
          driveToken = await getDriveToken();
          if (driveToken) {
            useFirebaseFallback = false;
          }
        } catch (authError: any) {
          console.error("Erro auth Drive:", authError);
          alert("Sua sessão do Google Drive expirou ou falhou. O arquivo será salvo no sistema local. Por favor, reconecte o Drive na aba Perfil.");
        }
      }

      if (!useFirebaseFallback && driveToken) {
        // Upload to Google Drive
        const res = await uploadMultipartToDrive(
          driveToken,
          file.name,
          file.type || "application/octet-stream",
          file,
          "id,webViewLink"
        );

        if (!res.ok) throw new Error("Falha no upload para o Drive.");
        const data = await res.json();
        downloadURL = data.webViewLink;
      } 
      
      if (useFirebaseFallback || !downloadURL) {
        if (file.size > 800 * 1024) {
          throw new Error("Arquivo muito grande para o armazenamento padrão. Conecte o Google Drive na aba Integrações (Perfil) para enviar arquivos maiores que 800KB.");
        }
        downloadURL = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Erro ao ler o arquivo para base64."));
        });
      }

      const client = clients.find((c) => c.id === clientId);
      const documents = [...(client?.documents || [])];
      documents.push({ name: file.name, url: downloadURL });

      const clientRef = doc(db, `profiles/${userId}/clients/${clientId}`);
      await updateDoc(clientRef, { documents });

      setClients(
        clients.map((c) =>
          c.id === clientId ? { ...c, documents } : c
        )
      );
    } catch (error: any) {
      console.error(error);
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.message !== "Login process cancelled by user."
      ) {
        alert(
          "Erro ao enviar arquivo ao Google Drive ou Armazenamento. (" + (error.message || error.code || "Desconhecido") + ")"
        );
      }
    } finally {
      setUploadingClientId(null);
      if (target) target.value = '';
    }
  };

  const handleDeleteAppointmentDocument = async (appointmentId: string, documentIndex: number) => {
    askConfirm(
      "Excluir Anexo",
      "Tem certeza que deseja excluir este anexo da sessão?",
      async () => {
        try {
          const appointment = appointments.find((a) => a.id === appointmentId);
          if (!appointment) return;
          const documents = [...(appointment.documents || [])];
          documents.splice(documentIndex, 1);

          const appointmentRef = doc(db, `profiles/${userId}/appointments/${appointmentId}`);
          await updateDoc(appointmentRef, { documents });

          setAppointments(appointments.map((a) => (a.id === appointmentId ? { ...a, documents } : a)));
        } catch (error) {
          console.error("Erro ao excluir arquivo", error);
          alert("Erro ao excluir o arquivo da sessão.");
        }
      }
    );
  };

  const handleDeleteClientDocument = async (clientId: string, documentIndex: number) => {
    askConfirm(
      "Excluir Anexo",
      "Tem certeza que deseja excluir este anexo do paciente?",
      async () => {
        try {
          const client = clients.find((c) => c.id === clientId);
          if (!client) return;
          const documents = [...(client.documents || [])];
          documents.splice(documentIndex, 1);

          const clientRef = doc(db, `profiles/${userId}/clients/${clientId}`);
          await updateDoc(clientRef, { documents });

          setClients(clients.map((c) => (c.id === clientId ? { ...c, documents } : c)));
        } catch (error) {
          console.error("Erro ao excluir arquivo", error);
          alert("Erro ao excluir o arquivo do paciente.");
        }
      }
    );
  };

  const handleDeleteCompanyAppointmentDocument = async (appointmentId: string, documentIndex: number) => {
    askConfirm(
      "Excluir Anexo",
      "Tem certeza que deseja excluir este anexo?",
      async () => {
        try {
          const appointment = companyAppointments.find((a) => a.id === appointmentId);
          if (!appointment) return;
          const documents = [...(appointment.documents || [])];
          documents.splice(documentIndex, 1);

          const appointmentRef = doc(db, `profiles/${userId}/companyAppointments/${appointmentId}`);
          await updateDoc(appointmentRef, { documents });

          setCompanyAppointments(companyAppointments.map((a) => (a.id === appointmentId ? { ...a, documents } : a)));
        } catch (error) {
          console.error("Erro ao excluir arquivo", error);
          alert("Erro ao excluir o arquivo da empresa.");
        }
      }
    );
  };

  const handleAppointmentDelete = async (apptId: string) => {
    askConfirm(
      "Excluir Sessão",
      "Tem certeza que deseja excluir esta sessão/agendamento?",
      async () => {
        try {
          await deleteDoc(doc(db, `profiles/${userId}/appointments/${apptId}`));
          setAppointments((prev) => {
            const deletedAppt = prev.find((a) => a.id === apptId);
            if (deletedAppt) fireWebhook("appointment_deleted", deletedAppt);
            return prev.filter((a) => a.id !== apptId);
          });
        } catch (e: any) {
          handleFirestoreError(
            e,
            OperationType.DELETE,
            `profiles/${userId}/appointments/${apptId}`,
          );
        }
      },
    );
  };

  const handleClientDelete = async (clientId: string) => {
    if (isRestrictedByPlan) {
      alert("A exclusão de pacientes é uma funcionalidade exclusiva do plano Gestão Total.");
      return;
    }
    askConfirm(
      "Excluir Paciente",
      "Tem certeza que deseja excluir permanentemente este paciente e todos os seus dados?",
      async () => {
        try {
          await deleteDoc(doc(db, `profiles/${userId}/clients/${clientId}`));
          setClients((prev) => {
            const deletedClient = prev.find((c) => c.id === clientId);
            if (deletedClient) fireWebhook("patient_deleted", deletedClient);
            return prev.filter((c) => c.id !== clientId);
          });
        } catch (e: any) {
          handleFirestoreError(
            e,
            OperationType.DELETE,
            `profiles/${userId}/clients/${clientId}`,
          );
        }
      },
    );
  };

  const handleCompanyDelete = async (companyId: string) => {
    if (isRestrictedByPlan) {
      alert("A exclusão de empresas é uma funcionalidade exclusiva do plano Gestão Total.");
      return;
    }
    askConfirm(
      "Excluir Empresa",
      "Tem certeza que deseja excluir permanentemente esta empresa e todos os seus dados?",
      async () => {
        try {
          await deleteDoc(doc(db, `profiles/${userId}/companies/${companyId}`));
          setCompanies((prev) => {
            const deletedCompany = prev.find((c) => c.id === companyId);
            if (deletedCompany) fireWebhook("company_deleted", deletedCompany);
            return prev.filter((c) => c.id !== companyId);
          });
        } catch (e: any) {
          handleFirestoreError(
            e,
            OperationType.DELETE,
            `profiles/${userId}/companies/${companyId}`,
          );
        }
      },
    );
  };

  const handleClientEdit = (client: any) => {
    setEditingClientId(client.id);
    setClientEditForm({ ...client, isActive: client.isActive ?? true });
  };

  const handleCompanyEdit = (company: any) => {
    setEditingCompanyId(company.id);
    setCompanyEditForm({ ...company, isActive: company.isActive ?? true });
  };

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRestrictedByPlan) {
      alert("O cadastro e alteração de empresas é uma funcionalidade exclusiva do plano Gestão Total. Suas alterações não foram salvas.");
      setEditingCompanyId(null);
      return;
    }
    try {
      const payload: any = {
        name: companyEditForm.name,
        tradeName: companyEditForm.tradeName || "",
        cnpj: companyEditForm.cnpj,
        addressStreet: companyEditForm.addressStreet || "",
        addressNumber: companyEditForm.addressNumber || "",
        addressZipcode: companyEditForm.addressZipcode || "",
        addressCity: companyEditForm.addressCity || "",
        contactPerson: companyEditForm.contactPerson,
        department: companyEditForm.department || "",
        email: companyEditForm.email,
        phone: companyEditForm.phone,
        isActive: companyEditForm.isActive,
        notes: companyEditForm.notes || "",
        source: companyEditForm.source || "Outros",
        entryDate:
          companyEditForm.entryDate || new Date().toISOString().split("T")[0],
        annualReadjustmentDate: companyEditForm.annualReadjustmentDate || "",
        lastReadjustmentConfirmedYear: companyEditForm.lastReadjustmentConfirmedYear || null,
        readjustmentHistory: companyEditForm.readjustmentHistory || [],
      };

      if (editingCompanyId === "new") {
        payload.lgpdAccepted = true;
        payload.createdAt = serverTimestamp();
        payload.statusHistory = [
          {
            action: payload.isActive ? "activated" : "inactivated",
            date: new Date().toISOString(),
            reason: "Manual registration by professional",
          },
        ];

        const compRef = await addDoc(
          collection(db, `profiles/${userId}/companies`),
          payload,
        );
        payload.createdAt = new Date().toISOString();
        const newCompany = { id: compRef.id, ...payload };
        setCompanies([...companies, newCompany]);
        setEditingCompanyId(null);
        fireWebhook("company_created", newCompany);
        return;
      }

      const prevCompany = companies.find((c) => c.id === editingCompanyId);
      const isStatusChanged =
        prevCompany && (prevCompany.isActive ?? true) !== payload.isActive;

      if (isStatusChanged) {
        payload.statusHistory = [
          ...(prevCompany.statusHistory || []),
          {
            action: payload.isActive ? "activated" : "inactivated",
            date: new Date().toISOString(),
            reason: "",
          },
        ];
      }

      await updateDoc(
        doc(db, `profiles/${userId}/companies/${editingCompanyId}`),
        payload,
      );
      setCompanies(
        companies.map((c) =>
          c.id === editingCompanyId ? { ...c, ...payload } : c,
        ),
      );
      setEditingCompanyId(null);
      fireWebhook("company_updated", { id: editingCompanyId, ...payload });
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar dados.");
    }
  };

  const [exportFilterType, setExportFilterType] = useState<"all" | "period">("all");
  const [exportFilterMonths, setExportFilterMonths] = useState<number[]>(() => [new Date().getMonth()]);
  const [exportFilterYear, setExportFilterYear] = useState<number>(() => new Date().getFullYear());

  const handleExportCSV = () => {
    setExportModalOpen(true);
  };

  const getExportFilename = () => {
    const now = new Date();
    const ts = format(now, "yyyyMMdd_HHmmss");
    if (exportFilterType === "all") {
      return `backup_pacientes_completo_${ts}.csv`;
    } else {
      const monthStr = exportFilterMonths.map((m) => m + 1).join("-");
      return `backup_pacientes_periodo_${monthStr}_${exportFilterYear}_${ts}.csv`;
    }
  };

  const generateCSVString = () => {
    const filteredAppointments = appointments.filter((a) => {
      if (exportFilterType === "all") return true;
      if (!a.datetime) return false;
      const date = new Date(a.datetime);
      return (
        exportFilterMonths.includes(date.getMonth()) &&
        date.getFullYear() === exportFilterYear
      );
    });

    const headers = [
      "Paciente",
      "Email",
      "Telefone",
      "CPF",
      "Data de Nascimento",
      "Data de Entrada",
      "Frequência",
      "Fonte",
      "Status Cliente",
      "Anotações Cliente",
      "Responsável (Menor/Financeiro)",
      "Telefone do Responsável",
      "CPF do Responsável",
      "E-mail do Responsável",
      "Data de Reajuste Anual",
      "Histórico de Reajustes",
      "Data Sessão",
      "Status Sessão",
      "Pagamento Sessão",
      "Valor Sessão",
      "Serviço",
      "Quantidade de Horas",
      "Modalidade",
      "Conta de Faturamento",
      "Anotações Sessão",
    ];

    const rows: string[][] = [];

    const formatReadjustmentHistory = (history: any[]) => {
      if (!history || history.length === 0) return "";
      return history
        .map((h) => {
          const yr = h.year || "";
          const pct = h.percent || h.aliquot || 0;
          const valBefore = h.valueBefore || 0;
          const valAfter = h.valueAfter || h.newValue || 0;
          const nt = h.notes || "";
          return `${yr}: ${pct}% (R$ ${valBefore} -> R$ ${valAfter})${nt ? ` - ${nt}` : ""}`;
        })
        .join(" | ");
    };

    clients.forEach((c) => {
      const clientAppts = filteredAppointments.filter(
        (a) => a.clientId === c.id,
      );
      const baseClientRow = [
        `"${(c.name || "").replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${(c.phone || "").replace(/"/g, '""')}"`,
        `"${(c.cpf || "").replace(/"/g, '""')}"`,
        `"${(c.dob || "").replace(/"/g, '""')}"`,
        `"${(c.entryDate || "").replace(/"/g, '""')}"`,
        `"${(c.frequency || "Avulso").replace(/"/g, '""')}"`,
        `"${(c.source || "Outros").replace(/"/g, '""')}"`,
        `"${c.isActive ? "Ativo" : "Inativo"}"`,
        `"${(c.notes || "").replace(/"/g, '""')}"`,
        `"${(c.guardianName || "").replace(/"/g, '""')}"`,
        `"${(c.guardianPhone || "").replace(/"/g, '""')}"`,
        `"${(c.guardianCpf || "").replace(/"/g, '""')}"`,
        `"${(c.guardianEmail || "").replace(/"/g, '""')}"`,
        `"${(c.annualReadjustmentDate || "").replace(/"/g, '""')}"`,
        `"${formatReadjustmentHistory(c.readjustmentHistory).replace(/"/g, '""')}"`,
      ];

      if (clientAppts.length === 0) {
        rows.push([...baseClientRow, '""', '""', '""', '""', '""', '""', '""', '""', '""']);
      } else {
        clientAppts
          .sort(
            (a, b) =>
              new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
          )
          .forEach((a) => {
            rows.push([
              ...baseClientRow,
              `"${!isNaN(new Date(a.datetime).getTime()) ? format(new Date(a.datetime), "dd/MM/yyyy HH:mm") : a.datetime}"`,
              `"${a.status}"`,
              `"${a.paymentStatus}"`,
              `"${a.totalAmount}"`,
              `"${(a.serviceName || "").replace(/"/g, '""')}"`,
              `"${a.hoursQty || 1}"`,
              `"${(a.modality || "").replace(/"/g, '""')}"`,
              `"${(a.billingAccount || "").replace(/"/g, '""')}"`,
              `"${(a.notes || "").replace(/"/g, '""')}"`,
            ]);
          });
      }
    });

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  const executeExportCSV = () => {
    if (clients.length === 0) {
      alert("Nenhum paciente para exportar.");
      return;
    }

    const csvContent = generateCSVString();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const filename = getExportFilename();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportModalOpen(false);
  };

  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [isGeneratingMeet, setIsGeneratingMeet] = useState(false);
  const [generatedMeetLink, setGeneratedMeetLink] = useState<string | null>(null);

  const handleCreateGeneralMeet = async () => {
    if (isRestrictedByPlan) {
      alert("A geração de links do Google Meet para vídeo chamadas integradas, gravação e transcrição inteligente são exclusivas do plano Gestão Total.");
      return;
    }
    setIsGeneratingMeet(true);
    setGeneratedMeetLink(null);
    try {
      const uri = await createMeetSpace();
      setGeneratedMeetLink(uri);
      try {
        await navigator.clipboard.writeText(uri);
      } catch (err) {
      }
    } catch (error: any) {
      console.error(error);
      if (error.message !== "Login process cancelled by user.") {
        alert(`Erro ao gerar link do Meet: ${error.message}`);
      }
    } finally {
      setIsGeneratingMeet(false);
    }
  };

  const executeExportToDrive = async () => {
    if (clients.length === 0) {
      alert("Nenhum paciente para exportar.");
      return;
    }
    setIsExportingDrive(true);
    try {
      const token = await getDriveToken();

      if (!token) {
        throw new Error(
          "Não foi possível obter a permissão do Google Drive. O token está vazio.",
        );
      }

      const csvContent = generateCSVString();
      const filename = getExportFilename();

      const res = await uploadMultipartToDrive(
        token,
        filename,
        "text/csv; charset=utf-8",
        csvContent,
        ""
      );

      if (!res.ok) {
        throw new Error(
          "Falha ao fazer upload para o Google Drive. Verifique se possui permissão.",
        );
      }

      alert("Backup salvo com sucesso no seu Google Drive!");
      setExportModalOpen(false);
    } catch (e: any) {
      if (
        e.code === "auth/cancelled-popup-request" ||
        e.code === "auth/popup-closed-by-user" ||
        e.message === "Login process cancelled by user."
      ) {
        // Ignorar
        return;
      }
      if (e.code === "auth/popup-blocked") {
        alert("O seu navegador bloqueou o popup do Google Drive. Por favor, permita popups para este site e tente novamente.");
        return;
      }
      console.error("Erro export drive:", e);
      alert(
        "Erro ao exportar para o Google Drive: " +
          (e.message || "Erro desconhecido."),
      );
    } finally {
      setIsExportingDrive(false);
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    // basic csv parsing to handle quotes
    const parseCSVLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
      return alert("O arquivo parece estar vazio ou inválido.");

    setImportStatus({
      isOpen: true,
      message: "Iniciando importação...",
      progress: 0,
      total: lines.length - 1,
      finished: false,
      added: 0,
      updated: 0,
      sessions: 0,
    });

    let addedCount = 0;
    let updatedCount = 0;
    let sessionCount = 0;

    // Cache of imported/existing clients by name + dob/cpf to group sessions and avoid duplicate clients
    const processedClients = new Map<string, string>(); // key -> clientId

    for (let i = 1; i < lines.length; i++) {
      setImportStatus((prev) => ({
        ...prev,
        progress: i,
        message: `Processando linha ${i} de ${lines.length - 1}...`,
      }));

      // Yield to let React render the progress
      if (i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }

      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) continue;

      let parsedDob = cols[4]?.trim() || "";
      const dobMatch = parsedDob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dobMatch) {
        parsedDob = `${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`;
      }

      const clientPayload: any = {
        name: (cols[0]?.trim() || "").substring(0, 100),
        email: (cols[1]?.trim() || "").substring(0, 100),
        phone: (cols[2]?.trim() || "").substring(0, 20),
        cpf: (cols[3]?.trim() || "").substring(0, 20),
        dob: parsedDob.substring(0, 20),
        frequency: (cols[5]?.trim() || "Avulso").substring(0, 50),
        source: (cols[6]?.trim() || "Outros").substring(0, 150),
        isActive: cols[7]?.trim() !== "Inativo",
        notes: (cols[8]?.trim() || "").substring(0, 5000),
        lgpdAccepted: true,
        rulesAccepted: false,
      };

      if (!clientPayload.name) continue;

      const cleanCpf = clientPayload.cpf
        ? clientPayload.cpf.replace(/\D/g, "")
        : null;
      let uniqueKey = "";
      if (cleanCpf) {
        uniqueKey = `cpf_${cleanCpf}`;
      } else {
        uniqueKey = `name_${clientPayload.name.toLowerCase()}`;
      }

      let clientId = processedClients.get(uniqueKey);

      if (!clientId) {
        // Check if exists in existing clients
        const existing = clients.find((c) => {
          if (cleanCpf && c.cpf) {
            return c.cpf.replace(/\D/g, "") === cleanCpf;
          }
          return (
            c.name.trim().toLowerCase() ===
            clientPayload.name.trim().toLowerCase()
          );
        });

        if (existing) {
          clientId = existing.id;
          processedClients.set(uniqueKey, clientId);
          try {
            // Somente atualizar informações diferentes que não sejam vazias e existam no CSV
            const updatePayload: any = {};
            Object.keys(clientPayload).forEach((key) => {
              if (
                clientPayload[key] !== "" &&
                clientPayload[key] !== undefined &&
                clientPayload[key] !== existing[key as keyof typeof existing]
              ) {
                updatePayload[key] = clientPayload[key];
              }
            });

            // Nunca sobrepor os aceites com falsos do CSV, nem apagar LGPD
            delete updatePayload.lgpdAccepted;
            delete updatePayload.rulesAccepted;

            if (Object.keys(updatePayload).length > 0) {
              await updateDoc(
                doc(db, `profiles/${userId}/clients/${existing.id}`),
                updatePayload,
              );
              setClients((prev) =>
                prev.map((p) =>
                  p.id === existing.id ? { ...p, ...updatePayload } : p,
                ),
              );
              updatedCount++;
            }
          } catch (ex) {}
        } else {
          try {
            clientPayload.createdAt = serverTimestamp();
            const clientRef = await addDoc(
              collection(db, `profiles/${userId}/clients`),
              clientPayload,
            );
            clientPayload.createdAt = new Date().toISOString();
            clientId = clientRef.id;
            processedClients.set(uniqueKey, clientId);
            setClients((prev) => [...prev, { id: clientId, ...clientPayload }]);
            addedCount++;
          } catch (err: any) {
            handleFirestoreError(
              err,
              OperationType.CREATE,
              `profiles/${userId}/clients`,
            );
          }
        }
        if (clientId) processedClients.set(uniqueKey, clientId);
      }

      // Deal with sessions if they exist in the row
      if (clientId && cols.length >= 10 && cols[9] && cols[9].trim()) {
        const dateStr = cols[9].trim(); // "dd/MM/yyyy HH:mm"
        const status = cols[10]?.trim() || "Concluído";
        const paymentStatus = cols[11]?.trim() || "Pago";
        const totalAmountStr = cols[12]?.trim() || "0,00";
        const sessionNotes = cols[13]?.trim() || "";

        let parsedDate = null;
        try {
          // simple parse for dd/MM/yyyy HH:mm
          const parts = dateStr.match(
            /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/,
          );
          if (parts) {
            parsedDate = new Date(
              Number(parts[3]),
              Number(parts[2]) - 1,
              Number(parts[1]),
              Number(parts[4]),
              Number(parts[5]),
            ).toISOString();
          } else {
            // Try fallback naive parse if the string doesn't match brazilian exact format
            const ts = Date.parse(dateStr);
            if (!isNaN(ts)) parsedDate = new Date(ts).toISOString();
          }
        } catch (e) {}

        if (parsedDate) {
          // Check if session already exists for this client at this exact time to prevent duplicates
          // Since `appointments` state might not reflect newly added ones mid-loop easily without extra cache, let's just check state cache
          const existingAppt = appointments.find(
            (a) => a.clientId === clientId && a.datetime === parsedDate,
          );
          const sessionPayload = {
            clientId,
            clientName: clientPayload.name,
            datetime: parsedDate,
            status,
            paymentStatus,
            totalAmount: Number(
              totalAmountStr.replace(",", ".").replace(/[^\d.-]/g, ""),
            ),
            notes: sessionNotes,
          };
          if (!existingAppt) {
            try {
              const sRef = await addDoc(
                collection(db, `profiles/${userId}/appointments`),
                { ...sessionPayload, createdAt: serverTimestamp() },
              );
              setAppointments((prev) => [
                ...prev,
                {
                  id: sRef.id,
                  ...sessionPayload,
                  createdAt: new Date().toISOString(),
                },
              ]);
              sessionCount++;
            } catch (e) {
              handleFirestoreError(
                e,
                OperationType.CREATE,
                `profiles/${userId}/appointments`,
              );
            }
          }
        }
      }
    }

    setImportStatus((prev) => ({
      ...prev,
      finished: true,
      message: "Importação concluída com sucesso!",
      added: addedCount,
      updated: updatedCount,
      sessions: sessionCount,
    }));

    if (e.target) e.target.value = "";
  };

  const handleClientSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRestrictedByPlan) {
      alert("A criação e alteração de pacientes é uma funcionalidade exclusiva do plano Gestão Total. Suas alterações não foram salvas.");
      setEditingClientId(null);
      return;
    }
    try {
      const payload: any = {
        name: clientEditForm.name || "",
        guardianName: clientEditForm.guardianName || "",
        guardianPhone: clientEditForm.guardianPhone || "",
        guardianCpf: clientEditForm.guardianCpf || "",
        guardianEmail: clientEditForm.guardianEmail || "",
        dob: clientEditForm.dob || "",
        cpf: clientEditForm.cpf || "",
        email: clientEditForm.email || "",
        phone: clientEditForm.phone || "",
        isActive: clientEditForm.isActive !== false,
        notes: clientEditForm.notes || "",
        source: clientEditForm.source || "Outros",
        entryDate:
          clientEditForm.entryDate || new Date().toISOString().split("T")[0],
        annualReadjustmentDate: clientEditForm.annualReadjustmentDate || "",
        lastReadjustmentConfirmedYear: clientEditForm.lastReadjustmentConfirmedYear || null,
        readjustmentHistory: clientEditForm.readjustmentHistory || [],
      };

      if (editingClientId === "new") {
        payload.lgpdAccepted = true; // Assumed since professional is registering
        payload.rulesAccepted = false; // By default added by professional doesn't have rules accepted
        payload.createdAt = serverTimestamp();
        payload.statusHistory = [
          {
            action: payload.isActive ? "activated" : "inactivated",
            date: new Date().toISOString(),
            reason: "Manual registration by professional",
          },
        ];

        const clientRef = await addDoc(
          collection(db, `profiles/${userId}/clients`),
          payload,
        );
        payload.createdAt = new Date().toISOString(); // Mock for local state
        const newClient = { id: clientRef.id, ...payload };
        setClients([...clients, newClient]);
        setEditingClientId(null);
        fireWebhook("patient_created", newClient);
        return;
      }

      const prevClient = clients.find((c) => c.id === editingClientId);
      const isStatusChanged =
        prevClient && (prevClient.isActive ?? true) !== payload.isActive;

      if (isStatusChanged) {
        payload.statusHistory = [
          ...(prevClient.statusHistory || []),
          {
            action: payload.isActive ? "activated" : "inactivated",
            date: new Date().toISOString(),
            reason: "",
          },
        ];
      }

      await updateDoc(
        doc(db, `profiles/${userId}/clients/${editingClientId}`),
        payload,
      );
      setClients(
        clients.map((c) =>
          c.id === editingClientId ? { ...c, ...payload } : c,
        ),
      );
      setEditingClientId(null);
      fireWebhook("patient_updated", { id: editingClientId, ...payload });
    } catch (e: any) {
      handleFirestoreError(
        e,
        editingClientId === "new" ? OperationType.CREATE : OperationType.UPDATE,
        `profiles/${userId}/clients/${editingClientId}`,
      );
    }
  };

  const handleConfirmReadjustmentProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    const { entity, type } = readjustmentConfirmModal;
    if (!entity || !type) return;

    try {
      const currentYear = new Date().getFullYear();
      const baseVal = entity.sessionPrice || entity.basePrice || 0;
      
      const newEntry = {
        year: currentYear,
        date: new Date().toISOString(),
        percent: readjustmentPercent ? parseFloat(readjustmentPercent) : 0,
        aliquot: readjustmentPercent ? parseFloat(readjustmentPercent) : 0,
        valueBefore: baseVal,
        newValue: readjustmentNewValue ? parseFloat(readjustmentNewValue) : 0,
        valueAfter: readjustmentNewValue ? parseFloat(readjustmentNewValue) : 0,
        notes: readjustmentNotes || "Reajuste anual confirmado.",
      };

      const prevHistory = entity.readjustmentHistory || [];
      const updatedHistory = [...prevHistory, newEntry];

      const payload = {
        lastReadjustmentConfirmedYear: currentYear,
        readjustmentHistory: updatedHistory,
      };

      if (type === "client") {
        await updateDoc(
          doc(db, `profiles/${userId}/clients/${entity.id}`),
          payload
        );
        setClients(
          clients.map((c) =>
            c.id === entity.id ? { ...c, ...payload } : c
          )
        );
      } else {
        await updateDoc(
          doc(db, `profiles/${userId}/companies/${entity.id}`),
          payload
        );
        setCompanies(
          companies.map((c) =>
            c.id === entity.id ? { ...c, ...payload } : c
          )
        );
      }

      setReadjustmentConfirmModal({ isOpen: false, entity: null, type: null });
      setReadjustmentPercent("");
      setReadjustmentNewValue("");
      setReadjustmentNotes("");
      alert("Processo de reajuste confirmado e registrado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao confirmar reajuste.");
    }
  };

  const readjustmentAlerts = useMemo(() => {
    const alerts: any[] = [];
    const today = new Date();

    const checkAlert = (entity: any, type: string) => {
      if (!entity.entryDate) return;
      const entryParts = entity.entryDate.split("-");
      if (entryParts.length !== 3) return;

      const entryDate = new Date(
        parseInt(entryParts[0]),
        parseInt(entryParts[1]) - 1,
        parseInt(entryParts[2]),
      );
      if (isNaN(entryDate.getTime())) return;

      const currentYear = today.getFullYear();
      let nextAnniv = new Date(
        currentYear,
        entryDate.getMonth(),
        entryDate.getDate(),
      );

      if (nextAnniv.getTime() < today.getTime() - 24 * 60 * 60 * 1000) {
        nextAnniv.setFullYear(currentYear + 1);
      }

      const diffMs = nextAnniv.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const totalTimeMs = today.getTime() - entryDate.getTime();
      const totalTimeDays = Math.ceil(totalTimeMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 30 && diffDays >= 0 && totalTimeDays >= 300) {
        alerts.push({
          id: `readjustment-${entity.id}`,
          title: `Alerta de Reajuste: ${entity.name || entity.tradeName}`,
          message: `O reajuste anual de honorários para ${type === "client" ? "o paciente" : "a empresa"} ${entity.name || entity.tradeName} é no dia ${format(nextAnniv, "dd/MM/yyyy")} (${diffDays} dias).`,
          createdAt: new Date().toISOString(),
          isRead: false,
          isAlert: true,
          client: entity,
        });
      }
    };

    clients.forEach((c) => checkAlert(c, "client"));
    companies.forEach((c) => checkAlert(c, "company"));

    return alerts;
  }, [clients, companies]);

  const allNotifications = useMemo(() => {
    return [...readjustmentAlerts, ...systemNotifications].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  }, [readjustmentAlerts, systemNotifications]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <Joyride
        {...({
          steps: tourSteps,
          run: runTour,
          continuous: true,
          showSkipButton: true,
          showProgress: true,
          callback: handleTourCallback,
          locale: {
            back: "Voltar",
            close: "Fechar",
            last: "Concluir",
            next: "Próximo",
            skip: "Pular"
          },
          styles: {
            options: {
              arrowColor: "#fff",
              backgroundColor: "#fff",
              overlayColor: "rgba(15, 23, 42, 0.65)",
              primaryColor: "#f59e0b",
              textColor: "#1e293b",
              zIndex: 10000,
            },
            tooltipContainer: {
              textAlign: "left",
              fontFamily: "Inter, sans-serif",
              borderRadius: "16px",
            },
            buttonNext: {
              backgroundColor: "#f59e0b",
              color: "#fff",
              fontWeight: "600",
              borderRadius: "8px",
              padding: "8px 16px",
              border: "none",
              cursor: "pointer",
            },
            buttonBack: {
              color: "#64748b",
              fontWeight: "600",
              marginRight: "8px",
              cursor: "pointer",
            },
            buttonSkip: {
              color: "#94a3b8",
              fontWeight: "500",
              cursor: "pointer",
            }
          }
        } as any)}
      />
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 print:hidden">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2 mb-6">
          <button
            id="tour-ocultar-valores"
            onClick={() => setHideFinance(!hideFinance)}
            className="flex items-center justify-center gap-2 p-3 text-sm font-bold text-slate-600 hover:text-slate-800 transition rounded-2xl hover:bg-slate-50"
          >
            {hideFinance ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {hideFinance ? "Mostrar Valores" : "Ocultar Valores"}
          </button>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
          {/* 1. Visão Geral */}
          <button
            id="tour-visao-geral"
            onClick={() => setActiveTab("visao_geral")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "visao_geral"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span>Visão Geral</span>
          </button>

          {/* 2. Meu Perfil */}
          <button
            id="tour-perfil"
            onClick={() => setActiveTab("perfil")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "perfil"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Meu Perfil</span>
          </button>

          {/* 3. Serviços */}
          <button
            id="tour-servicos"
            onClick={() => setActiveTab("servicos")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "servicos"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Link className="w-5 h-5 flex-shrink-0" />
            <span>Serviços</span>
          </button>

          {/* 4. Notificações */}
          <button
            onClick={() => setActiveTab("notificacoes")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "notificacoes"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 flex-shrink-0" />
              <span>Notificações</span>
            </div>
            {systemNotifications.filter((n) => !n.isRead).length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {systemNotifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          {/* 5. Minha Agenda */}
          <button
            id="tour-agenda"
            onClick={() => setActiveTab("agenda")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "agenda"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <CalendarIcon className="w-5 h-5 flex-shrink-0" />
            <span>Minha Agenda</span>
          </button>

          {/* 6. Avaliações */}
          <button
            onClick={() => setActiveTab("avaliacoes")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition flex-1 justify-between",
              activeTab === "avaliacoes"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              <span>Avaliações</span>
            </div>
            {reviews.filter((r) => r.status === "pending").length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {reviews.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>

          {/* 7. Gestão de pacientes e faturamento */}
          <button
            onClick={() => setActiveTab("pacientes")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "pacientes"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 flex-shrink-0" />
              <span>Gestão de pacientes e faturamento</span>
            </div>
            {isRestrictedByPlan && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                🔒 Gestão Total
              </span>
            )}
          </button>

          {/* 8. Gestão de empresas e faturamento */}
          <button
            onClick={() => setActiveTab("empresas")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "empresas"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 flex-shrink-0" />
              <span>Gestão de empresas e faturamento</span>
            </div>
            {isRestrictedByPlan && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                🔒 Gestão Total
              </span>
            )}
          </button>

          {/* 9. Gestão de Materiais */}
          <button
            onClick={() => setActiveTab("materiais")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "materiais"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 flex-shrink-0" />
              <span>Gestão de Materiais</span>
            </div>
            {isRestrictedByPlan && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                🔒 Gestão Total
              </span>
            )}
          </button>

          {/* 10. Gestão de Documents */}
          <button
            onClick={() => setActiveTab("documentos")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "documentos"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span>Gestão de Documents</span>
            </div>
            {isRestrictedByPlan && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                🔒 Gestão Total
              </span>
            )}
          </button>



          {/* 13. Automações */}
          <button
            onClick={() => setActiveTab("automacoes")}
            className={cn(
              "w-full text-left flex items-center justify-between px-4 py-3 rounded-xl font-medium transition",
              activeTab === "automacoes"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 flex-shrink-0" />
              <span>Automações</span>
            </div>
            {isRestrictedByPlan && (
              <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                🔒 Gestão Total
              </span>
            )}
          </button>

          {/* (linha de separação) */}
          <div className="h-px bg-slate-100 my-2"></div>

          {/* Minha Assinatura */}
          <button
            id="tour-assinatura"
            onClick={() => setActiveTab("assinatura")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "assinatura"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <CreditCard className="w-5 h-5 flex-shrink-0" />
            <span>Minha Assinatura</span>
          </button>

          {/* Suporte */}
          <button
            onClick={() => setActiveTab("suporte")}
            className={cn(
              "w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition",
              activeTab === "suporte"
                ? "bg-amber-50 text-amber-500"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LifeBuoy className="w-5 h-5 flex-shrink-0" />
            <span>Suporte</span>
          </button>

          {/* Ver Tour Guiado */}
          <button
            onClick={() => {
              setActiveTab("visao_geral");
              setTimeout(() => {
                setRunTour(true);
              }, 100);
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-xs mt-1"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <span>Ver Tour Guiado</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {["visao_geral", "pacientes", "empresas"].includes(activeTab) && (
          <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-100 flex flex-col gap-4 mb-6 z-20">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                Filtro Global de Período
              </div>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-12 gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl w-full">
                {[
                  "Jan",
                  "Fev",
                  "Mar",
                  "Abr",
                  "Mai",
                  "Jun",
                  "Jul",
                  "Ago",
                  "Set",
                  "Out",
                  "Nov",
                  "Dez",
                ].map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (filterMonths.includes(i)) {
                        if (filterMonths.length > 1)
                          setFilterMonths(filterMonths.filter((x) => x !== i));
                      } else {
                        setFilterMonths([...filterMonths, i]);
                      }
                    }}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border border-transparent border-slate-200 w-full flex items-center justify-center",
                      filterMonths.includes(i)
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "visao_geral" && (
          <div className="space-y-6 animate-in fade-in">
            <TabHeader
              icon={LayoutDashboard}
              title="Visão Geral"
              description="Apresenta o painel resumo onde o profissional consegue visualizar rapidamente seu faturamento (pago vs. pendente) e os principais indicadores do momento."
            />

            {(!profileData?.bio || !profileData?.profilePhoto || !profileData?.driveSync) && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center text-amber-500 flex-shrink-0 mt-1">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="flex-1 w-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Bem-vindo à ELO! Vamos preparar seu consultório virtual.</h3>
                    <p className="text-slate-600 mb-6 text-sm">Para aproveitar ao máximo a plataforma e ganhar tempo na sua rotina clínica, complete os passos abaixo:</p>
                    
                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        {profileData?.bio && profileData?.profilePhoto ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center bg-white flex-shrink-0" />
                        )}
                        <span className={cn("text-sm sm:text-base", profileData?.bio && profileData?.profilePhoto ? "text-slate-400 line-through" : "text-slate-700 font-medium")}>
                          Configure sua Foto e Biografia no Perfil
                        </span>
                        {(!profileData?.bio || !profileData?.profilePhoto) && (
                          <button 
                            onClick={() => setActiveTab('perfil')} 
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto flex-shrink-0"
                          >
                            Configurar
                          </button>
                        )}
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        {profileData?.driveSync ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center bg-white flex-shrink-0" />
                        )}
                        <span className={cn("text-sm sm:text-base flex-1", profileData?.driveSync ? "text-slate-400 line-through" : "text-slate-700 font-medium")}>
                          Integre seu Google Drive para os Resumos Automáticos de Sessão
                        </span>
                        {!profileData?.driveSync && (
                          <button 
                            onClick={() => setActiveTab('perfil')} 
                            className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto flex-shrink-0"
                          >
                            Integrar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
              {(() => {
                let outrasReceitasTotal = 0;
                try {
                  const income = JSON.parse(
                    profileData?.generalIncomesStr || "[]",
                  );
                  const stringMonths = filterMonths.map(
                    (i) =>
                      [
                        "Jan",
                        "Fev",
                        "Mar",
                        "Abr",
                        "Mai",
                        "Jun",
                        "Jul",
                        "Ago",
                        "Set",
                        "Out",
                        "Nov",
                        "Dez",
                      ][i],
                  );
                  const filtered = income.filter((c: any) => {
                    if (!c.month) return true;
                    if (stringMonths.length > 0)
                      return (
                        stringMonths.includes(c.month) &&
                        c.year === filterYear.toString()
                      );
                    return true;
                  });
                  outrasReceitasTotal = filtered.reduce(
                    (a: any, b: any) => a + b.amount,
                    0,
                  );
                } catch {}

                const globalFaturado =
                  totalPaidInPeriod +
                  totalPendingInPeriod +
                  totalCompanyPaidInPeriod +
                  totalCompanyPendingInPeriod +
                  outrasReceitasTotal;

                return (
                  <div id="tour-visao-geral-faturamento" className="bg-white border text-center border-slate-200 rounded-xl p-6 mb-6 shadow-sm flex flex-col items-center justify-center">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Faturamento Global (Total)
                      </h3>
                      <p className="text-4xl font-bold text-slate-900">
                        {formatMoneyUI(globalFaturado, hideFinance)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div id="tour-visao-geral-metricas" className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">
                    Pacientes (Recebido)
                  </h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatMoneyUI(
                      appointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "paid",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                  <p className="text-xs text-red-500 font-medium mt-2">
                    +{" "}
                    {formatMoneyUI(
                      appointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "pending",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}{" "}
                    pendente
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-emerald-800 mb-1">
                    Empresas (Recebido)
                  </h3>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatMoneyUI(
                      companyAppointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "paid",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                  <p className="text-xs text-red-500 font-medium mt-2">
                    +{" "}
                    {formatMoneyUI(
                      companyAppointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "pending",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}{" "}
                    pendente
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-purple-800 mb-1">
                    Outras Receitas
                  </h3>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatMoneyUI(
                      (() => {
                        try {
                          const income = JSON.parse(
                            profileData?.generalIncomesStr || "[]",
                          );
                          const stringMonths = filterMonths.map(
                            (i) =>
                              [
                                "Jan",
                                "Fev",
                                "Mar",
                                "Abr",
                                "Mai",
                                "Jun",
                                "Jul",
                                "Ago",
                                "Set",
                                "Out",
                                "Nov",
                                "Dez",
                              ][i],
                          );
                          const filtered = income.filter((c: any) => {
                            if (!c.month) return true;
                            if (stringMonths.length > 0)
                              return (
                                stringMonths.includes(c.month) &&
                                c.year === filterYear.toString()
                              );
                            return true;
                          });
                          return filtered.reduce(
                            (a: any, b: any) => a + b.amount,
                            0,
                          );
                        } catch {
                          return "0,00";
                        }
                      })(),
                      hideFinance,
                    )}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-red-800 mb-1">
                    Todos os Custos e Despesas
                  </h3>
                  <p className="text-2xl font-bold text-red-900">
                    {formatMoneyUI(
                      (() => {
                        try {
                          const stringMonths = filterMonths.map(
                            (i) =>
                              [
                                "Jan",
                                "Fev",
                                "Mar",
                                "Abr",
                                "Mai",
                                "Jun",
                                "Jul",
                                "Ago",
                                "Set",
                                "Out",
                                "Nov",
                                "Dez",
                              ][i],
                          );

                          let allCosts: any[] = [];
                          try {
                            if (profileData?.generalCostsStr) allCosts = [...allCosts, ...JSON.parse(profileData.generalCostsStr)];
                          } catch(e) {}
                          try {
                            if (profileData?.patientCostsStr) allCosts = [...allCosts, ...JSON.parse(profileData.patientCostsStr)];
                          } catch(e) {}
                          try {
                            if (profileData?.companyCostsStr) allCosts = [...allCosts, ...JSON.parse(profileData.companyCostsStr)];
                          } catch(e) {}

                          const uniqueCostsMap = new Map();
                          allCosts.forEach((c) => {
                            if (c.id) {
                              uniqueCostsMap.set(c.id, c);
                            } else {
                              uniqueCostsMap.set(Math.random().toString(36), c);
                            }
                          });

                          return Array.from(uniqueCostsMap.values())
                            .filter((c: any) => {
                              if (!c.month) return true;
                              if (stringMonths.length > 0)
                                return (
                                  stringMonths.includes(c.month) &&
                                  c.year === filterYear.toString()
                                );
                              return true;
                            })
                            .reduce((a: any, b: any) => a + b.amount, 0);
                        } catch {
                          return "0,00";
                        }
                      })(),
                      hideFinance,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Interaction Metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Engajamento com a Página</h3>
                  <p className="text-sm text-slate-500">Métricas de visualização e cliques dos últimos 30 dias</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-500 mb-1">
                      Visualizações da Página
                    </h3>
                    <p className="text-3xl font-bold text-slate-800">
                      {interactions.filter(i => i.type === 'page_view' && (!i.timestamp || (new Date().getTime() - i.timestamp.toMillis()) < 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-slate-500" />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-emerald-800 mb-1">
                      Cliques no WhatsApp
                    </h3>
                    <p className="text-3xl font-bold text-emerald-900">
                      {interactions.filter(i => i.type === 'whatsapp_click' && (!i.timestamp || (new Date().getTime() - i.timestamp.toMillis()) < 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Metrics */}
            {clients.length > 0 && appointments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-500 mb-1">
                      Total de Pacientes Ativos
                    </h3>
                    <p className="text-2xl font-bold text-slate-800">
                      {
                        clientsInPeriod.filter((c) => c.isActive !== false)
                          .length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-500 mb-1">
                      Média de Valor de Serviços
                    </h3>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatMoneyUI(
                        appointmentsInPeriod.length > 0
                          ? (totalPaidInPeriod + totalPendingInPeriod) /
                              appointmentsInPeriod.length
                          : 0,
                        hideFinance,
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Metrics Charts */}

            {clients.length > 0 && appointments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm min-w-0">
                  <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    Origem dos Pacientes
                  </h3>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            clientsInPeriod.reduce(
                              (acc, c) => {
                                let s = c.source || "Não informada";
                                acc[s] = (acc[s] || 0) + 1;
                                return acc;
                              },
                              {} as Record<string, number>,
                            ),
                          ).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(
                            clientsInPeriod.reduce(
                              (acc, c) => {
                                let s = c.source || "Não informada";
                                acc[s] = (acc[s] || 0) + 1;
                                return acc;
                              },
                              {} as Record<string, number>,
                            ),
                          ).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                [
                                  "#6366f1",
                                  "#f59e0b",
                                  "#10b981",
                                  "#3b82f6",
                                  "#8b5cf6",
                                ][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white border text-sm border-slate-200 rounded-xl p-5 shadow-sm min-w-0">
                  <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                    Sessões Realizadas por Mês
                  </h3>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={Object.entries(
                          appointmentsInPeriod.reduce(
                            (acc, a) => {
                              if (!a.datetime) return acc;
                              const m = [
                                "Jan",
                                "Fev",
                                "Mar",
                                "Abr",
                                "Mai",
                                "Jun",
                                "Jul",
                                "Ago",
                                "Set",
                                "Out",
                                "Nov",
                                "Dez",
                              ][new Date(a.datetime).getMonth()];
                              acc[m] = (acc[m] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>,
                          ),
                        ).map(([name, sessions]) => ({ name, sessions }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          style={{ fontSize: "10px" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          style={{ fontSize: "10px" }}
                          width={20}
                        />
                        <RechartsTooltip cursor={{ fill: "#f8fafc" }} />
                        <Bar
                          dataKey="sessions"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Quadro com os totais gerais por Conta / local de faturamento */}
            {(() => {
              try {
                const incomes = JSON.parse(
                  profileData?.generalIncomesStr || "[]",
                );
                const stringMonths = filterMonths.map(
                  (i) =>
                    [
                      "Jan",
                      "Fev",
                      "Mar",
                      "Abr",
                      "Mai",
                      "Jun",
                      "Jul",
                      "Ago",
                      "Set",
                      "Out",
                      "Nov",
                      "Dez",
                    ][i],
                );

                // Group by Account / billing location
                interface BillingGroup {
                  totalPaid: number;
                  totalPending: number;
                  total: number;
                }

                const groups: { [key: string]: BillingGroup } = {};

                const getGroup = (key: string): BillingGroup => {
                  const normalizedKey = key.trim() || "Sem Conta Informada";
                  if (!groups[normalizedKey]) {
                    groups[normalizedKey] = {
                      totalPaid: 0,
                      totalPending: 0,
                      total: 0,
                    };
                  }
                  return groups[normalizedKey];
                };

                // Initialize known billing accounts from profile config so they are always visible
                billingAccounts.forEach((accName: string) => {
                  if (accName && accName.trim()) {
                    getGroup(accName);
                  }
                });

                // 1. Accumulate Patient Appointments in Selected Period
                appointmentsInPeriod.forEach((appt) => {
                  const acc = appt.billingAccount || "Sem Conta Informada";
                  const g = getGroup(acc);
                  const amount = Number(appt.totalAmount || 0);
                  if ((appt.paymentStatus || "pending") === "paid") {
                    g.totalPaid += amount;
                  } else {
                    g.totalPending += amount;
                  }
                  g.total += amount;
                });

                // 2. Accumulate Company Appointments in Selected Period
                companyAppointmentsInPeriod.forEach((appt) => {
                  const acc = appt.billingAccount || "Sem Conta Informada";
                  const g = getGroup(acc);
                  const amount = Number(appt.totalAmount || 0);
                  if ((appt.paymentStatus || "pending") === "paid") {
                    g.totalPaid += amount;
                  } else {
                    g.totalPending += amount;
                  }
                  g.total += amount;
                });

                // 3. Accumulate Other Revenues (General Incomes) related to Selected Period
                const filteredIncomes = incomes.filter((c: any) => {
                  if (!c.month) return true; // Fixed incomes shown across all months
                  if (stringMonths.length > 0) {
                    return (
                      stringMonths.includes(c.month) &&
                      c.year === filterYear.toString()
                    );
                  }
                  return true;
                });

                filteredIncomes.forEach((item: any) => {
                  const acc = item.account || "Sem Conta Informada";
                  const g = getGroup(acc);
                  const amount = Number(item.amount || 0);
                  const isPaid = (item.status || "pago") === "pago";
                  if (isPaid) {
                    g.totalPaid += amount;
                  } else {
                    g.totalPending += amount;
                  }
                  g.total += amount;
                });

                const groupKeys = Object.keys(groups);
                if (groupKeys.length === 0) return null;

                // Sum up Grand Totals for each column
                const grandTotals = {
                  totalPaid: 0,
                  totalPending: 0,
                  total: 0,
                };

                groupKeys.forEach((key) => {
                  const g = groups[key];
                  grandTotals.totalPaid += g.totalPaid;
                  grandTotals.totalPending += g.totalPending;
                  grandTotals.total += g.total;
                });

                return (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm md:text-base">
                            Receitas Consolidadas por Conta / Local de
                            Faturamento
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Valores unificados de todas as receitas do sistema
                            (Pacientes, Empresas e Gerais) para os meses
                            selecionados.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManageAccountsOpen(true)}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 self-start sm:self-center"
                      >
                        Gerenciar Contas
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-xs text-left text-slate-600 min-w-[500px]">
                        <thead className="bg-slate-50/85 text-slate-700 uppercase font-bold border-b border-slate-100">
                          <tr>
                            <th scope="col" className="px-5 py-3">
                              Conta / Local de Faturamento
                            </th>
                            <th scope="col" className="px-5 py-3 text-right">
                              Recebido (Pago)
                            </th>
                            <th scope="col" className="px-5 py-3 text-right">
                              Pendente
                            </th>
                            <th
                              scope="col"
                              className="px-5 py-3 text-right font-bold text-slate-800 bg-slate-50/45"
                            >
                              Total Acumulado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {groupKeys.map((key) => {
                            const gp = groups[key];
                            return (
                              <tr
                                key={key}
                                className="hover:bg-slate-50/50 transition"
                              >
                                <td className="px-5 py-4 font-semibold text-slate-700 flex items-center gap-2 min-h-[44px]">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-450 block flex-shrink-0"></span>
                                  <span className="truncate">{key}</span>
                                </td>
                                <td className="px-5 py-4 text-right text-emerald-600 font-semibold">
                                  {formatMoneyUI(gp.totalPaid, hideFinance)}
                                </td>
                                <td className="px-5 py-4 text-right text-amber-600 font-semibold">
                                  {formatMoneyUI(gp.totalPending, hideFinance)}
                                </td>
                                <td className="px-5 py-4 text-right font-bold text-slate-800 bg-slate-50/20">
                                  {formatMoneyUI(gp.total, hideFinance)}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totais Gerais */}
                          <tr className="bg-slate-50 text-slate-800 font-bold border-t-2 border-slate-200">
                            <td className="px-5 py-4 uppercase tracking-wide text-xs">
                              TOTAIS DO PERÍODO
                            </td>
                            <td className="px-5 py-4 text-right text-emerald-700 font-bold">
                              {formatMoneyUI(
                                grandTotals.totalPaid,
                                hideFinance,
                              )}
                            </td>
                            <td className="px-5 py-4 text-right text-amber-700 font-bold">
                              {formatMoneyUI(
                                grandTotals.totalPending,
                                hideFinance,
                              )}
                            </td>
                            <td className="px-5 py-4 text-right text-slate-900 font-extrabold bg-slate-150/40 text-sm">
                              {formatMoneyUI(grandTotals.total, hideFinance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              } catch (err) {
                console.error("Error building grouping board:", err);
                return null;
              }
            })()}

            <CostManager
              hideFinance={hideFinance}
              costsStr={profileData?.generalIncomesStr}
              type="generalIncomesStr"
              userId={userId}
              onUpdates={(val) =>
                onUpdateProfile({ ...profileData, generalIncomesStr: val })
              }
              filterMonths={filterMonths}
              filterYear={filterYear}
              isIncome={true}
              billingAccounts={billingAccounts}
              onManageAccounts={() => setIsManageAccountsOpen(true)}
            />

            {(() => {
              // Auto-merge legacy costs if they exist
              let mergedCosts: any[] = [];
              try {
                if (profileData?.generalCostsStr)
                  mergedCosts = [
                    ...mergedCosts,
                    ...JSON.parse(profileData.generalCostsStr),
                  ];
              } catch (e) {}
              try {
                if (profileData?.patientCostsStr)
                  mergedCosts = [
                    ...mergedCosts,
                    ...JSON.parse(profileData.patientCostsStr),
                  ];
              } catch (e) {}
              try {
                if (profileData?.companyCostsStr)
                  mergedCosts = [
                    ...mergedCosts,
                    ...JSON.parse(profileData.companyCostsStr),
                  ];
              } catch (e) {}

              // Deduplicate costs to prevent triplicates from legacy structure
              const uniqueCostsMap = new Map();
              mergedCosts.forEach(item => {
                if (item.id) {
                  uniqueCostsMap.set(item.id, item);
                } else {
                  uniqueCostsMap.set(Math.random().toString(36), item);
                }
              });
              const uniqueCosts = Array.from(uniqueCostsMap.values());

              const mergedCostsStr = JSON.stringify(uniqueCosts);
              
              const legacyUpdates: any = {};
              if (profileData?.patientCostsStr && profileData.patientCostsStr !== "[]") {
                legacyUpdates.patientCostsStr = "[]";
              }
              if (profileData?.companyCostsStr && profileData.companyCostsStr !== "[]") {
                legacyUpdates.companyCostsStr = "[]";
              }

              return (
                <CostManager
                  hideFinance={hideFinance}
                  costsStr={mergedCostsStr}
                  type="generalCostsStr"
                  userId={userId}
                  additionalUpdates={legacyUpdates}
                  onUpdates={(val) => {
                    const toUpdate: any = { generalCostsStr: val };
                    if (legacyUpdates.patientCostsStr) toUpdate.patientCostsStr = "[]";
                    if (legacyUpdates.companyCostsStr) toUpdate.companyCostsStr = "[]";
                    onUpdateProfile({ ...profileData, ...toUpdate });
                  }}
                  filterMonths={filterMonths}
                  filterYear={filterYear}
                  billingAccounts={billingAccounts}
                  onManageAccounts={() => setIsManageAccountsOpen(true)}
                />
              );
            })()}
          </div>
        )}
        {activeTab === "perfil" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Configurações do Perfil
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">
                  Site Público Ativo:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newValue =
                      editForm.isPublicSiteActive === false ? true : false;
                    setEditForm({ ...editForm, isPublicSiteActive: newValue });
                  }}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    editForm.isPublicSiteActive !== false
                      ? "bg-emerald-500"
                      : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      editForm.isPublicSiteActive !== false
                        ? "translate-x-6"
                        : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </div>

            {editForm.isPublicSiteActive === false && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 text-sm">
                <strong>Site desativado:</strong> As opções de agendamento
                online, informações detalhadas e serviços estão ocultos do
                público. Apenas seu nome e contatos ficarão visíveis na Landing
                Page. Salve as alterações para aplicar.
              </div>
            )}
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Foto de Capa
                  </label>
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group">
                    {editForm.coverPhoto ? (
                      <img
                        src={editForm.coverPhoto}
                        alt="Capa"
                        className="w-full h-full object-cover transition-transform"
                        style={{ 
                          objectPosition: editForm.coverPhotoPosition || "50% 50%",
                          transform: `scale(${editForm.coverPhotoScale || 1})`
                        }}
                      />
                    ) : (
                      <span className="text-slate-400 font-medium">
                        Nenhuma imagem
                      </span>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                      {uploadingImage === "coverPhoto" ? (
                        <span className="text-white text-sm font-medium">
                          Enviando...
                        </span>
                      ) : (
                        <span className="text-white text-sm font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Alterar Capa
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                        disabled={!!uploadingImage}
                        onChange={(e) => handleImageUpload(e, "coverPhoto")}
                      />
                    </label>
                  </div>
                  {editForm.coverPhoto && (
                    <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                      {/* Zoom Control */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                            Zoom da Capa (Escala)
                          </label>
                          <span className="text-xs font-mono text-amber-600 font-bold px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">
                            {(editForm.coverPhotoScale || 1.0).toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.1"
                          value={editForm.coverPhotoScale || 1.0}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              coverPhotoScale: parseFloat(e.target.value),
                            });
                          }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>1.0x (Original)</span>
                          <span>2.0x (Zoom)</span>
                          <span>3.0x (Máximo)</span>
                        </div>
                      </div>

                      {/* Vertical Alignment Control */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                            Ajuste Vertical da Capa
                          </label>
                          <span className="text-xs font-mono text-slate-600 font-bold px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                            {editForm.coverPhotoPosition || "50% 50%"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={(() => {
                            const pos = editForm.coverPhotoPosition || "50% 50%";
                            const parts = pos.split(" ");
                            const valStr = parts[1] || parts[0];
                            const parsed = parseInt(valStr);
                            return isNaN(parsed) ? 50 : parsed;
                          })()}
                          onChange={(e) => {
                            setEditForm({
                              ...editForm,
                              coverPhotoPosition: `50% ${e.target.value}%`,
                            });
                          }}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>Topo (0%)</span>
                          <span>Centro (50%)</span>
                          <span>Base (100%)</span>
                        </div>
                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200/40">
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, coverPhotoPosition: "50% 0%" })}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                              editForm.coverPhotoPosition === "50% 0%"
                                ? "bg-amber-100 border-amber-300 text-amber-700 font-medium"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Topo
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, coverPhotoPosition: "50% 50%" })}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                              !editForm.coverPhotoPosition || editForm.coverPhotoPosition === "50% 50%"
                                ? "bg-amber-100 border-amber-300 text-amber-700 font-medium"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Centro
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, coverPhotoPosition: "50% 100%" })}
                            className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                              editForm.coverPhotoPosition === "50% 100%"
                                ? "bg-amber-100 border-amber-300 text-amber-700 font-medium"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Base
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Foto de Perfil (Circular)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group shrink-0">
                      {editForm.profilePhoto ? (
                        <img
                          src={editForm.profilePhoto}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-slate-400" />
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                        {uploadingImage === "profilePhoto" ? (
                          <span className="text-white text-xs font-medium">
                            ...
                          </span>
                        ) : (
                          <Upload className="w-5 h-5 text-white" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                          disabled={!!uploadingImage}
                          onChange={(e) => handleImageUpload(e, "profilePhoto")}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-slate-500">
                      Recomendado: 400x400px. A imagem será recortada em formato
                      circular no seu perfil público.
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-6 border-b border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tema do Perfil / Landing Page
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={(editForm.theme || "auto") === "auto"}
                      onChange={() =>
                        setEditForm({ ...editForm, theme: "auto" })
                      }
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className="w-5 h-5 rounded-full shadow-sm border border-slate-200"
                        style={{
                          backgroundColor: editForm.themeColor || "#e2e8f0",
                        }}
                      ></span>
                      Automático (Cores da Capa)
                    </span>
                  </label>
                  {Object.entries(THEMES).map(([themeKey, themeObj]) => (
                    <label
                      key={themeKey}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={editForm.theme === themeKey}
                        onChange={() =>
                          setEditForm({ ...editForm, theme: themeKey })
                        }
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span className="flex items-center gap-2 text-sm text-slate-700">
                        <span
                          className="w-5 h-5 rounded-full shadow-sm border border-slate-200"
                          style={{
                            backgroundColor: `rgb(${themeObj.r}, ${themeObj.g}, ${themeObj.b})`,
                          }}
                        ></span>
                        {themeObj.label}
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editForm.theme === "custom"}
                      onChange={() =>
                        setEditForm({
                          ...editForm,
                          theme: "custom",
                          themeColor: editForm.themeColor && editForm.themeColor.startsWith("#") ? editForm.themeColor : "#3763eb"
                        })
                      }
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className="w-5 h-5 rounded-full shadow-sm border border-slate-200"
                        style={{
                          backgroundColor: editForm.themeColor && editForm.themeColor.startsWith("#") ? editForm.themeColor : "#3763eb",
                        }}
                      ></span>
                      Personalizado (Escolher cor)
                    </span>
                  </label>
                </div>

                {editForm.theme === "custom" && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Cor Primária Personalizada</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono select-all bg-white px-2 py-1 rounded border border-slate-150">
                          {editForm.themeColor || "#3763eb"}
                        </span>
                        <input
                          type="color"
                          value={editForm.themeColor || "#3763eb"}
                          onChange={(e) =>
                            setEditForm({ ...editForm, themeColor: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0 overflow-hidden bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-medium text-slate-400">Sugestões de Paleta Clínica e Terapêutica:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { hex: "#0ea5e9", label: "Mente Calma (Céu)" },
                          { hex: "#14b8a6", label: "Equilíbrio (Turquesa)" },
                          { hex: "#06b6d4", label: "Cura (Ciano)" },
                          { hex: "#8b5cf6", label: "Intuição (Lavanda)" },
                          { hex: "#10b981", label: "Crescimento (Esmeralda)" },
                          { hex: "#22c55e", label: "Saúde (Verde)" },
                          { hex: "#f43f5e", label: "Empatia (Rose)" },
                          { hex: "#f97316", label: "Acolhimento (Laranja)" },
                          { hex: "#ca8a04", label: "Estabilidade (Dourado)" },
                          { hex: "#4f46e5", label: "Confiança (Indigo)" },
                          { hex: "#3b82f6", label: "Foco (Azul Clássico)" },
                          { hex: "#64748b", label: "Minimalista (Slate)" },
                        ].map((preset) => (
                          <button
                            type="button"
                            key={preset.hex}
                            onClick={() => setEditForm({ ...editForm, themeColor: preset.hex })}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 hover:border-slate-350 hover:bg-slate-50 rounded-lg text-[11px] font-medium text-slate-600 transition-colors shadow-sm"
                          >
                            <span
                              className="w-3 h-3 rounded-full border border-slate-100 flex-shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="Ex: Dr. João Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Título Profissional
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="Ex: Psicólogo Clínico"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frase de Bio / Frase de Efeito
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.bio || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Ex: Te ajudando a encontrar o equilíbrio emocional (estilo intro do Instagram)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.cpf || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cpf: e.target.value })
                    }
                    placeholder="Ex: 000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    CRP
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.crp || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, crp: e.target.value })
                    }
                    placeholder="Ex: 06/123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail do Profissional
                  </label>
                  <input
                    type="email"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.email || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Ex: seuemail@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cidade e Estado de Atuação
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.city || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sobre Mim
                </label>
                <textarea
                  rows={4}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.about || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, about: e.target.value })
                  }
                  placeholder="Conte um pouco sobre sua formação, experiência e abordagem terapêutica..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.whatsapp || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, whatsapp: e.target.value })
                    }
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL do Site Público (Opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.publicDomain || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, publicDomain: e.target.value })
                    }
                    placeholder="Ex: https://meusite.com.br"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Preencha este campo se você publicou o sistema em outro
                    endereço. Os links dos pacientes serão gerados com ele.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Especialidades (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={specialtiesText}
                    onChange={(e) => setSpecialtiesText(e.target.value)}
                    placeholder="Ex: Ansiedade, Depressão, Terapia de Casal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Abordagens Psicológicas (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={approachesText}
                    onChange={(e) => setApproachesText(e.target.value)}
                    placeholder="Ex: TCC, Psicanálise, Humanista"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Pagamento e Recebimento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Chave Pix (Opcional)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.pixKey || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pixKey: e.target.value })
                      }
                      placeholder="Ex: CPF, E-mail, Telefone ou Aleatória"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Sua chave Pix será exibida no final do agendamento para o
                      paciente realizar o pagamento.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      QR Code Pix (Opcional)
                    </label>
                    <div className="flex items-center gap-4">
                      {editForm.pixQrCode && (
                        <div className="w-16 h-16 p-1 border border-slate-200 rounded-lg bg-white overflow-hidden flex items-center justify-center">
                          <img
                            src={editForm.pixQrCode}
                            alt="QR Code Pix"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 transition flex items-center gap-2">
                        {uploadingImage === "pixQrCode"
                          ? "Enviando..."
                          : editForm.pixQrCode
                            ? "Alterar QR Code"
                            : "Enviar QR Code"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                          disabled={!!uploadingImage}
                          onChange={(e) => handleImageUpload(e, "pixQrCode")}
                        />
                      </label>
                      {editForm.pixQrCode && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({ ...editForm, pixQrCode: undefined })
                          }
                          className="text-red-500 hover:text-red-600 text-sm font-medium"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Redes Sociais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.instagramUrl || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          instagramUrl: e.target.value,
                        })
                      }
                      placeholder="Ex: https://instagram.com/seu.perfil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.facebookUrl || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          facebookUrl: e.target.value,
                        })
                      }
                      placeholder="Ex: https://facebook.com/seu.perfil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.linkedinUrl || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          linkedinUrl: e.target.value,
                        })
                      }
                      placeholder="Ex: https://linkedin.com/in/seu-perfil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.youtubeUrl || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, youtubeUrl: e.target.value })
                      }
                      placeholder="Ex: https://youtube.com/@seu-canal"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Atendimento Presencial
                </h3>
                <label className="flex items-center gap-2 mb-4 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editForm.inPersonEnabled}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        inPersonEnabled: e.target.checked,
                      })
                    }
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  Disponibilizar endereço para atendimentos presenciais
                </label>

                {editForm.inPersonEnabled && (
                  <div className="grid grid-cols-1 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={editForm.address || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, address: e.target.value })
                        }
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Como Chegar (Instruções)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={editForm.howToGetThere || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            howToGetThere: e.target.value,
                          })
                        }
                        placeholder="Ex: Próximo à estação Trianon-Masp. Entrada pelo portão principal..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Link do Google Meu Negócio / Maps (Opcional)
                      </label>
                      <input
                        type="url"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={editForm.googleMapsUrl || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            googleMapsUrl: e.target.value,
                          })
                        }
                        placeholder="Ex: https://g.page/sua-clinica"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Código HTML do Mapa (Iframe do Google Maps - Opcional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={editForm.googleMapsEmbed || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            googleMapsEmbed: e.target.value,
                          })
                        }
                        placeholder='Ex: <iframe src="https://www.google.com/maps/embed?..." ...'
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Link de Avaliações no Google (Opcional)
                      </label>
                      <input
                        type="url"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={editForm.googleReviewsUrl || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            googleReviewsUrl: e.target.value,
                          })
                        }
                        placeholder="Ex: https://g.page/r/...?id=... / Link para avaliações"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Este link será exibido junto ao mapa para pacientes
                        verem suas avaliações.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Dados da Empresa (Opcional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nome da Empresa
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.companyName || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          companyName: e.target.value,
                        })
                      }
                      placeholder="Sua clínica ou consultório"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.cnpj || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cnpj: e.target.value })
                      }
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logotipo da Empresa
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center group shrink-0">
                      {editForm.companyLogo ? (
                        <img
                          src={editForm.companyLogo}
                          alt="Logo da Empresa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Logo</span>
                      )}
                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                        {uploadingImage === "companyLogo" ? (
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-white" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                          onChange={(e) => handleImageUpload(e, "companyLogo")}
                        />
                      </label>
                    </div>
                    <div className="text-xs text-slate-500">
                      <p>
                        Formato circular, ideal para o logotipo da sua clínica.
                      </p>
                      <p>Envie uma imagem JPG ou PNG.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-slate-200 bg-white rounded-2xl mt-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <RefreshCw className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Central de Integrações Google
                    </h3>
                    <p className="text-xs text-slate-500">
                      Conecte e gerencie seus serviços do ecossistema Google de forma centralizada e segura.
                    </p>
                  </div>
                </div>

                {/* Section 1: Professional Integrations (Platform Domain Only) */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
                      SERVIÇOS CORPORATIVOS (REQUER E-MAIL DO DOMÍNIO)
                    </span>
                    <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      Domínio @elosolucoeshumanas.com ou @elosolucoes.com.br
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Estes serviços lidam com dados sensíveis de pacientes (arquivos de prontuários, termos de serviços e chamadas de vídeo confidenciais) e, por política de segurança, <strong>apenas e-mails profissionais com o domínio da plataforma</strong> podem ser associados.
                  </p>

                  <div className="space-y-4">
                    {/* Google Meet */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", editForm.meetSync ? "bg-indigo-100 text-indigo-700" : "bg-slate-200/60 text-slate-500")}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Google Meet</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {editForm.meetSync 
                              ? `Conectado com a conta corporativa: ${editForm.meetEmail || "Domínio da Plataforma"}` 
                              : "Gere salas de consulta virtuais com transcrição automática e resumos inteligentes."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {editForm.meetSync ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                              <Check className="w-3.5 h-3.5" /> Ativo
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditForm((prev: any) => ({ ...prev, meetSync: false, meetEmail: "" }))}
                              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                            >
                              Desconectar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleMeetConnect}
                            disabled={isConnectingMeet}
                            className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                          >
                            {isConnectingMeet ? "Conectando..." : "Conectar Meet"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Google Drive */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", editForm.driveSync ? "bg-indigo-100 text-indigo-700" : "bg-slate-200/60 text-slate-500")}>
                          <div className="w-5 h-5 flex items-center justify-center font-extrabold text-sm tracking-tighter">
                            GD
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Google Drive</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {editForm.driveSync 
                              ? `Conectado com a conta corporativa: ${editForm.driveEmail || "Domínio da Plataforma"}` 
                              : "Armazene e exporte prontuários, backups periódicos e documentos clínicos com total segurança."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {editForm.driveSync ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                              <Check className="w-3.5 h-3.5" /> Ativo
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditForm((prev: any) => ({ ...prev, driveSync: false, driveEmail: "" }))}
                              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                            >
                              Desconectar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleDriveConnect}
                            disabled={isConnectingDrive}
                            className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                          >
                            {isConnectingDrive ? "Conectando..." : "Conectar Drive"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Personal/Commercial Integrations (Any Account Allowed) */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold tracking-widest text-emerald-600 uppercase">
                      SERVIÇOS PESSOAIS OU COMERCIAIS (QUALQUER CONTA GMAIL)
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      Qualquer conta Google / Gmail
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Você pode conectar sua conta pessoal de e-mail (ou conta comercial própria do seu consultório) para herdar suas avaliações consolidadas no Google Meu Negócio e manter sua agenda sincronizada.
                  </p>

                  <div className="space-y-4">
                    {/* Google Agenda */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl", editForm.calendarSync ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/60 text-slate-500")}>
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Google Agenda</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {editForm.calendarSync 
                              ? `Sincronizado com a conta Google: ${editForm.calendarEmail || "Sua conta"}` 
                              : "Sincronize seus horários de atendimento da plataforma com o seu calendário pessoal."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {editForm.calendarSync ? (
                          <>
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                              <Check className="w-3.5 h-3.5" /> Ativo
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditForm((prev: any) => ({ ...prev, calendarSync: false, calendarEmail: "" }))}
                              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                            >
                              Desconectar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCalendarSync}
                            disabled={isSyncing}
                            className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                          >
                            {isSyncing ? "Sincronizando..." : "Sincronizar Agenda"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Google Perfil da Empresa (Meu Negócio) */}
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2.5 rounded-xl", editForm.googleBusinessSync ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/60 text-slate-500")}>
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Google Perfil da Empresa</h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {editForm.googleBusinessSync 
                                ? `Integrado com a conta Google: ${editForm.googleBusinessEmail || "Sua conta"}` 
                                : "Apresente suas avaliações, pontuações e reviews reais do Google Meu Negócio no seu perfil público."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {editForm.googleBusinessSync ? (
                            <>
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                <Check className="w-3.5 h-3.5" /> Ativo
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditForm((prev: any) => ({ ...prev, googleBusinessSync: false, googleBusinessEmail: "" }))}
                                className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                              >
                                Desconectar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGoogleBusinessConnect}
                              disabled={isConnectingBusiness}
                              className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                            >
                              {isConnectingBusiness ? "Conectando..." : "Conectar Perfil"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Dropdown collapsible fields when Perfil da Empresa is connected */}
                      {editForm.googleBusinessSync && (
                        <div className="mt-4 border-t border-slate-200/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Link de Avaliações do Google Meu Negócio
                            </label>
                            <input
                              type="url"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-amber-400 focus:outline-none bg-white text-slate-900"
                              value={editForm.googleReviewsUrl || ""}
                              onChange={(e) => setEditForm({ ...editForm, googleReviewsUrl: e.target.value })}
                              placeholder="Ex: https://g.page/r/.../review"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Este link permite que novos pacientes cliquem e avaliem você diretamente.</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Link do Google Maps do Consultório
                            </label>
                            <input
                              type="url"
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-amber-400 focus:outline-none bg-white text-slate-900"
                              value={editForm.googleMapsUrl || ""}
                              onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })}
                              placeholder="Ex: https://maps.app.goo.gl/..."
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Para facilitar a navegação até o consultório físico.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "servicos" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <div className="flex flex-col mb-6 gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                Meus Serviços
              </h2>
              <p className="text-sm text-slate-500">
                Faça a gestão dos serviços oferecidos no seu perfil público.
              </p>
            </div>

            <div className="flex flex-wrap border-b border-slate-200 mb-6 font-medium text-sm gap-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveServiceTab("voce")}
                className={
                  "pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " +
                  (activeServiceTab === "voce"
                    ? "border-b-2 border-amber-500 text-amber-600 font-bold"
                    : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")
                }
              >
                Para Você
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceTab("empresa")}
                className={
                  "pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " +
                  (activeServiceTab === "empresa"
                    ? "border-b-2 border-amber-500 text-amber-600 font-bold"
                    : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")
                }
              >
                Para Empresas
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceTab("psicologos")}
                className={
                  "pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " +
                  (activeServiceTab === "psicologos"
                    ? "border-b-2 border-amber-500 text-amber-600 font-bold"
                    : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")
                }
              >
                Para Psicólogos
              </button>
              <button
                type="button"
                onClick={() => setActiveServiceTab("igrejas")}
                className={
                  "pb-3 transition-colors uppercase tracking-wider text-xs whitespace-nowrap " +
                  (activeServiceTab === "igrejas"
                    ? "border-b-2 border-amber-500 text-amber-600 font-bold"
                    : "text-slate-500 border-b-2 border-transparent hover:text-slate-800")
                }
              >
                Para Igrejas
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-slate-700">
                    Meus Serviços -{" "}
                    {activeServiceTab === "voce"
                      ? "Para Você"
                      : activeServiceTab === "empresa"
                        ? "Para Empresas"
                        : activeServiceTab === "psicologos"
                          ? "Para Psicólogos"
                          : "Para Igrejas"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newSvcId = Date.now().toString();
                      setEditForm({
                        ...editForm,
                        services: [
                          {
                            id: newSvcId,
                            category: activeServiceTab,
                            title: "",
                            description: "",
                            price: 0,
                          },
                          ...(editForm.services || []),
                        ],
                      });
                      setEditingServiceId(newSvcId);
                    }}
                    className="flex items-center gap-2 text-sm text-amber-500 font-medium hover:text-amber-600 transition px-3 py-1.5 bg-amber-50 rounded-lg hover:bg-amber-100"
                  >
                    <Plus className="w-4 h-4" /> Novo Serviço
                  </button>
                </div>

                {activeServiceTab !== "voce" && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">LINK GERAL DE VENDAS (LANDPAGE)</span>
                      <p className="text-xs text-slate-600">Compartilhe esta página comercial contendo todos os seus serviços para este público em uma única tela.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/?t=${userId || ""}&audience=${activeServiceTab}`;
                          navigator.clipboard.writeText(url);
                          alert("Link geral copiado com sucesso!");
                        }}
                        className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Link</span>
                      </button>
                      <a
                        href={`/?t=${userId || ""}&audience=${activeServiceTab}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visualizar</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {(() => {
                    const filteredServices = (editForm.services || []).filter(
                      (svc: any) => {
                        const actualCategory = svc.category || "voce";
                        const normalizedCategory =
                          actualCategory === "psicologo"
                            ? "psicologos"
                            : actualCategory;
                        return normalizedCategory === activeServiceTab;
                      },
                    );

                    if (filteredServices.length === 0) {
                      return (
                        <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm bg-slate-50">
                          Nenhum serviço cadastrado nesta área. Clique em{" "}
                          <strong>Novo Serviço</strong> para começar!
                        </div>
                      );
                    }

                    return filteredServices.map((svc: any, idx: number) => {
                      const actualCategory = svc.category || "voce";
                      const normalizedCategory =
                        actualCategory === "psicologo"
                          ? "psicologos"
                          : actualCategory;

                      return (
                        <div
                          key={svc.id || idx}
                          onClick={() => setEditingServiceId(svc.id)}
                          className="p-5 border border-slate-200 dark:border-slate-700/60 rounded-2xl bg-white dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm transition duration-200 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                        >
                          {/* Left Column: Info, badges, duration */}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {svc.title || "Serviço Sem Título"}
                              </h3>
                              {svc.duration && (
                                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                  <CalendarIcon className="w-3 h-3 text-slate-400 dark:text-slate-400" />{" "}
                                  {svc.duration}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {svc.description ||
                                "Nenhuma descrição fornecida."}
                            </p>

                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                              {svc.allowScheduling !== false ? (
                                <span className="bg-emerald-50/70 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                                  📆 Agendamento Ativo
                                </span>
                              ) : (
                                <span className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  📆 Sem Agendamento
                                </span>
                              )}
                              {svc.allowPayment !== false && (
                                <span className="bg-amber-50/70 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 dark:border-amber-800/50">
                                  💳 Faturamento Integrado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Column: Price and quick actions */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-6 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-700/60">
                            <div className="text-left lg:text-right">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider leading-none">
                                Preço cobrado
                              </span>
                              <p className="text-base sm:text-lg font-black text-slate-700 dark:text-slate-200 mt-1">
                                {svc.price === 0
                                  ? "A combinar"
                                  : formatMoneyUI(svc.price, hideFinance)}
                              </p>
                            </div>

                            <div
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (idx === 0) return;
                                  const arr = [...editForm.services];
                                  const realIdx = arr.findIndex(
                                    (s: any) => s.id === svc.id,
                                  );
                                  const prevRealIdx = arr.findIndex(
                                    (s: any, i: number) =>
                                      i < realIdx &&
                                      (s.category || "voce") ===
                                        normalizedCategory,
                                  );
                                  if (realIdx !== -1 && prevRealIdx !== -1) {
                                    [arr[realIdx], arr[prevRealIdx]] = [
                                      arr[prevRealIdx],
                                      arr[realIdx],
                                    ];
                                    setEditForm({ ...editForm, services: arr });
                                  }
                                }}
                                disabled={idx === 0}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition cursor-pointer"
                                title="Mover para cima"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const arr = [...editForm.services];
                                  const realIdx = arr.findIndex(
                                    (s: any) => s.id === svc.id,
                                  );
                                  const nextRealIdx = arr.findIndex(
                                    (s: any, i: number) =>
                                      i > realIdx &&
                                      (s.category || "voce") ===
                                        normalizedCategory,
                                  );
                                  if (realIdx !== -1 && nextRealIdx !== -1) {
                                    [arr[realIdx], arr[nextRealIdx]] = [
                                      arr[nextRealIdx],
                                      arr[realIdx],
                                    ];
                                    setEditForm({ ...editForm, services: arr });
                                  }
                                }}
                                disabled={idx === filteredServices.length - 1}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition cursor-pointer"
                                title="Mover para baixo"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const url =
                                    window.location.origin +
                                    `/?t=${auth.currentUser?.uid}&service=${svc.id}`;
                                  navigator.clipboard.writeText(url);
                                  alert("Link do serviço copiado!");
                                }}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                                title="Copiar link"
                              >
                                <Link className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingServiceId(svc.id)}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-900/50"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Confirmar a exclusão permanente deste serviço?",
                                    )
                                  ) {
                                    const newSvc = (
                                      editForm.services || []
                                    ).filter((s: any) => s.id !== svc.id);
                                    setEditForm({
                                      ...editForm,
                                      services: newSvc,
                                    });
                                  }
                                }}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-200 mt-6 gap-4">
                <span className="text-xs text-slate-400 font-bold text-center sm:text-left">
                  * Clique em qualquer card de serviço acima para configurá-lo
                  no painel de edição popup.
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition w-full sm:w-auto"
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>

            {/* Edit Service Modal Popup Overlay */}
            {editingServiceId &&
              (() => {
                const svcIdx = (editForm.services || []).findIndex(
                  (s: any) => s.id === editingServiceId,
                );
                if (svcIdx === -1) return null;
                const svc = editForm.services[svcIdx];

                return (
                  <div
                    className="fixed inset-0 bg-marsala-800/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
                    onClick={() => setEditingServiceId(null)}
                  >
                    <div
                      className="bg-white rounded-[2rem] border border-slate-105 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-left flex flex-col justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <div>
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-200/50">
                            {activeServiceTab === "voce"
                              ? "Para Você (Atendimento Individual)"
                              : activeServiceTab === "empresa"
                                ? "Para Empresas (Corporativo)"
                                : activeServiceTab === "psicologos"
                                  ? "Para Psicólogos (Mentoria/Supervisão)"
                                  : "Para Igrejas (Institucional)"}
                          </span>
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight mt-1.5">
                            {svc.title
                              ? `Editar: ${svc.title}`
                              : "Novo Serviço"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingServiceId(null)}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 transition flex items-center justify-center text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="space-y-5 flex-1 pr-1 overflow-y-auto max-h-[55vh]">
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Título do Serviço
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-bold text-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={svc.title}
                            onChange={(e) => {
                              const arr = [...editForm.services];
                              arr[svcIdx].title = e.target.value;
                              setEditForm({ ...editForm, services: arr });
                            }}
                            placeholder="Ex: Terapia Cognitivo-Comportamental Individual"
                          />
                        </div>

                        {/* Price & Plan Range */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                              Regime de Cobrança
                            </label>
                            <select
                              className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-700 font-bold dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={svc.price === 0 ? "combinar" : "fixo"}
                              onChange={(e) => {
                                const arr = [...(editForm.services || [])];
                                if (e.target.value === "combinar") {
                                  arr[svcIdx].price = 0;
                                } else {
                                  arr[svcIdx].price = svc.price || 150;
                                }
                                setEditForm({ ...editForm, services: arr });
                              }}
                            >
                              <option value="fixo">Preço Fixo (R$)</option>
                              <option value="combinar">
                                Sob Consulta / A combinar
                              </option>
                            </select>
                          </div>

                          {svc.price !== 0 && (
                            <div>
                              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                Preço do Serviço
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  className="w-full pl-9 pr-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-black text-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                  value={svc.price}
                                  placeholder="150"
                                  onChange={(e) => {
                                    const arr = [...(editForm.services || [])];
                                    arr[svcIdx].price = Number(e.target.value);
                                    setEditForm({ ...editForm, services: arr });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                              Tempo de Duração
                            </label>
                            <input
                              type="text"
                              className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-slate-700 font-bold dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={svc.duration || ""}
                              onChange={(e) => {
                                const arr = [...editForm.services];
                                arr[svcIdx].duration = e.target.value;
                                setEditForm({ ...editForm, services: arr });
                              }}
                              placeholder="Ex: 50 minutos"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                              Atalho do Serviço
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  window.location.origin +
                                  `/?t=${auth.currentUser?.uid}&service=${svc.id}`;
                                navigator.clipboard.writeText(url);
                                alert("Link do serviço copiado!");
                              }}
                              className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 font-bold text-slate-600 transition flex items-center justify-center gap-2"
                            >
                              <Link className="w-4 h-4 text-slate-400" /> Copiar
                              Link do Serviço
                            </button>
                          </div>
                        </div>

                        {/* Brief description */}
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Descrição Resumida (Para o Card)
                          </label>
                          <textarea
                            rows={2}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-slate-600 leading-relaxed font-semibold dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={svc.description}
                            onChange={(e) => {
                              const arr = [...editForm.services];
                              arr[svcIdx].description = e.target.value;
                              setEditForm({ ...editForm, services: arr });
                            }}
                            placeholder="Digite um resumo sobre este atendimento..."
                          />
                        </div>

                        {/* Detailed description */}
                        <div>
                          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">
                            Descrição Completa e Metodologia
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-slate-600 text-justify leading-relaxed font-semibold dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={svc.detailedDescription || ""}
                            onChange={(e) => {
                              const arr = [...editForm.services];
                              arr[svcIdx].detailedDescription = e.target.value;
                              setEditForm({ ...editForm, services: arr });
                            }}
                            placeholder="Fale detalhadamente sobre a metodologia, para quem se destina, de que forma é feito..."
                          />
                        </div>

                        {/* Feature options */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                            Opções do Fluxo de Atendimento
                          </h4>

                          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none leading-relaxed font-semibold">
                            <input
                              type="checkbox"
                              checked={svc.allowScheduling !== false}
                              onChange={(e) => {
                                const arr = [...editForm.services];
                                arr[svcIdx].allowScheduling = e.target.checked;
                                setEditForm({ ...editForm, services: arr });
                              }}
                              className="mt-0.5 rounded text-amber-500 w-4 h-4 cursor-pointer focus:ring-amber-500 border-slate-300"
                            />
                            <span>
                              Permitir agendamento online de dia e horário
                              diretamente pela plataforma
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none leading-relaxed font-semibold">
                            <input
                              type="checkbox"
                              checked={svc.allowPayment !== false}
                              onChange={(e) => {
                                const arr = [...editForm.services];
                                arr[svcIdx].allowPayment = e.target.checked;
                                setEditForm({ ...editForm, services: arr });
                              }}
                              className="mt-0.5 rounded text-amber-500 w-4 h-4 cursor-pointer focus:ring-amber-500 border-slate-300"
                            />
                            <span>
                              Exibir faturamento guiado com simulação/PIX no
                              checkout
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6 gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                "Deseja realmente deletar permanentemente este serviço do seu perfil?",
                              )
                            ) {
                              const newSvc = (editForm.services || []).filter(
                                (s: any) => s.id !== editingServiceId,
                              );
                              setEditForm({ ...editForm, services: newSvc });
                              setEditingServiceId(null);
                            }
                          }}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition cursor-pointer"
                          >
                            Voltar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!svc.title.trim()) {
                                alert(
                                  "Por favor, preencha o Título do serviço.",
                                );
                                return;
                              }
                              setEditingServiceId(null);
                            }}
                            className="px-6 py-2.5 bg-marsala-800 hover:bg-marsala-700 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                          >
                            Concluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}

        {activeTab === "materiais" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            {isRestrictedByPlan && (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-100 rounded-xl text-amber-700">💡</span>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-slate-800">
                      Modo de Demonstração (Plano Essencial)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você pode visualizar e simular esta área de materiais de apoio, mas as alterações não serão salvas e exigem o plano <strong>Gestão Total</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("assinatura")}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition shrink-0 shadow-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
            )}
            <div className="flex flex-col mb-6 gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                Gestão de Materiais
              </h2>
              <p className="text-sm text-slate-500">
                Compartilhe links do Google Drive, Notion ou outras plataformas
                com seus clientes, como formulários de anamnese, ebooks ou
                exercícios.
              </p>
            </div>

            <form onSubmit={handleProfileSave}>
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Materiais Exclusivos (Links do Google Drive)
                </label>
                <div className="space-y-3">
                  {(editForm.materials || []).map((mat: any, idx: number) => {
                    const url = typeof mat === "string" ? mat : mat.url || "";
                    const desc =
                      typeof mat === "string" ? "" : mat.description || "";
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 p-3 border border-slate-100 rounded-xl bg-slate-50"
                      >
                        <div className="flex gap-2">
                          <input
                            type="url"
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white font-mono text-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={url}
                            onChange={(e) => {
                              const newMaterials = [
                                ...(editForm.materials || []),
                              ].map((m) =>
                                typeof m === "string"
                                  ? { url: m, description: "" }
                                  : m,
                              );
                              newMaterials[idx].url = e.target.value;
                              setEditForm({
                                ...editForm,
                                materials: newMaterials,
                              });
                            }}
                            placeholder="https://drive.google.com/..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newMaterials = (
                                editForm.materials || []
                              ).filter((_: any, i: number) => i !== idx);
                              setEditForm({
                                ...editForm,
                                materials: newMaterials,
                              });
                            }}
                            className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={desc}
                          onChange={(e) => {
                            const newMaterials = [
                              ...(editForm.materials || []),
                            ].map((m) =>
                              typeof m === "string"
                                ? { url: m, description: "" }
                                : m,
                            );
                            newMaterials[idx].description = e.target.value;
                            setEditForm({
                              ...editForm,
                              materials: newMaterials,
                            });
                          }}
                          placeholder="Descrição do material (ex: Livro Digital)..."
                        />
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      const currentMaterials = (editForm.materials || []).map(
                        (m: any) =>
                          typeof m === "string"
                            ? { url: m, description: "" }
                            : m,
                      );
                      setEditForm({
                        ...editForm,
                        materials: [
                          ...currentMaterials,
                          { url: "", description: "" },
                        ],
                      });
                    }}
                    className="flex items-center gap-2 text-sm text-amber-500 font-medium hover:text-amber-600 transition"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Link
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition shadow-sm flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "documentos" && (
          <div className="animate-in fade-in h-full">
            <DocumentManager
              userId={userId}
              profileData={profileData}
              clients={clients}
              isGestaoTotal={!isRestrictedByPlan}
              onUpgradeTriggered={(featureName) => {
                setActiveTab("assinatura");
                alert(`A funcionalidade "${featureName}" é exclusiva do plano Gestão Total.`);
              }}
            />
          </div>
        )}

        {activeTab === "agenda" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Integração com Google Agenda
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Em vez de preencher manualmente, conecte sua conta Google para
              extrair seus horários livres. Sua disponibilidade padrão (09:00 -
              18:00 em dias úteis) será filtrada automaticamente para remover os
              horários em que você já tem eventos no calendário.
            </p>

            <form
              onSubmit={handleProfileSave}
              className="space-y-6 mb-8 border-b border-slate-100 pb-8"
            >
              <h3 className="font-bold text-slate-800 mb-4 items-center flex gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" /> Incorporar
                Calendário Público
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Se você já possui uma página de agendamento no Google Calendar,
                você pode incorporar o código HTML (iframe) ou disponibilizar o
                link para que os pacientes agendem diretamente.
              </p>

              <div className="grid grid-cols-1 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link da sua página de agendamento (Google Calendar /
                    Calendly)
                  </label>
                  <input
                    type="url"
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.calendarUrl || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, calendarUrl: e.target.value })
                    }
                    placeholder="Ex: https://calendar.google.com/calendar/u/0/appointments/schedules/"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código de Incorporação (iframe)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                    value={editForm.calendarEmbed || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        calendarEmbed: e.target.value,
                      })
                    }
                    placeholder='Ex: <iframe src="https://calendar.google.com/..." width="100%" height="600" ...'
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-amber-600 transition flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Salvar
                </button>
              </div>
            </form>

            <h3 className="font-bold text-slate-800 mb-4">
              Sincronização Direta de Horários
            </h3>
            <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-500" /> Status da
                  Conexão
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {editForm.calendarSync
                    ? "Sua conta está vinculada e seus horários foram gerados a partir do Google Agenda."
                    : "Conecte sua conta para gerar sua disponibilidade atual."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalendarSync}
                disabled={isSyncing}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2",
                  editForm.calendarSync
                    ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-amber-500 text-white hover:bg-amber-600 shadow-sm",
                )}
              >
                {isSyncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : editForm.calendarSync ? (
                  <>
                    <RefreshCw className="w-4 h-4" /> Sincronizar Novamente
                  </>
                ) : (
                  "Conectar Google Agenda"
                )}
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                Seus Horários após Sincronização
              </h3>
              {[
                "Domingo",
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
              ].map((day, dIdx) => (
                <div
                  key={dIdx}
                  className="flex flex-col sm:flex-row sm:items-start gap-4 border-b border-slate-100 pb-4"
                >
                  <div className="w-32 font-medium text-slate-700 mt-2">
                    {day}
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {(editForm.schedule?.[dIdx] || []).length > 0 ? (
                      (editForm.schedule[dIdx] as string[]).map(
                        (time, tIdx) => (
                          <span
                            key={`${time}-${tIdx}`}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full border border-emerald-200"
                          >
                            {time}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-slate-400 text-sm mt-2 italic px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                        Sem horários disponíveis
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-amber-600 transition flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Salvar Horários Sincronizados
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "notificacoes" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Notificações do Sistema
              </h2>
              <button
                onClick={async () => {
                  try {
                    await Promise.all(
                      systemNotifications
                        .filter((n) => !n.isRead)
                        .map((n) =>
                          updateDoc(
                            doc(
                              db,
                              `profiles/${userId}/system_notifications/${n.id}`,
                            ),
                            { isRead: true },
                          ),
                        ),
                    );
                    setSystemNotifications((prev) =>
                      prev.map((n) => ({ ...n, isRead: true })),
                    );
                  } catch (e) {}
                }}
                className="text-sm text-slate-500 hover:text-amber-600 transition"
              >
                Marcar todas como lidas
              </button>
            </div>

            {/* Browser Notifications Configuration Panel */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-3.5 items-start">
                <div className="bg-amber-100/80 text-amber-600 p-2.5 rounded-xl flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base">
                    Notificações do Navegador em Tempo Real
                  </h3>
                  <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
                    Receba alertas imediatos sobre novos agendamentos, novos
                    cadastros e aniversariantes do dia diretamente na sua tela,
                    mesmo que a aba do sistema esteja em segundo plano.
                  </p>
                  <div className="flex gap-2 items-center mt-2.5">
                    <span className="text-xs font-semibold text-slate-500">
                      Status dos Alertas:
                    </span>
                    {notiPermission === "granted" ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        Permitido Ativo
                      </span>
                    ) : notiPermission === "denied" ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        Bloqueado pelo Navegador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-2 w-full md:w-auto justify-end">
                {notiPermission !== "granted" ? (
                  <button
                    onClick={async () => {
                      const perm = await requestNotificationPermission();
                      if (perm === "granted") {
                        sendBrowserNotification(
                          "🚀 Alertas Ativados com Sucesso!",
                          "Agora você receberá as notificações do consultório em tempo real!",
                        );
                      } else if (perm === "denied") {
                        alert(
                          "As notificações foram bloqueadas. Habilite-as clicando no ícone de cadeado na barra de endereço do seu navegador.",
                        );
                      }
                    }}
                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm"
                  >
                    Permitir Alertas
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sendBrowserNotification(
                        "🧪 Notificação de Teste",
                        "O teste de alertas funcionou! O sistema agora enviará notificações em tempo real.",
                      );
                    }}
                    className="w-full md:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    Testar Alerta
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {allNotifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Nenhuma notificação recebida ainda.
                </div>
              ) : (
                allNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-4 rounded-xl border transition",
                      notif.isRead
                        ? "bg-slate-50 border-slate-200"
                        : "bg-amber-50/50 border-amber-200",
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={cn(
                          "font-bold",
                          notif.isRead ? "text-slate-700" : "text-amber-900",
                        )}
                      >
                        {notif.title}
                      </h3>
                      {notif.createdAt && (
                        <span className="text-xs text-slate-400">
                          {format(
                            new Date(notif.createdAt),
                            "dd/MM/yyyy 'às' HH:mm",
                          )}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        notif.isRead ? "text-slate-600" : "text-amber-800",
                      )}
                    >
                      {notif.message}
                    </p>
                    {!notif.isRead && !notif.isAlert && (
                      <button
                        onClick={async () => {
                          try {
                            await updateDoc(
                              doc(
                                db,
                                `profiles/${userId}/system_notifications/${notif.id}`,
                              ),
                              { isRead: true },
                            );
                            setSystemNotifications((prev) =>
                              prev.map((n) =>
                                n.id === notif.id ? { ...n, isRead: true } : n,
                              ),
                            );
                          } catch (e) {}
                        }}
                        className="mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 transition"
                      >
                        Marcar como lida
                      </button>
                    )}
                    {notif.isAlert && (
                      <button
                        onClick={() => {
                          handleOpenNotification(notif.client);
                          setNotificationTemplate("readjustment");
                        }}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Enviar Notificação de Reajuste
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "pacientes" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            {isRestrictedByPlan && (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-100 rounded-xl text-amber-700">💡</span>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-slate-800">
                      Modo de Demonstração (Plano Essencial)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você pode visualizar e navegar pela gestão de pacientes e faturamento, mas a criação, alteração ou faturamento de pacientes exigem o plano <strong>Gestão Total</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("assinatura")}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition shrink-0 shadow-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
            )}
            <div className="flex flex-col mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Prontuário e Agendamentos
                </h2>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      Link de Cadastro:
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            getPublicLink(`/?register=${userId}`),
                          );
                          alert("Link copiado!");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      Termos/Contrato:
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            getPublicLink(`/?terms=${userId}`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                      <button
                        onClick={() => setShowContractEditor("paciente")}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                        title="Editar Contrato"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    </p>
                  </div>
                  {!profileData?.publicDomain &&
                    (window.location.hostname.includes("ais-pre-") ||
                      window.location.hostname.includes("ais-dev-")) && (
                      <div className="bg-amber-50 text-amber-700/80 p-3 rounded-lg text-xs leading-relaxed max-w-2xl mt-1 border border-amber-100 flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                        <div>
                          <strong className="font-semibold block mb-1">
                            Atenção: Endereço do Sistema não Configurado
                          </strong>
                          O link atual de testes (ais-pre-...) dará um erro de{" "}
                          <strong className="font-semibold">
                            "Acesso Negado (403)"
                          </strong>{" "}
                          caso seja enviado para os pacientes, pois é de uso
                          exclusivo no ambiente de desenvolvimento.
                          <br />
                          Para resolver, é necessário{" "}
                          <strong>publicar o sistema</strong> e preencher o
                          campo "URL do Site Público" em Meu Perfil.
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  pacientesBillingFilter === "all"
                    ? "bg-white border-blue-400 ring-1 ring-blue-400"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300",
                )}
                onClick={() => setPacientesBillingFilter("all")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-slate-600 mb-1">
                    Faturamento Total (Pacientes)
                  </h3>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatMoneyUI(
                      appointmentsInPeriod.reduce(
                        (a, b) => a + Number(b.totalAmount || 0),
                        0,
                      ),
                      hideFinance,
                    )}
                  </p>
                </div>
                {pacientesBillingFilter === "all" && (
                  <Check className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                )}
              </div>
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  pacientesBillingFilter === "paid"
                    ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400"
                    : "bg-emerald-50/50 border-emerald-100 hover:border-emerald-300",
                )}
                onClick={() => setPacientesBillingFilter("paid")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-emerald-800 mb-1">
                    Recebido (Pacientes)
                  </h3>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatMoneyUI(
                      appointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "paid",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                </div>
                {pacientesBillingFilter === "paid" && (
                  <Check className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
                )}
              </div>
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  pacientesBillingFilter === "pending"
                    ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400"
                    : "bg-amber-50/50 border-amber-100 hover:border-amber-300",
                )}
                onClick={() => setPacientesBillingFilter("pending")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-amber-800 mb-1">
                    A Receber (Pacientes)
                  </h3>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatMoneyUI(
                      appointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "pending",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                </div>
                {pacientesBillingFilter === "pending" && (
                  <Check className="w-5 h-5 text-amber-600 absolute top-4 right-4" />
                )}
              </div>
            </div>

            {pacientesBillingFilter !== "all" && (
              <p className="text-xs text-slate-500 mb-6 text-center">
                Exibindo apenas pacientes com faturamento{" "}
                <strong>
                  {pacientesBillingFilter === "paid"
                    ? "concluído (pago)"
                    : "pendente"}
                </strong>{" "}
                selecionado nestes cards.
              </p>
            )}

            {editingClientId === "new" && (
              <div
                className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingClientId(null);
                }}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setEditingClientId(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <form onSubmit={handleClientSave} className="space-y-4">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                      <h3 className="font-bold text-slate-900 text-xl">
                        Novo Paciente
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {/* Seção: Dados do Paciente */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-semibold text-slate-800 text-sm mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></span>
                          Dados do Paciente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Nome
                            </label>
                            <input
                              required
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.name || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              E-mail
                            </label>
                            <input
                              required
                              type="email"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.email || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Telefone
                            </label>
                            <input
                              required
                              type="tel"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.phone || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              CPF
                            </label>
                            <input
                              required
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.cpf || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  cpf: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Data de Nascimento
                            </label>
                            <input
                              required
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.dob || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  dob: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Data de Entrada
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.entryDate || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  entryDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between items-center">
                              <span>Data de Reajuste Anual</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setClientEditForm({
                                    ...clientEditForm,
                                    annualReadjustmentDate: clientEditForm.entryDate || new Date().toISOString().split("T")[0],
                                  });
                                }}
                                className="text-[10px] text-amber-600 hover:text-amber-700 underline font-medium"
                              >
                                Puxar Data de Entrada
                              </button>
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.annualReadjustmentDate || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  annualReadjustmentDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Frequência
                            </label>
                            <select
                              required
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.frequency || "Avulso"}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  frequency: e.target.value,
                                })
                              }
                            >
                              <option value="Semanal">Semanal</option>
                              <option value="Quinzenal">Quinzenal</option>
                              <option value="Mensal">Mensal</option>
                              <option value="Avulso">Avulso</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Fonte
                            </label>
                            <select
                              required
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.source || "Outros"}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  source: e.target.value,
                                })
                              }
                            >
                              <option value="Indicação de profissional">
                                Indicação de profissional
                              </option>
                              <option value="Projetos">Projetos</option>
                              <option value="Plataformas">Plataformas</option>
                              <option value="Instituição/ Igreja">
                                Instituição/ Igreja
                              </option>
                              <option value="Amigos/ conhecidos">
                                Amigos/ conhecidos
                              </option>
                              <option value="Google/ Site">Google/ Site</option>
                              <option value="Pacientes">Pacientes</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Seção: Dados do Responsável */}
                      <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/60">
                        <h4 className="font-semibold text-amber-800 text-sm mb-3 border-b border-amber-100/60 pb-1.5 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></span>
                          Dados do Responsável (se menor de idade ou financeiro)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Responsável (se menor de idade) ou Responsável Financeiro
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianName || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianName: e.target.value,
                                })
                              }
                              placeholder="Nome do responsável"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Telefone do Responsável
                            </label>
                            <input
                              type="tel"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianPhone || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianPhone: e.target.value,
                                })
                              }
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              CPF do Responsável
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianCpf || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianCpf: e.target.value,
                                })
                              }
                              placeholder="000.000.000-00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              E-mail do Responsável
                            </label>
                            <input
                              type="email"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianEmail || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianEmail: e.target.value,
                                })
                              }
                              placeholder="responsavel@email.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
<div>
                      <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
                        <span>Anotações / Prontuário</span>
                        <span className="text-slate-400 font-normal">
                          Campo privado
                        </span>
                      </label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm min-h-[100px] bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={clientEditForm.notes || ""}
                        onChange={(e) =>
                          setClientEditForm({
                            ...clientEditForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Insira seu histórico, notas, evolução..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEditingClientId(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg bg-white border border-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Paciente
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col xl:flex-row gap-3 justify-between items-center mt-4">
              <div className="relative w-full xl:max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-10 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm shadow-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={clientSearchText}
                  onChange={(e) => setClientSearchText(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl p-1 dark:bg-slate-800 dark:border-slate-700">
                  <label
                    className="text-slate-600 hover:bg-slate-100 p-2.5 rounded-lg transition cursor-pointer dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Importar Pacientes de Planilha (CSV)"
                  >
                    <FileUp className="w-5 h-5" />
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleImportCSV}
                    />
                  </label>
                  
                  <div className="w-px h-6 bg-slate-200 mx-0.5 dark:bg-slate-700" />
                  
                  <button
                    onClick={handleExportCSV}
                    className="text-slate-600 hover:bg-slate-100 p-2.5 rounded-lg transition dark:text-slate-300 dark:hover:bg-slate-700"
                    title="Exportar Pacientes para Planilha (CSV)"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-200 mx-0.5 dark:bg-slate-700" />

                  <button
                    onClick={() => setShowBirthdays(!showBirthdays)}
                    className={cn(
                      "p-2.5 rounded-lg transition",
                      showBirthdays
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                    title="Filtrar Aniversariantes do Mês"
                  >
                    <Gift className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-200 mx-0.5 dark:bg-slate-700" />

                  <button
                    onClick={() => {
                      if (clientGlobalInvoiceFilter === "all")
                        setClientGlobalInvoiceFilter("issued");
                      else if (clientGlobalInvoiceFilter === "issued")
                        setClientGlobalInvoiceFilter("pending");
                      else setClientGlobalInvoiceFilter("all");
                    }}
                    className={cn(
                      "p-2.5 rounded-lg transition",
                      clientGlobalInvoiceFilter === "issued"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                        : clientGlobalInvoiceFilter === "pending"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                    title="Filtro de Nota Fiscal: Geral / Emitidas / Pendentes"
                  >
                    <ReceiptText className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-200 mx-0.5 dark:bg-slate-700" />

                  <button
                    onClick={() => setShowInactiveClients(!showInactiveClients)}
                    className={cn(
                      "p-2.5 rounded-lg transition",
                      showInactiveClients
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                    title="Mostrar Pacientes Inativos"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCreateGeneralMeet}
                    disabled={isGeneratingMeet}
                    className="flex-1 sm:flex-none bg-indigo-600 border border-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center shadow-sm gap-2 font-medium text-sm disabled:opacity-70"
                    title="Gerar sala do Google Meet para consulta"
                  >
                    {isGeneratingMeet ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                    <span className="hidden sm:inline">Gerar Meet</span>
                  </button>

                  <button
                    onClick={() => {
                      setClientEditForm({ isActive: true });
                      setEditingClientId("new");
                    }}
                    className="flex-1 sm:flex-none bg-amber-500 text-white px-5 py-3 rounded-xl hover:bg-amber-600 transition flex items-center justify-center shadow-sm gap-2 font-medium text-sm"
                    title="Adicionar Paciente Manualmente"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>
            </div>

            {clients.length === 0 ? (
              <p className="text-slate-500">
                Nenhum paciente cadastrado ainda.
              </p>
            ) : filteredClients.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 shadow-sm mt-4">
                Nenhum paciente encontrado. Verifique a busca ou os filtros de
                ativos/inativos.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients
                  .slice()
                  .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                  .map((client) => {
                    const clientAppts = appointments.filter(
                      (a) => a.clientId === client.id,
                    );
                    const filteredClientAppts = clientAppts.filter((a) => {
                      let match = true;
                      if (sessionFilter !== "all") {
                        match =
                          match &&
                          (a.paymentStatus || "pending") === sessionFilter;
                      }
                      if (match && sessionMonthFilter !== "all") {
                        match =
                          match &&
                          new Date(a.datetime).getMonth() ===
                            sessionMonthFilter;
                      }
                      if (match && sessionYearFilter !== "all") {
                        match =
                          match &&
                          new Date(a.datetime).getFullYear() ===
                            sessionYearFilter;
                      }
                      return match;
                    });
                    return (
                      <div
                        key={client.id}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        {editingClientId === client.id ? (
                          <div
                            className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClientId(null);
                            }}
                          >
                            <div
                              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => setEditingClientId(null)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                              >
                                <X className="w-5 h-5" />
                              </button>
                              <form
                                onSubmit={handleClientSave}
                                className="space-y-4"
                              >
                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                  <h3 className="font-bold text-slate-900 text-xl">
                                    Editar Prontuário
                                  </h3>
                                </div>

                    <div className="space-y-6">
                      {/* Seção: Dados do Paciente */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-semibold text-slate-800 text-sm mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></span>
                          Dados do Paciente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Nome
                            </label>
                            <input
                              required
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.name || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              E-mail
                            </label>
                            <input
                              required
                              type="email"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.email || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Telefone
                            </label>
                            <input
                              required
                              type="tel"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.phone || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              CPF
                            </label>
                            <input
                              required
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.cpf || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  cpf: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Data de Nascimento
                            </label>
                            <input
                              required
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.dob || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  dob: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Data de Entrada
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.entryDate || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  entryDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between items-center">
                              <span>Data de Reajuste Anual</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setClientEditForm({
                                    ...clientEditForm,
                                    annualReadjustmentDate: clientEditForm.entryDate || new Date().toISOString().split("T")[0],
                                  });
                                }}
                                className="text-[10px] text-amber-600 hover:text-amber-700 underline font-medium"
                              >
                                Puxar Data de Entrada
                              </button>
                            </label>
                            <input
                              type="date"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.annualReadjustmentDate || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  annualReadjustmentDate: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Frequência
                            </label>
                            <select
                              required
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.frequency || "Avulso"}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  frequency: e.target.value,
                                })
                              }
                            >
                              <option value="Semanal">Semanal</option>
                              <option value="Quinzenal">Quinzenal</option>
                              <option value="Mensal">Mensal</option>
                              <option value="Avulso">Avulso</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Fonte
                            </label>
                            <select
                              required
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.source || "Outros"}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  source: e.target.value,
                                })
                              }
                            >
                              <option value="Indicação de profissional">
                                Indicação de profissional
                              </option>
                              <option value="Projetos">Projetos</option>
                              <option value="Plataformas">Plataformas</option>
                              <option value="Instituição/ Igreja">
                                Instituição/ Igreja
                              </option>
                              <option value="Amigos/ conhecidos">
                                Amigos/ conhecidos
                              </option>
                              <option value="Google/ Site">Google/ Site</option>
                              <option value="Pacientes">Pacientes</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <input
                              type="checkbox"
                              id={`active-${client.id}`}
                              className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                              checked={clientEditForm.isActive}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                            <label
                              htmlFor={`active-${client.id}`}
                              className="text-sm font-medium text-slate-700"
                            >
                              Paciente Ativo
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Seção: Dados do Responsável */}
                      <div className="bg-amber-50/20 p-4 rounded-xl border border-amber-100/60">
                        <h4 className="font-semibold text-amber-800 text-sm mb-3 border-b border-amber-100/60 pb-1.5 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></span>
                          Dados do Responsável (se menor de idade ou financeiro)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Responsável (se menor de idade) ou Responsável Financeiro
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianName || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianName: e.target.value,
                                })
                              }
                              placeholder="Nome do responsável"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Telefone do Responsável
                            </label>
                            <input
                              type="tel"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianPhone || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianPhone: e.target.value,
                                })
                              }
                              placeholder="(00) 00000-0000"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              CPF do Responsável
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianCpf || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianCpf: e.target.value,
                                })
                              }
                              placeholder="000.000.000-00"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              E-mail do Responsável
                            </label>
                            <input
                              type="email"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              value={clientEditForm.guardianEmail || ""}
                              onChange={(e) =>
                                setClientEditForm({
                                  ...clientEditForm,
                                  guardianEmail: e.target.value,
                                })
                              }
                              placeholder="responsavel@email.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
<div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
                                    <span>Anotações / Prontuário</span>
                                    <span className="text-slate-400 font-normal">
                                      Campo privado
                                    </span>
                                  </label>
                                  <textarea
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm min-h-[100px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                                    value={clientEditForm.notes || ""}
                                    onChange={(e) =>
                                      setClientEditForm({
                                        ...clientEditForm,
                                        notes: e.target.value,
                                      })
                                    }
                                    placeholder="Insira seu histórico, notas, evolução..."
                                  ></textarea>
                                </div>

                                {client.statusHistory &&
                                  client.statusHistory.length > 0 && (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                                      <p className="font-semibold mb-2">
                                        Histórico de Alterações de Status:
                                      </p>
                                      <ul className="list-disc pl-4 space-y-1">
                                        {(client.statusHistory as any[]).map(
                                          (h, i) => (
                                            <li key={i}>
                                              {!isNaN(
                                                new Date(h.date).getTime(),
                                              )
                                                ? format(
                                                    new Date(h.date),
                                                    "dd/MM/yyyy HH:mm",
                                                  )
                                                : h.date}{" "}
                                              -{" "}
                                              {h.action === "activated"
                                                ? "Conta Ativada"
                                                : "Conta Inativada"}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingClientId(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 bg-white"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2"
                                  >
                                    <Check className="w-4 h-4" /> Salvar
                                    Prontuário
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div
                              className="flex flex-col cursor-pointer"
                              onClick={() =>
                                setExpandedClientId(
                                  expandedClientId === client.id
                                    ? null
                                    : client.id,
                                )
                              }
                            >
                              <div
                                className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2 mb-3 w-full"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenNotification(client);
                                  }}
                                  className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex-shrink-0"
                                  title="Enviar Notificação"
                                >
                                  <MessagesSquare className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClientEdit(client);
                                  }}
                                  className="flex items-center justify-center gap-1.5 text-amber-500 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap border border-transparent hover:border-amber-100 flex-1 sm:flex-none"
                                >
                                  <User className="w-4 h-4" /> Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClientDelete(client.id);
                                  }}
                                  className="flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap border border-transparent hover:border-red-100 flex-1 sm:flex-none"
                                >
                                  <Trash2 className="w-4 h-4" /> Excluir
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedClientId(
                                      expandedClientId === client.id
                                        ? null
                                        : client.id,
                                    );
                                  }}
                                  className="flex items-center justify-center gap-1.5 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex-1 sm:flex-none"
                                >
                                  <span className="underline underline-offset-4 decoration-slate-200">
                                    {expandedClientId === client.id
                                      ? "Esconder Histórico"
                                      : "Ver Histórico"}
                                  </span>
                                </button>
                              </div>

                              <h3 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2 mb-1">
                                {client.name}
                                {(client.isActive ?? true) ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium">
                                    Ativo
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium">
                                    Inativo
                                  </span>
                                )}
                              </h3>

                              {client.annualReadjustmentDate &&
                                (() => {
                                  const parts = client.annualReadjustmentDate.split("-");
                                  if (parts.length < 2) return null;
                                  const readjustmentMonth = parseInt(parts[1], 10) - 1;
                                  const currentMonth = new Date().getMonth();
                                  const currentYear = new Date().getFullYear();
                                  const isConfirmedThisYear = client.lastReadjustmentConfirmedYear === currentYear;

                                  if (readjustmentMonth === currentMonth && !isConfirmedThisYear) {
                                    return (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-amber-50 border border-amber-200 rounded-xl p-3 my-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                      >
                                        <div className="flex items-start gap-2">
                                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-bold text-amber-900">
                                              Mês de Reajuste Anual!
                                            </p>
                                            <p className="text-xs text-amber-700 leading-relaxed">
                                              Este paciente está no mês de reajuste anual acordado em{" "}
                                              <strong className="font-semibold">
                                                {format(
                                                  new Date(client.annualReadjustmentDate + "T12:00:00"),
                                                  "dd/MM/yyyy",
                                                )}
                                              </strong>
                                              .
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReadjustmentPercent("");
                                            setReadjustmentNewValue("");
                                            setReadjustmentNotes("");
                                            setReadjustmentConfirmModal({
                                              isOpen: true,
                                              entity: client,
                                              type: "client",
                                            });
                                          }}
                                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                                        >
                                          Confirmar Reajuste
                                        </button>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                              <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                                <span className="hidden sm:inline">
                                  {client.email} •{" "}
                                </span>
                                {client.phone} • CPF: {client.cpf} • Nasc:{" "}
                                {client.dob
                                  ? !isNaN(new Date(client.dob).getTime())
                                    ? format(
                                        new Date(client.dob).getTime() +
                                          new Date(
                                            client.dob,
                                          ).getTimezoneOffset() *
                                            60000,
                                        "dd/MM/yyyy",
                                      )
                                    : client.dob
                                  : "-"}
                              </p>
                              {client.createdAt && (
                                <p className="text-xs text-slate-500 mb-3 -mt-2 flex items-center gap-1.5">
                                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    Entrada no sistema:{" "}
                                    <strong className="text-slate-600 font-semibold">
                                      {(() => {
                                        const d = client.createdAt;
                                        if (d.toDate)
                                          return format(
                                            d.toDate(),
                                            "dd/MM/yyyy",
                                          );
                                        if (d.seconds)
                                          return format(
                                            new Date(d.seconds * 1000),
                                            "dd/MM/yyyy",
                                          );
                                        const dateObj = new Date(d);
                                        if (!isNaN(dateObj.getTime()))
                                          return format(dateObj, "dd/MM/yyyy");
                                        return String(d);
                                      })()}
                                    </strong>
                                  </span>
                                </p>
                              )}
                              {(client.guardianName ||
                                client.guardianPhone ||
                                client.guardianCpf ||
                                client.guardianEmail) && (
                                <p className="text-xs text-slate-500 mb-3 -mt-2">
                                  Responsável:{" "}
                                  <strong className="text-slate-600">
                                    {client.guardianName || "-"}
                                  </strong>
                                  {client.guardianPhone && (
                                    <>
                                      {" "}• Tel:{" "}
                                      <strong className="text-slate-600">
                                        {client.guardianPhone}
                                      </strong>
                                    </>
                                  )}
                                  {client.guardianCpf && (
                                    <>
                                      {" "}• CPF:{" "}
                                      <strong className="text-slate-600">
                                        {client.guardianCpf}
                                      </strong>
                                    </>
                                  )}
                                  {client.guardianEmail && (
                                    <>
                                      {" "}• Email:{" "}
                                      <strong className="text-slate-600">
                                        {client.guardianEmail}
                                      </strong>
                                    </>
                                  )}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 border border-amber-100 rounded-full font-semibold uppercase tracking-wide">
                                  Fonte: {client.source || "Não informada"}
                                </span>
                                <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 border border-blue-100 rounded-full font-semibold uppercase tracking-wide">
                                  Frequência: {client.frequency || "Avulso"}
                                </span>
                                {client.lgpdAccepted ? (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border border-emerald-100 rounded-full font-semibold uppercase tracking-wide flex items-center gap-1">
                                    <Check className="w-3 h-3" /> LGPD Aceito
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 border border-slate-200 rounded-full font-semibold uppercase tracking-wide">
                                    LGPD Pendente
                                  </span>
                                )}
                                {signatures.some(
                                  (s) =>
                                    s.identifier === client.cpf &&
                                    s.type === "client",
                                ) ? (
                                  <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 border border-blue-100 rounded-full font-semibold uppercase tracking-wide flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Contrato
                                    Assinado
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 border border-slate-200 rounded-full font-semibold uppercase tracking-wide">
                                    Contrato Pendente
                                  </span>
                                )}
                              </div>
                            </div>

                            {expandedClientId === client.id && (
                              <div
                                className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedClientId(null);
                                }}
                              >
                                <div
                                  className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setExpandedClientId(null)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                  <div className="mb-4 pb-2 border-b border-slate-100 pr-12">
                                    <h3 className="text-xl font-bold text-slate-800">
                                      Histórico: {client.name}
                                    </h3>
                                  </div>
                                  <div className="mt-2 text-left">
                                    <div className="mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                      <div className="flex items-center gap-2.5">
                                        <div className="bg-amber-100/80 p-2 rounded-lg text-amber-600 font-sans">
                                          <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-slate-800 font-sans">
                                            Primeiro Cadastro / Entrada no
                                            Sistema
                                          </h4>
                                          <p className="text-xs text-slate-500 mt-0.5 font-sans">
                                            Data oficial de ingresso do paciente
                                            no sistema.
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg self-start sm:self-auto font-sans">
                                        {client.createdAt
                                          ? (() => {
                                              const d = client.createdAt;
                                              if (d.toDate)
                                                return format(
                                                  d.toDate(),
                                                  "dd/MM/yyyy 'às' HH:mm",
                                                );
                                              if (d.seconds)
                                                return format(
                                                  new Date(d.seconds * 1000),
                                                  "dd/MM/yyyy 'às' HH:mm",
                                                );
                                              const dateObj = new Date(d);
                                              if (!isNaN(dateObj.getTime()))
                                                return format(
                                                  dateObj,
                                                  "dd/MM/yyyy 'às' HH:mm",
                                                );
                                              return String(d);
                                            })()
                                          : "Data de cadastro não disponível"}
                                      </div>
                                    </div>

                                    {signatures.filter(
                                      (s) =>
                                        s.identifier === client.cpf &&
                                        s.type === "client",
                                    ).length > 0 && (
                                      <div className="mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                        <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                          Histórico de Assinaturas (Contrato e
                                          LGPD)
                                        </h4>
                                        <div className="grid gap-2">
                                          {signatures
                                            .filter(
                                              (s) =>
                                                s.identifier === client.cpf &&
                                                s.type === "client",
                                            )
                                            .sort(
                                              (a, b) =>
                                                (b.signedAt?.toMillis
                                                  ? b.signedAt.toMillis()
                                                  : 0) -
                                                (a.signedAt?.toMillis
                                                  ? a.signedAt.toMillis()
                                                  : 0),
                                            )
                                            .map((sig) => (
                                              <div
                                                key={sig.id}
                                                className="bg-white border border-emerald-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                                              >
                                                <div>
                                                  <div className="font-semibold text-slate-800 text-sm">
                                                    {sig.name}
                                                  </div>
                                                  <div className="text-slate-500 text-xs mt-0.5">
                                                    CPF: {sig.identifier} •
                                                    E-mail: {sig.email}
                                                  </div>
                                                </div>
                                                <div className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-start sm:self-auto flex-shrink-0">
                                                  {sig.signedAt?.toDate
                                                    ? sig.signedAt
                                                        .toDate()
                                                        .toLocaleString("pt-BR")
                                                    : "Data não disponível"}
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                    {client.notes && (
                                      <div className="mb-6 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                          <Settings className="w-4 h-4 text-slate-400" />{" "}
                                          Anotações Gerais do Prontuário
                                        </h4>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                          {client.notes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Histórico de Reajustes Anuais */}
                                     <ReadjustmentHistoryManager
                                       userId={userId}
                                       entityId={client.id}
                                       entityType="client"
                                       history={client.readjustmentHistory || []}
                                       onHistoryUpdated={(newHistory) => {
                                         setClients((prev) =>
                                           prev.map((c) =>
                                             c.id === client.id
                                               ? { ...c, readjustmentHistory: newHistory }
                                               : c,
                                           ),
                                         );
                                       }}
                                     />

                                     {/* Central de Documentos do Paciente */}
                                    <div className="mb-6 bg-slate-50 p-4 pb-5 rounded-xl border border-slate-200 shadow-sm">
                                      <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-slate-500" />{" "}
                                          Central de Anexos e Documentos
                                        </h4>
                                        <label className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-75">
                                          {uploadingClientId === client.id ? (
                                            <>
                                              <RefreshCw className="w-3 h-3 animate-spin" />{" "}
                                              Enviando...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-3 h-3" /> Arquivo Geral
                                            </>
                                          )}
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleClientFileUpload(e, client.id)}
                                            disabled={uploadingClientId === client.id}
                                          />
                                        </label>
                                      </div>
                                      
                                      <div className="grid gap-2">
                                        {/* General Documents */}
                                        {(client.documents || []).map((doc: any, i: number) => (
                                          <div key={`gen-${i}`} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-sm transition">
                                            <a
                                              href={doc.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-2 flex-1 text-indigo-600 hover:text-indigo-700 min-w-0"
                                            >
                                              <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                              <span className="truncate font-medium text-slate-700">{doc.name}</span>
                                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-semibold hidden sm:inline-block">Geral/Paciente</span>
                                            </a>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClientDocument(client.id, i);
                                              }}
                                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg flex-shrink-0"
                                              title="Excluir anexo"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}

                                        {/* Activity Documents */}
                                        {clientAppts
                                          .filter((ap) => ap.documents && ap.documents.length > 0)
                                          .map((ap) => 
                                            ap.documents.map((doc: any, i: number) => (
                                              <div key={`app-${ap.id}-${i}`} className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-sm transition">
                                                <a
                                                  href={doc.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2 flex-1 text-indigo-600 hover:text-indigo-700 min-w-0"
                                                >
                                                  <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                                                    <span className="truncate font-medium text-slate-700">{doc.name}</span>
                                                    <span className="text-[10px] text-slate-400 truncate">Serviço: {ap.serviceName || "Sessão"} • Data: {format(new Date(ap.datetime), "dd/MM/yyyy")}</span>
                                                  </div>
                                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-semibold hidden sm:inline-block">Sessão</span>
                                                </a>
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteAppointmentDocument(ap.id, i);
                                                  }}
                                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg flex-shrink-0"
                                                  title="Excluir anexo da sessão"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ))
                                          )}
                                          
                                        {!(client.documents?.length > 0) && !clientAppts.some((ap) => ap.documents?.length > 0) && (
                                          <div className="text-center p-4 border border-dashed border-slate-200 rounded-lg bg-white/50 text-sm text-slate-400">
                                            Nenhum anexo ou documento encontrado para este paciente.
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end mb-4 gap-4">
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-800 mb-2">
                                          Histórico de Serviços e Financeiro
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <button
                                            onClick={() =>
                                              setSessionFilter("all")
                                            }
                                            className={cn(
                                              "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                              sessionFilter === "all"
                                                ? "bg-marsala-700 text-white border-slate-800"
                                                : "bg-white text-slate-600 border-slate-200",
                                            )}
                                          >
                                            Todas
                                          </button>
                                          <button
                                            onClick={() =>
                                              setSessionFilter("paid")
                                            }
                                            className={cn(
                                              "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                              sessionFilter === "paid"
                                                ? "bg-emerald-600 text-white border-emerald-600"
                                                : "bg-white text-emerald-700 border-emerald-200",
                                            )}
                                          >
                                            Pagas
                                          </button>
                                          <button
                                            onClick={() =>
                                              setSessionFilter("pending")
                                            }
                                            className={cn(
                                              "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                              sessionFilter === "pending"
                                                ? "bg-amber-500 text-white border-amber-500"
                                                : "bg-white text-amber-700 border-amber-200",
                                            )}
                                          >
                                            Pendentes
                                          </button>
                                          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                                          <select
                                            value={sessionMonthFilter}
                                            onChange={(e) =>
                                              setSessionMonthFilter(
                                                e.target.value === "all"
                                                  ? "all"
                                                  : Number(e.target.value),
                                              )
                                            }
                                            className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                          >
                                            <option value="all">
                                              Mês: Todos
                                            </option>
                                            {[
                                              "Jan",
                                              "Fev",
                                              "Mar",
                                              "Abr",
                                              "Mai",
                                              "Jun",
                                              "Jul",
                                              "Ago",
                                              "Set",
                                              "Out",
                                              "Nov",
                                              "Dez",
                                            ].map((m, i) => (
                                              <option key={i} value={i}>
                                                {m}
                                              </option>
                                            ))}
                                          </select>
                                          <select
                                            value={sessionYearFilter}
                                            onChange={(e) =>
                                              setSessionYearFilter(
                                                e.target.value === "all"
                                                  ? "all"
                                                  : Number(e.target.value),
                                              )
                                            }
                                            className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                          >
                                            <option value="all">
                                              Ano: Todos
                                            </option>
                                            {[2024, 2025, 2026, 2027, 2028].map(
                                              (y) => (
                                                <option key={y} value={y}>
                                                  {y}
                                                </option>
                                              ),
                                            )}
                                          </select>
                                        </div>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                        <button
                                          onClick={() =>
                                            handleDuplicateLastSession(
                                              client.id,
                                              client.name,
                                            )
                                          }
                                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto"
                                          title="Duplicar informações do último serviço registrado"
                                        >
                                          <Copy className="w-4 h-4" /> Duplicar
                                          Anterior
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleAddSession(
                                              client.id,
                                              client.name,
                                            )
                                          }
                                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto"
                                        >
                                          <Plus className="w-4 h-4" /> Novo
                                          Serviço
                                        </button>
                                      </div>
                                    </div>

                                    {editingAppointmentId === "new" &&
                                      appointmentEditForm.clientId ===
                                        client.id && (
                                        <form
                                          onSubmit={(e) =>
                                            handleAppointmentSave(e, client.id)
                                          }
                                          className="bg-slate-50 p-4 pb-0 rounded-xl border border-slate-200 mb-4 animate-in fade-in"
                                        >
                                          <h4 className="font-semibold text-slate-800 mb-3">
                                            Registrar Novo Serviço
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3 text-sm">
                                            <div>
                                              <label className="block text-slate-600 mb-1">
                                                Data
                                              </label>
                                              <input
                                                type="date"
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={appointmentEditForm.date}
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    date: e.target.value,
                                                  })
                                                }
                                              />
                                            </div>
                                            <div className="md:col-span-2">
                                              <label className="block text-slate-600 mb-1">
                                                Serviço Prestado
                                              </label>
                                              <select
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.serviceId ||
                                                  ""
                                                }
                                                onChange={(e) => {
                                                  const s = (
                                                    profileData?.services || []
                                                  ).find(
                                                    (x: any) =>
                                                      (x.id || x.title) ===
                                                      e.target.value,
                                                  );
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    serviceId: e.target.value,
                                                    serviceName: s?.title || "",
                                                    totalAmount:
                                                      s?.price > 0
                                                        ? s.price
                                                        : appointmentEditForm.totalAmount,
                                                  });
                                                }}
                                              >
                                                <option value="">
                                                  Selecione o Serviço...
                                                </option>
                                                {(profileData?.services || [])
                                                  .filter(
                                                    (s: any) =>
                                                      s.category === "voce",
                                                  )
                                                  .map((s: any) => (
                                                    <option
                                                      value={s.id || s.title}
                                                      key={
                                                        s.id ||
                                                        s.title ||
                                                        Math.random().toString()
                                                      }
                                                    >
                                                      {s.title}
                                                    </option>
                                                  ))}
                                              </select>
                                            </div>
                                            <div>
                                              <label
                                                className="block text-slate-600 mb-1"
                                                title="Quantidade de Horas"
                                              >
                                                Qtd Horas
                                              </label>
                                              <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.hoursQty ||
                                                  1
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    hoursQty: Number(
                                                      e.target.value,
                                                    ),
                                                  })
                                                }
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-slate-600 mb-1">
                                                Valor (R$)
                                              </label>
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.totalAmount
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    totalAmount: Number(
                                                      e.target.value,
                                                    ),
                                                  })
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-sm">
                                            <div>
                                              <label className="block text-slate-600 mb-1">
                                                Status Financeiro
                                              </label>
                                              <select
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.paymentStatus
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    paymentStatus:
                                                      e.target.value,
                                                  })
                                                }
                                              >
                                                <option value="pending">
                                                  Pendente
                                                </option>
                                                <option value="paid">
                                                  Pago
                                                </option>
                                              </select>
                                            </div>
                                            <div>
                                              <label className="block text-slate-600 mb-1">
                                                Status NF
                                              </label>
                                              <select
                                                required
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.invoiceStatus ||
                                                  "pending"
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    invoiceStatus:
                                                      e.target.value,
                                                  })
                                                }
                                              >
                                                <option value="pending">
                                                  Pendente / Não Emitida
                                                </option>
                                                <option value="issued">
                                                  Emitida
                                                </option>
                                              </select>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                                            <div>
                                              <label className="block text-slate-600 mb-1">
                                                Modalidade
                                              </label>
                                              <select
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.modality ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    modality: e.target.value,
                                                  })
                                                }
                                              >
                                                <option value="">
                                                  Selecione...
                                                </option>
                                                <option value="On line">
                                                  On line
                                                </option>
                                                <option value="Presencial">
                                                  Presencial
                                                </option>
                                                <option value="Híbrido">
                                                  Híbrido
                                                </option>
                                              </select>
                                            </div>
                                            <div>
                                              <div className="flex justify-between items-center mb-1">
                                                <label className="text-slate-600 font-medium">
                                                  Local / Conta Faturamento
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    setIsManageAccountsOpen(
                                                      true,
                                                    )
                                                  }
                                                  className="text-amber-500 hover:text-amber-600 text-xs font-semibold flex items-center gap-0.5 pointer-events-auto"
                                                  title="Gerenciar Contas"
                                                >
                                                  <Settings className="w-3.5 h-3.5 inline" />
                                                  Gerenciar
                                                </button>
                                              </div>
                                              <select
                                                className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                value={
                                                  appointmentEditForm.billingAccount ||
                                                  ""
                                                }
                                                onChange={(e) =>
                                                  setAppointmentEditForm({
                                                    ...appointmentEditForm,
                                                    billingAccount:
                                                      e.target.value,
                                                  })
                                                }
                                              >
                                                <option value="">
                                                  Para onde foi pago...
                                                </option>
                                                {billingAccounts.map((acc) => (
                                                  <option key={acc} value={acc}>
                                                    {acc}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                          </div>
                                          <div className="mb-4 text-sm">
                                            <label className="block text-slate-600 mb-1">
                                              Anotações do Serviço
                                            </label>
                                            <textarea
                                              className="w-full p-2 border rounded focus:ring-amber-400 min-h-[60px] bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={appointmentEditForm.notes}
                                              onChange={(e) =>
                                                setAppointmentEditForm({
                                                  ...appointmentEditForm,
                                                  notes: e.target.value,
                                                })
                                              }
                                              placeholder="Resumo do atendimento, temas abordados..."
                                            ></textarea>
                                          </div>
                                          <div className="flex justify-end gap-2 pb-4">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditingAppointmentId(null)
                                              }
                                              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 border rounded"
                                            >
                                              Cancelar
                                            </button>
                                            <button
                                              type="submit"
                                              className="px-3 py-1.5 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded transition"
                                            >
                                              Salvar Serviço
                                            </button>
                                          </div>
                                        </form>
                                      )}

                                    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
                                      <table className="w-full text-left text-sm text-slate-600 border-collapse min-w-[600px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                          <tr>
                                            <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                              Detalhes do Serviço
                                            </th>
                                            <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                              Data
                                            </th>
                                            <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                              Valores / Status
                                            </th>
                                            <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                              Anotações
                                            </th>
                                            <th className="p-3 font-semibold text-slate-700 text-right w-[80px]">
                                              Ação
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {filteredClientAppts
                                            .sort(
                                              (a, b) =>
                                                new Date(b.datetime).getTime() -
                                                new Date(a.datetime).getTime(),
                                            )
                                            .map((ap) => (
                                              <React.Fragment key={ap.id}>
                                                {editingAppointmentId ===
                                                ap.id ? (
                                                  <tr className="bg-amber-50/50 border-b border-slate-100">
                                                    <td
                                                      colSpan={5}
                                                      className="p-4"
                                                    >
                                                      <form
                                                        onSubmit={(e) =>
                                                          handleAppointmentSave(
                                                            e,
                                                            client.id,
                                                          )
                                                        }
                                                        className="flex flex-col gap-3"
                                                      >
                                                        <div className="flex flex-wrap gap-3 items-center">
                                                          <input
                                                            type="date"
                                                            required
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.date ||
                                                              ""
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  date: e.target
                                                                    .value,
                                                                },
                                                              )
                                                            }
                                                          />
                                                          <select
                                                            required
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm max-w-[200px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.serviceId ||
                                                              ""
                                                            }
                                                            onChange={(e) => {
                                                              const s = (
                                                                profileData?.services ||
                                                                []
                                                              ).find(
                                                                (x: any) =>
                                                                  x.id ===
                                                                  e.target
                                                                    .value,
                                                              );
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  serviceId:
                                                                    e.target
                                                                      .value,
                                                                  serviceName:
                                                                    s?.title ||
                                                                    "",
                                                                  totalAmount:
                                                                    s?.price > 0
                                                                      ? s.price
                                                                      : appointmentEditForm.totalAmount,
                                                                },
                                                              );
                                                            }}
                                                          >
                                                            <option value="">
                                                              Serviço...
                                                            </option>
                                                            {(
                                                              profileData?.services ||
                                                              []
                                                            )
                                                              .filter(
                                                                (s: any) =>
                                                                  s.category ===
                                                                  "voce",
                                                              )
                                                              .map((s: any) => (
                                                                <option
                                                                  value={
                                                                    s.id ||
                                                                    s.title
                                                                  }
                                                                  key={
                                                                    s.id ||
                                                                    s.title ||
                                                                    Math.random().toString()
                                                                  }
                                                                >
                                                                  {s.title}
                                                                </option>
                                                              ))}
                                                          </select>
                                                          <div className="flex items-center gap-1">
                                                            <span className="text-slate-500 text-xs">
                                                              Qtd
                                                            </span>
                                                            <input
                                                              type="number"
                                                              step="1"
                                                              min="1"
                                                              required
                                                              className="p-1.5 border w-16 rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                              value={
                                                                appointmentEditForm.hoursQty ||
                                                                1
                                                              }
                                                              onChange={(e) =>
                                                                setAppointmentEditForm(
                                                                  {
                                                                    ...appointmentEditForm,
                                                                    hoursQty:
                                                                      Number(
                                                                        e.target
                                                                          .value,
                                                                      ),
                                                                  },
                                                                )
                                                              }
                                                              title="Quantidade de Horas"
                                                            />
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                            <span className="text-slate-500">
                                                              R$
                                                            </span>
                                                            <input
                                                              type="number"
                                                              step="0.01"
                                                              min="0"
                                                              required
                                                              className="p-1.5 border w-24 rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                              value={
                                                                appointmentEditForm.totalAmount
                                                              }
                                                              onChange={(e) =>
                                                                setAppointmentEditForm(
                                                                  {
                                                                    ...appointmentEditForm,
                                                                    totalAmount:
                                                                      Number(
                                                                        e.target
                                                                          .value,
                                                                      ),
                                                                  },
                                                                )
                                                              }
                                                            />
                                                          </div>
                                                          <select
                                                            required
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.paymentStatus
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  paymentStatus:
                                                                    e.target
                                                                      .value,
                                                                },
                                                              )
                                                            }
                                                          >
                                                            <option value="pending">
                                                              Pendente
                                                            </option>
                                                            <option value="paid">
                                                              Pago
                                                            </option>
                                                          </select>
                                                          <select
                                                            required
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.invoiceStatus ||
                                                              "pending"
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  invoiceStatus:
                                                                    e.target
                                                                      .value,
                                                                },
                                                              )
                                                            }
                                                          >
                                                            <option value="pending">
                                                              NF Pend.
                                                            </option>
                                                            <option value="issued">
                                                              NF Emitida
                                                            </option>
                                                          </select>
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 items-center">
                                                          <select
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm w-[120px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.modality ||
                                                              ""
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  modality:
                                                                    e.target
                                                                      .value,
                                                                },
                                                              )
                                                            }
                                                          >
                                                            <option value="">
                                                              Modalidade...
                                                            </option>
                                                            <option value="On line">
                                                              On line
                                                            </option>
                                                            <option value="Presencial">
                                                              Presencial
                                                            </option>
                                                            <option value="Híbrido">
                                                              Híbrido
                                                            </option>
                                                          </select>
                                                          <select
                                                            className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm flex-1 min-w-[150px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.billingAccount ||
                                                              ""
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  billingAccount:
                                                                    e.target
                                                                      .value,
                                                                },
                                                              )
                                                            }
                                                          >
                                                            <option value="">
                                                              Local / Conta...
                                                            </option>
                                                            <option value="ELO">
                                                              ELO
                                                            </option>
                                                            <option value="MEI Carla">
                                                              MEI Carla
                                                            </option>
                                                            <option value="CPF Marcio">
                                                              CPF Marcio
                                                            </option>
                                                            <option value="CPF Carla">
                                                              CPF Carla
                                                            </option>
                                                            <option value="Dinheiro">
                                                              Dinheiro
                                                            </option>
                                                          </select>
                                                        </div>
                                                        <div>
                                                          <input
                                                            type="text"
                                                            placeholder="Anotações curtas..."
                                                            className="w-full p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              appointmentEditForm.notes ||
                                                              ""
                                                            }
                                                            onChange={(e) =>
                                                              setAppointmentEditForm(
                                                                {
                                                                  ...appointmentEditForm,
                                                                  notes:
                                                                    e.target
                                                                      .value,
                                                                },
                                                              )
                                                            }
                                                          />
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                          <button
                                                            type="button"
                                                            onClick={() =>
                                                              setEditingAppointmentId(
                                                                null,
                                                              )
                                                            }
                                                            className="px-3 py-1 text-slate-600 hover:bg-slate-200 border rounded text-xs font-medium"
                                                          >
                                                            Cancelar
                                                          </button>
                                                          <button
                                                            type="submit"
                                                            className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-xs font-medium"
                                                          >
                                                            Salvar
                                                          </button>
                                                        </div>
                                                      </form>
                                                    </td>
                                                  </tr>
                                                ) : (
                                                  <tr className="border-b border-slate-100 hover:bg-slate-50 group transition-colors">
                                                    <td className="p-3 border-r border-slate-100 font-medium">
                                                      <p>
                                                        {ap.serviceName ||
                                                          "Sessão Padrão"}
                                                      </p>
                                                      {(ap.modality ||
                                                        ap.billingAccount ||
                                                        ap.priceAdjust) && (
                                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                          {ap.modality && (
                                                            <span className="bg-slate-100 text-slate-600 px-1.5 border border-slate-200 py-0.5 rounded text-[10px] uppercase font-bold">
                                                              {ap.modality}
                                                            </span>
                                                          )}
                                                          {ap.billingAccount && (
                                                            <span className="bg-amber-50 text-amber-600 px-1.5 border border-amber-200 py-0.5 rounded text-[10px] font-bold">
                                                              {
                                                                ap.billingAccount
                                                              }
                                                            </span>
                                                          )}
                                                        </div>
                                                      )}
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap border-r border-slate-100">
                                                      {!isNaN(
                                                        new Date(
                                                          ap.datetime,
                                                        ).getTime(),
                                                      )
                                                        ? format(
                                                            new Date(
                                                              ap.datetime,
                                                            ),
                                                            "dd/MM/yyyy",
                                                          )
                                                        : ap.datetime}
                                                      <div className="text-xs text-slate-500 mt-1">
                                                        {ap.hoursQty || 1}{" "}
                                                        {ap.hoursQty > 1
                                                          ? "Horas"
                                                          : "Hora"}
                                                      </div>
                                                    </td>
                                                    <td className="p-3 border-r border-slate-100">
                                                      <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium">
                                                          {formatMoneyUI(
                                                            Number(
                                                              ap.totalAmount ||
                                                                0,
                                                            ),
                                                            hideFinance,
                                                          )}
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-1">
                                                          {ap.priceAdjust && (
                                                            <span className="bg-marsala-700 text-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                              {ap.priceAdjust}
                                                            </span>
                                                          )}
                                                          <select
                                                            className={cn(
                                                              "text-[10px] p-0.5 border-slate-200 rounded outline-none w-20 font-bold",
                                                              (ap.paymentStatus ||
                                                                "pending") ===
                                                                "paid"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-orange-100 text-orange-700",
                                                            )}
                                                            value={
                                                              ap.paymentStatus ||
                                                              "pending"
                                                            }
                                                            onChange={(e) =>
                                                              handleClientPaymentStatusChange(
                                                                ap.id,
                                                                e.target.value,
                                                              )
                                                            }
                                                          >
                                                            <option value="pending">
                                                              Pgto Pend.
                                                            </option>
                                                            <option value="paid">
                                                              Pago
                                                            </option>
                                                          </select>
                                                          <select
                                                            className={cn(
                                                              "text-[10px] p-0.5 border-slate-200 rounded outline-none font-bold",
                                                              (ap.invoiceStatus ||
                                                                "pending") ===
                                                                "issued"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-orange-100 text-orange-700",
                                                            )}
                                                            value={
                                                              ap.invoiceStatus ||
                                                              "pending"
                                                            }
                                                            onChange={(e) =>
                                                              handleClientInvoiceStatusChange(
                                                                ap.id,
                                                                e.target.value,
                                                              )
                                                            }
                                                          >
                                                            <option value="pending">
                                                              NF Pendente
                                                            </option>
                                                            <option value="issued">
                                                              NF Emitida
                                                            </option>
                                                          </select>
                                                        </div>
                                                      </div>
                                                    </td>
                                                    <td className="p-3 border-r border-slate-100 text-xs text-slate-600">
                                                      <div
                                                        className="italic mb-1"
                                                        title={ap.notes}
                                                      >
                                                        {ap.notes || "-"}
                                                      </div>
                                                      {ap.documents?.length >
                                                        0 && (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                          {ap.documents.map(
                                                            (
                                                              doc: any,
                                                              i: number,
                                                            ) => (
                                                              <div key={i} className="flex items-center gap-1 group/doc">
                                                                <a
                                                                  href={doc.url}
                                                                  target="_blank"
                                                                  rel="noreferrer"
                                                                  className="text-amber-500 hover:text-amber-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                                                                  title={doc.name}
                                                                >
                                                                  <Upload className="w-3 h-3 flex-shrink-0" />{" "}
                                                                  <span className="truncate">{doc.name}</span>
                                                                </a>
                                                                <button 
                                                                  onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteAppointmentDocument(ap.id, i);
                                                                  }}
                                                                  className="text-rose-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 flex-shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity"
                                                                  title="Excluir"
                                                                >
                                                                  <Trash2 className="w-3 h-3" />
                                                                </button>
                                                              </div>
                                                            ),
                                                          )}
                                                        </div>
                                                      )}
                                                    </td>
                                                    <td className="p-3 text-right whitespace-nowrap">
                                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                                        <label
                                                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer relative"
                                                          title="Upload Comprovante/Doc"
                                                        >
                                                          {uploadingAppointmentId ===
                                                          ap.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                          ) : (
                                                            <Upload className="w-4 h-4" />
                                                          )}
                                                          <input
                                                            type="file"
                                                            className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                                                            onChange={(e) =>
                                                              handleFileUpload(
                                                                e,
                                                                ap.id,
                                                              )
                                                            }
                                                            disabled={
                                                              uploadingAppointmentId ===
                                                              ap.id
                                                            }
                                                          />
                                                        </label>
                                                        <button
                                                          onClick={() =>
                                                            handleEditSession(
                                                              ap,
                                                            )
                                                          }
                                                          className="p-1.5 text-amber-500 hover:bg-amber-100 rounded-lg transition"
                                                          title="Editar"
                                                        >
                                                          <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            handleAppointmentDelete(
                                                              ap.id,
                                                            )
                                                          }
                                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                          title="Excluir"
                                                        >
                                                          <Trash2 className="w-4 h-4" />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            ))}
                                          {filteredClientAppts.length === 0 &&
                                            editingAppointmentId !== "new" && (
                                              <tr>
                                                <td
                                                  colSpan={5}
                                                  className="p-6 text-center text-slate-500 bg-slate-50/50"
                                                >
                                                  Nenhuma sessão encontrada para
                                                  este filtro.
                                                </td>
                                              </tr>
                                            )}
                                        </tbody>
                                      </table>
                                      {filteredClientAppts.length > 0 &&
                                        sessionFilter === "pending" && (
                                          <div className="bg-amber-50 p-4 flex flex-col sm:flex-row justify-between items-center text-sm border-t border-amber-100">
                                            <span className="font-semibold text-amber-800">
                                              Total Pendente:
                                            </span>
                                            <span className="font-bold text-amber-900 text-xl">
                                              {formatMoneyUI(
                                                filteredClientAppts
                                                  .filter(
                                                    (a: any) =>
                                                      (a.paymentStatus ||
                                                        "pending") ===
                                                      "pending",
                                                  )
                                                  .reduce(
                                                    (acc: number, curr: any) =>
                                                      acc +
                                                      Number(
                                                        curr.totalAmount || 0,
                                                      ),
                                                    0,
                                                  ),
                                                hideFinance,
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      {filteredClientAppts.length > 0 &&
                                        sessionFilter === "paid" && (
                                          <div className="bg-emerald-50 p-4 flex flex-col sm:flex-row justify-between items-center text-sm border-t border-emerald-100">
                                            <span className="font-semibold text-emerald-800">
                                              Total Pago (Período/Histórico):
                                            </span>
                                            <span className="font-bold text-emerald-900 text-xl">
                                              {formatMoneyUI(
                                                filteredClientAppts
                                                  .filter(
                                                    (a: any) =>
                                                      (a.paymentStatus ||
                                                        "pending") === "paid",
                                                  )
                                                  .reduce(
                                                    (acc: number, curr: any) =>
                                                      acc +
                                                      Number(
                                                        curr.totalAmount || 0,
                                                      ),
                                                    0,
                                                  ),
                                                hideFinance,
                                              )}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === "empresas" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            {isRestrictedByPlan && (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-100 rounded-xl text-amber-700">💡</span>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-slate-800">
                      Modo de Demonstração (Plano Essencial)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você pode visualizar e navegar pela gestão de empresas parceiras, faturamento e convênios, mas o cadastro, alteração ou faturamento de empresas exigem o plano <strong>Gestão Total</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("assinatura")}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition shrink-0 shadow-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
            )}
            <div className="flex flex-col mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Gestão de Empresas
                </h2>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      Link de Cadastro:
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            getPublicLink(`/?register_company=${userId}`),
                          );
                          alert("Link copiado!");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      Termos/Contrato:
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            getPublicLink(`/?terms_company=${userId}`),
                          );
                          alert("Link de Termos copiado!");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar Link
                      </button>
                      <button
                        onClick={() => setShowContractEditor("empresa")}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-600 px-2.5 py-1 rounded-md transition font-medium flex items-center gap-1.5"
                        title="Editar Contrato"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                    </p>
                  </div>
                  {!profileData?.publicDomain &&
                    (window.location.hostname.includes("ais-pre-") ||
                      window.location.hostname.includes("ais-dev-")) && (
                      <div className="bg-amber-50 text-amber-700/80 p-3 rounded-lg text-xs leading-relaxed max-w-2xl mt-1 border border-amber-100 flex gap-2 items-start">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                        <div>
                          <strong className="font-semibold block mb-1">
                            Atenção: Endereço do Sistema não Configurado
                          </strong>
                          O link atual de testes (ais-pre-...) dará um erro de{" "}
                          <strong className="font-semibold">
                            "Acesso Negado (403)"
                          </strong>{" "}
                          caso seja enviado para os clientes, pois é de uso
                          exclusivo no ambiente de desenvolvimento.
                          <br />
                          Para resolver, é necessário{" "}
                          <strong>publicar o sistema</strong> e preencher o
                          campo "URL do Site Público" em Meu Perfil.
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  empresasBillingFilter === "all"
                    ? "bg-white border-blue-400 ring-1 ring-blue-400"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300",
                )}
                onClick={() => setEmpresasBillingFilter("all")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-slate-600 mb-1">
                    Faturamento Total (Empresas)
                  </h3>
                  <p className="text-2xl font-bold text-slate-800">
                    {formatMoneyUI(
                      companyAppointmentsInPeriod.reduce(
                        (a, b) => a + Number(b.totalAmount || 0),
                        0,
                      ),
                      hideFinance,
                    )}
                  </p>
                </div>
                {empresasBillingFilter === "all" && (
                  <Check className="w-5 h-5 text-blue-500 absolute top-4 right-4" />
                )}
              </div>
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  empresasBillingFilter === "paid"
                    ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400"
                    : "bg-emerald-50/50 border-emerald-100 hover:border-emerald-300",
                )}
                onClick={() => setEmpresasBillingFilter("paid")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-emerald-800 mb-1">
                    Recebido (Empresas)
                  </h3>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatMoneyUI(
                      companyAppointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "paid",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                </div>
                {empresasBillingFilter === "paid" && (
                  <Check className="w-5 h-5 text-emerald-600 absolute top-4 right-4" />
                )}
              </div>
              <div
                className={cn(
                  "border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition relative overflow-hidden",
                  empresasBillingFilter === "pending"
                    ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400"
                    : "bg-amber-50/50 border-amber-100 hover:border-amber-300",
                )}
                onClick={() => setEmpresasBillingFilter("pending")}
              >
                <div className="z-10 relative">
                  <h3 className="text-sm font-medium text-amber-800 mb-1">
                    A Receber (Empresas)
                  </h3>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatMoneyUI(
                      companyAppointmentsInPeriod
                        .filter(
                          (a) => (a.paymentStatus || "pending") === "pending",
                        )
                        .reduce((a, b) => a + Number(b.totalAmount || 0), 0),
                      hideFinance,
                    )}
                  </p>
                </div>
                {empresasBillingFilter === "pending" && (
                  <Check className="w-5 h-5 text-amber-600 absolute top-4 right-4" />
                )}
              </div>
            </div>

            {empresasBillingFilter !== "all" && (
              <p className="text-xs text-slate-500 mb-6 text-center">
                Exibindo apenas empresas com faturamento{" "}
                <strong>
                  {empresasBillingFilter === "paid"
                    ? "concluído (pago)"
                    : "pendente"}
                </strong>{" "}
                selecionado nestes cards.
              </p>
            )}

            <div className="mb-6 flex flex-col xl:flex-row gap-3 justify-between items-center mt-4">
              <div className="relative w-full xl:max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full pl-10 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none text-sm shadow-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                  value={companySearchText}
                  onChange={(e) => setCompanySearchText(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                <div className="flex items-center bg-white border border-slate-200 shadow-sm rounded-xl p-1 dark:bg-slate-800 dark:border-slate-700">
                  <button
                    onClick={() => {
                      if (companyGlobalInvoiceFilter === "all")
                        setCompanyGlobalInvoiceFilter("issued");
                      else if (companyGlobalInvoiceFilter === "issued")
                        setCompanyGlobalInvoiceFilter("pending");
                      else setCompanyGlobalInvoiceFilter("all");
                    }}
                    className={cn(
                      "p-2.5 rounded-lg transition",
                      companyGlobalInvoiceFilter === "issued"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                        : companyGlobalInvoiceFilter === "pending"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                    title="Filtro de Nota Fiscal: Geral / Emitidas / Pendentes"
                  >
                    <ReceiptText className="w-5 h-5" />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-200 mx-0.5 dark:bg-slate-700" />

                  <button
                    onClick={() => setShowInactiveCompanies(!showInactiveCompanies)}
                    className={cn(
                      "p-2.5 rounded-lg transition",
                      showInactiveCompanies
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                    title="Mostrar Empresas Inativas"
                  >
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setCompanyEditForm({ isActive: true });
                      setEditingCompanyId("new");
                    }}
                    className="flex-1 sm:flex-none bg-amber-500 text-white px-5 py-3 rounded-xl hover:bg-amber-600 transition flex items-center justify-center shadow-sm gap-2 font-medium text-sm"
                    title="Adicionar Empresa Manualmente"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Adicionar Empresa</span>
                  </button>
                </div>
              </div>
            </div>

            {editingCompanyId === "new" && (
              <div
                className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCompanyId(null);
                }}
              >
                <div
                  className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setEditingCompanyId(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <form onSubmit={handleCompanySave} className="space-y-4">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                      <h3 className="font-bold text-slate-900 text-xl">
                        Nova Empresa
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Razão Social
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.name || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Nome Fantasia
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.tradeName || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              tradeName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          CNPJ
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.cnpj || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              cnpj: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Data de Entrada
                        </label>
                        <input
                          type="date"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.entryDate || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              entryDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between items-center">
                          <span>Data de Reajuste Anual</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCompanyEditForm({
                                ...companyEditForm,
                                annualReadjustmentDate: companyEditForm.entryDate || new Date().toISOString().split("T")[0],
                              });
                            }}
                            className="text-[10px] text-amber-600 hover:text-amber-700 underline font-medium"
                          >
                            Puxar Data de Entrada
                          </button>
                        </label>
                        <input
                          type="date"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.annualReadjustmentDate || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              annualReadjustmentDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="col-span-12 md:col-span-10">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Logradouro / Rua
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={companyEditForm.addressStreet || ""}
                            onChange={(e) =>
                              setCompanyEditForm({
                                ...companyEditForm,
                                addressStreet: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="col-span-12 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Número
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                            value={companyEditForm.addressNumber || ""}
                            onChange={(e) =>
                              setCompanyEditForm({
                                ...companyEditForm,
                                addressNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.addressZipcode || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              addressZipcode: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Cidade - UF
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.addressCity || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              addressCity: e.target.value,
                            })
                          }
                          placeholder="Ex: Pouso Alegre - MG"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Pessoa de Contato
                        </label>
                        <input
                          required
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.contactPerson || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              contactPerson: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Departamento
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.department || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              department: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Telefone
                        </label>
                        <input
                          required
                          type="tel"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.phone || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          E-mail
                        </label>
                        <input
                          required
                          type="email"
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.email || ""}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Fonte
                        </label>
                        <select
                          required
                          className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                          value={companyEditForm.source || "Outros"}
                          onChange={(e) =>
                            setCompanyEditForm({
                              ...companyEditForm,
                              source: e.target.value,
                            })
                          }
                        >
                          <option value="Indicação de profissional">
                            Indicação de profissional
                          </option>
                          <option value="Projetos">Projetos</option>
                          <option value="Plataformas">Plataformas</option>
                          <option value="Instituição/ Igreja">
                            Instituição/ Igreja
                          </option>
                          <option value="Amigos/ conhecidos">
                            Amigos/ conhecidos
                          </option>
                          <option value="Google/ Site">Google/ Site</option>
                          <option value="Empresas">Empresas</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
                        <span>Anotações</span>
                        <span className="text-slate-400 font-normal">
                          Campo privado
                        </span>
                      </label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm min-h-[100px] bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                        value={companyEditForm.notes || ""}
                        onChange={(e) =>
                          setCompanyEditForm({
                            ...companyEditForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Insira suas anotações..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setEditingCompanyId(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg bg-white border border-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Empresa
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {companies.length === 0 ? (
              <p className="text-slate-500">
                Nenhuma empresa cadastrada ainda.
              </p>
            ) : filteredCompanies.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500 shadow-sm mt-4">
                Nenhuma empresa encontrada. Verifique a busca ou os filtros de
                ativos/inativos.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCompanies.map((company) => {
                  const companyAppts = companyAppointments.filter(
                    (a) => a.companyId === company.id,
                  );
                  const filteredCompanyAppts = companyAppts.filter((a) => {
                    let match = true;
                    if (sessionFilter !== "all") {
                      match =
                        match &&
                        (a.paymentStatus || "pending") === sessionFilter;
                    }
                    if (match && companySessionInvoiceFilter !== "all") {
                      match =
                        match &&
                        (a.invoiceStatus || "pending") ===
                          companySessionInvoiceFilter;
                    }
                    if (match && sessionMonthFilter !== "all") {
                      match =
                        match &&
                        new Date(a.datetime).getMonth() === sessionMonthFilter;
                    }
                    if (match && sessionYearFilter !== "all") {
                      match =
                        match &&
                        new Date(a.datetime).getFullYear() ===
                          sessionYearFilter;
                    }
                    return match;
                  });
                  return (
                    <div
                      key={company.id}
                      className="border border-slate-200 rounded-xl p-4"
                    >
                      {editingCompanyId === company.id ? (
                        <div
                          className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCompanyId(null);
                          }}
                        >
                          <div
                            className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setEditingCompanyId(null)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <form
                              onSubmit={handleCompanySave}
                              className="space-y-4"
                            >
                              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                <h3 className="font-bold text-slate-900 text-xl">
                                  Editar Prontuário
                                </h3>
                              </div>{" "}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Razão Social
                                  </label>
                                  <input
                                    required
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.name || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Nome Fantasia
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.tradeName || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        tradeName: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    CNPJ
                                  </label>
                                  <input
                                    required
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.cnpj || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        cnpj: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Data de Entrada
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.entryDate || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        entryDate: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between items-center">
                                    <span>Data de Reajuste Anual</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCompanyEditForm({
                                          ...companyEditForm,
                                          annualReadjustmentDate: companyEditForm.entryDate || new Date().toISOString().split("T")[0],
                                        });
                                      }}
                                      className="text-[10px] text-amber-600 hover:text-amber-700 underline font-medium"
                                    >
                                      Puxar Data de Entrada
                                    </button>
                                  </label>
                                  <input
                                    type="date"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.annualReadjustmentDate || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        annualReadjustmentDate: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                                  <div className="col-span-12 md:col-span-10">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                      Logradouro / Rua
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                      value={
                                        companyEditForm.addressStreet || ""
                                      }
                                      onChange={(e) =>
                                        setCompanyEditForm({
                                          ...companyEditForm,
                                          addressStreet: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="col-span-12 md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                      Número
                                    </label>
                                    <input
                                      type="text"
                                      className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                      value={
                                        companyEditForm.addressNumber || ""
                                      }
                                      onChange={(e) =>
                                        setCompanyEditForm({
                                          ...companyEditForm,
                                          addressNumber: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    CEP
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.addressZipcode || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        addressZipcode: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Cidade - UF
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.addressCity || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        addressCity: e.target.value,
                                      })
                                    }
                                    placeholder="Ex: Pouso Alegre - MG"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Pessoa de Contato
                                  </label>
                                  <input
                                    required
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.contactPerson || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        contactPerson: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Departamento
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.department || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        department: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Telefone
                                  </label>
                                  <input
                                    required
                                    type="tel"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.phone || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        phone: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    E-mail
                                  </label>
                                  <input
                                    required
                                    type="email"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.email || ""}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        email: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Fonte
                                  </label>
                                  <select
                                    required
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    value={companyEditForm.source || "Outros"}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        source: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="Indicação de profissional">
                                      Indicação de profissional
                                    </option>
                                    <option value="Projetos">Projetos</option>
                                    <option value="Plataformas">
                                      Plataformas
                                    </option>
                                    <option value="Instituição/ Igreja">
                                      Instituição/ Igreja
                                    </option>
                                    <option value="Amigos/ conhecidos">
                                      Amigos/ conhecidos
                                    </option>
                                    <option value="Google/ Site">
                                      Google/ Site
                                    </option>
                                    <option value="Empresas">Empresas</option>
                                    {clients.length > 0 && (
                                      <optgroup label="Pacientes Cadastrados">
                                        {clients.map((c) => (
                                          <option
                                            key={c.id}
                                            value={`Paciente: ${c.name}`}
                                          >
                                            Paciente: {c.name}
                                          </option>
                                        ))}
                                      </optgroup>
                                    )}
                                    <option value="Outros">Outros</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2 mt-6">
                                  <input
                                    type="checkbox"
                                    id={`active-${company.id}`}
                                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                                    checked={companyEditForm.isActive}
                                    onChange={(e) =>
                                      setCompanyEditForm({
                                        ...companyEditForm,
                                        isActive: e.target.checked,
                                      })
                                    }
                                  />
                                  <label
                                    htmlFor={`active-${company.id}`}
                                    className="text-sm font-medium text-slate-700"
                                  >
                                    Empresa Ativa
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1 flex justify-between">
                                  <span>Anotações</span>
                                  <span className="text-slate-400 font-normal">
                                    Campo privado
                                  </span>
                                </label>
                                <textarea
                                  className="w-full p-2 border border-slate-300 rounded focus:ring-amber-400 focus:outline-none text-sm min-h-[100px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                                  value={companyEditForm.notes || ""}
                                  onChange={(e) =>
                                    setCompanyEditForm({
                                      ...companyEditForm,
                                      notes: e.target.value,
                                    })
                                  }
                                  placeholder="Insira suas anotações..."
                                ></textarea>
                              </div>
                              {company.statusHistory &&
                                company.statusHistory.length > 0 && (
                                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600">
                                    <p className="font-semibold mb-2">
                                      Histórico de Alterações de Status:
                                    </p>
                                    <ul className="list-disc pl-4 space-y-1">
                                      {(company.statusHistory as any[]).map(
                                        (h, i) => (
                                          <li key={i}>
                                            {!isNaN(new Date(h.date).getTime())
                                              ? format(
                                                  new Date(h.date),
                                                  "dd/MM/yyyy HH:mm",
                                                )
                                              : h.date}{" "}
                                            -{" "}
                                            {h.action === "activated"
                                              ? "Conta Ativada"
                                              : "Conta Inativada"}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setEditingCompanyId(null)}
                                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 bg-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" /> Salvar
                                  Prontuário
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className="flex flex-col cursor-pointer"
                            onClick={() =>
                              setExpandedCompanyId(
                                expandedCompanyId === company.id
                                  ? null
                                  : company.id,
                              )
                            }
                          >
                            <div
                              className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2 mb-3 w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenNotification(company);
                                }}
                                className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex-shrink-0"
                                title="Enviar Notificação"
                              >
                                <MessagesSquare className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompanyEdit(company);
                                }}
                                className="flex items-center justify-center gap-1.5 text-amber-500 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap border border-transparent hover:border-amber-100 flex-1 sm:flex-none"
                              >
                                <User className="w-4 h-4" /> Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompanyDelete(company.id);
                                }}
                                className="flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap border border-transparent hover:border-red-100 flex-1 sm:flex-none"
                              >
                                <Trash2 className="w-4 h-4" /> Excluir
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCompanyId(
                                    expandedCompanyId === company.id
                                      ? null
                                      : company.id,
                                  );
                                }}
                                className="flex items-center justify-center gap-1.5 text-slate-500 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex-1 sm:flex-none"
                              >
                                <span className="underline underline-offset-4 decoration-slate-200">
                                  {expandedCompanyId === company.id
                                    ? "Esconder Histórico"
                                    : "Ver Histórico"}
                                </span>
                              </button>
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2 mb-1">
                              {company.name}
                              {(company.isActive ?? true) ? (
                                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium">
                                  Ativo
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium">
                                  Inativo
                                </span>
                              )}
                            </h3>

                            {company.annualReadjustmentDate &&
                              (() => {
                                const parts = company.annualReadjustmentDate.split("-");
                                if (parts.length < 2) return null;
                                const readjustmentMonth = parseInt(parts[1], 10) - 1;
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();
                                const isConfirmedThisYear = company.lastReadjustmentConfirmedYear === currentYear;

                                if (readjustmentMonth === currentMonth && !isConfirmedThisYear) {
                                  return (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-amber-50 border border-amber-200 rounded-xl p-3 my-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                                    >
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-sm font-bold text-amber-900">
                                            Mês de Reajuste Anual!
                                          </p>
                                          <p className="text-xs text-amber-700 leading-relaxed">
                                            Esta empresa está no mês de reajuste anual acordado em{" "}
                                            <strong className="font-semibold">
                                              {format(
                                                new Date(company.annualReadjustmentDate + "T12:00:00"),
                                                "dd/MM/yyyy",
                                              )}
                                            </strong>
                                            .
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReadjustmentPercent("");
                                          setReadjustmentNewValue("");
                                          setReadjustmentNotes("");
                                          setReadjustmentConfirmModal({
                                            isOpen: true,
                                            entity: company,
                                            type: "company",
                                          });
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                                      >
                                        Confirmar Reajuste
                                      </button>
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                              <span className="hidden sm:inline">
                                {company.email} •{" "}
                              </span>
                              {company.phone} • CNPJ: {company.cnpj} • Contato:{" "}
                              {company.contactPerson || "-"} • Depto:{" "}
                              {company.department || "-"}
                            </p>
                            {company.createdAt && (
                              <p className="text-xs text-slate-500 mb-3 -mt-2 flex items-center gap-1.5">
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  Entrada no sistema:{" "}
                                  <strong className="text-slate-600 font-semibold">
                                    {(() => {
                                      const d = company.createdAt;
                                      if (d.toDate)
                                        return format(d.toDate(), "dd/MM/yyyy");
                                      if (d.seconds)
                                        return format(
                                          new Date(d.seconds * 1000),
                                          "dd/MM/yyyy",
                                        );
                                      const dateObj = new Date(d);
                                      if (!isNaN(dateObj.getTime()))
                                        return format(dateObj, "dd/MM/yyyy");
                                      return String(d);
                                    })()}
                                  </strong>
                                </span>
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 border border-amber-100 rounded-full font-semibold uppercase tracking-wide">
                                Fonte: {company.source || "Não informada"}
                              </span>
                              {company.lgpdAccepted ? (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 border border-emerald-100 rounded-full font-semibold uppercase tracking-wide flex items-center gap-1">
                                  <Check className="w-3 h-3" /> LGPD Aceito
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 border border-slate-200 rounded-full font-semibold uppercase tracking-wide">
                                  LGPD Pendente
                                </span>
                              )}
                              {signatures.some(
                                (s) =>
                                  s.identifier === company.cnpj &&
                                  s.type === "company",
                              ) ? (
                                <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 border border-blue-100 rounded-full font-semibold uppercase tracking-wide flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Contrato
                                  Assinado
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 border border-slate-200 rounded-full font-semibold uppercase tracking-wide">
                                  Contrato Pendente
                                </span>
                              )}
                            </div>
                          </div>

                          {expandedCompanyId === company.id && (
                            <div
                              className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCompanyId(null);
                              }}
                            >
                              <div
                                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col p-6 cursor-auto relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedCompanyId(null)}
                                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition z-10"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                                <div className="mb-4 pb-2 border-b border-slate-100 pr-12">
                                  <h3 className="text-xl font-bold text-slate-800">
                                    Histórico: {company.name}
                                  </h3>
                                </div>
                                <div className="mt-2 text-left">
                                  <div className="mb-6 bg-slate-50/70 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-2.5">
                                      <div className="bg-amber-100/80 p-2 rounded-lg text-amber-600">
                                        <CalendarIcon className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-800">
                                          Primeiro Cadastro / Entrada no Sistema
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          Data oficial de ingresso da empresa no
                                          sistema.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                                      {company.createdAt
                                        ? (() => {
                                            const d = company.createdAt;
                                            if (d.toDate)
                                              return format(
                                                d.toDate(),
                                                "dd/MM/yyyy 'às' HH:mm",
                                              );
                                            if (d.seconds)
                                              return format(
                                                new Date(d.seconds * 1000),
                                                "dd/MM/yyyy 'às' HH:mm",
                                              );
                                            const dateObj = new Date(d);
                                            if (!isNaN(dateObj.getTime()))
                                              return format(
                                                dateObj,
                                                "dd/MM/yyyy 'às' HH:mm",
                                              );
                                            return String(d);
                                          })()
                                        : "Data de cadastro não disponível"}
                                    </div>
                                  </div>

                                  {signatures.filter(
                                    (s) =>
                                      s.identifier === company.cnpj &&
                                      s.type === "company",
                                  ).length > 0 && (
                                    <div className="mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                      <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Histórico de Assinaturas (Contrato e
                                        LGPD)
                                      </h4>
                                      <div className="grid gap-2">
                                        {signatures
                                          .filter(
                                            (s) =>
                                              s.identifier === company.cnpj &&
                                              s.type === "company",
                                          )
                                          .sort(
                                            (a, b) =>
                                              (b.signedAt?.toMillis
                                                ? b.signedAt.toMillis()
                                                : 0) -
                                              (a.signedAt?.toMillis
                                                ? a.signedAt.toMillis()
                                                : 0),
                                          )
                                          .map((sig) => (
                                            <div
                                              key={sig.id}
                                              className="bg-white border border-emerald-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                                            >
                                              <div>
                                                <div className="font-semibold text-slate-800 text-sm">
                                                  {sig.name}
                                                </div>
                                                <div className="text-slate-500 text-xs mt-0.5">
                                                  CNPJ: {sig.identifier} •
                                                  E-mail: {sig.email}
                                                </div>
                                              </div>
                                              <div className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md self-start sm:self-auto flex-shrink-0">
                                                {sig.signedAt?.toDate
                                                  ? sig.signedAt
                                                      .toDate()
                                                      .toLocaleString("pt-BR")
                                                  : "Data não disponível"}
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Histórico de Reajustes Anuais */}
                                  <ReadjustmentHistoryManager
                                    userId={userId}
                                    entityId={company.id}
                                    entityType="company"
                                    history={company.readjustmentHistory || []}
                                    onHistoryUpdated={(newHistory) => {
                                      setCompanies((prev) =>
                                        prev.map((c) =>
                                          c.id === company.id
                                            ? { ...c, readjustmentHistory: newHistory }
                                            : c,
                                        ),
                                      );
                                    }}
                                  />

                                  {company.notes && (
                                    <div className="mb-6 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                      <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <Settings className="w-4 h-4 text-slate-400" />{" "}
                                        Anotações Gerais do Prontuário
                                      </h4>
                                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                        {company.notes}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-end mb-4 gap-4">
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-800 mb-2">
                                        Histórico de Serviços e Financeiro
                                      </h4>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          onClick={() =>
                                            setSessionFilter("all")
                                          }
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                            sessionFilter === "all"
                                              ? "bg-marsala-700 text-white border-slate-800"
                                              : "bg-white text-slate-600 border-slate-200",
                                          )}
                                        >
                                          Todas
                                        </button>
                                        <button
                                          onClick={() =>
                                            setSessionFilter("paid")
                                          }
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                            sessionFilter === "paid"
                                              ? "bg-emerald-600 text-white border-emerald-600"
                                              : "bg-white text-emerald-700 border-emerald-200",
                                          )}
                                        >
                                          Pagas
                                        </button>
                                        <button
                                          onClick={() =>
                                            setSessionFilter("pending")
                                          }
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium border",
                                            sessionFilter === "pending"
                                              ? "bg-amber-500 text-white border-amber-500"
                                              : "bg-white text-amber-700 border-amber-200",
                                          )}
                                        >
                                          Pendentes
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                                        <select
                                          value={sessionMonthFilter}
                                          onChange={(e) =>
                                            setSessionMonthFilter(
                                              e.target.value === "all"
                                                ? "all"
                                                : Number(e.target.value),
                                            )
                                          }
                                          className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                        >
                                          <option value="all">
                                            Mês: Todos
                                          </option>
                                          {[
                                            "Jan",
                                            "Fev",
                                            "Mar",
                                            "Abr",
                                            "Mai",
                                            "Jun",
                                            "Jul",
                                            "Ago",
                                            "Set",
                                            "Out",
                                            "Nov",
                                            "Dez",
                                          ].map((m, i) => (
                                            <option key={i} value={i}>
                                              {m}
                                            </option>
                                          ))}
                                        </select>
                                        <select
                                          value={sessionYearFilter}
                                          onChange={(e) =>
                                            setSessionYearFilter(
                                              e.target.value === "all"
                                                ? "all"
                                                : Number(e.target.value),
                                            )
                                          }
                                          className="p-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                        >
                                          <option value="all">
                                            Ano: Todos
                                          </option>
                                          {[2024, 2025, 2026, 2027, 2028].map(
                                            (y) => (
                                              <option key={y} value={y}>
                                                {y}
                                              </option>
                                            ),
                                          )}
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                      <button
                                        onClick={() =>
                                          handleDuplicateLastCompanySession(
                                            company.id,
                                            company.name,
                                          )
                                        }
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto"
                                        title="Duplicar informações do último serviço registrado"
                                      >
                                        <Copy className="w-4 h-4" /> Duplicar
                                        Anterior
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleAddCompanySession(
                                            company.id,
                                            company.name,
                                          )
                                        }
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition w-full sm:w-auto"
                                      >
                                        <Plus className="w-4 h-4" /> Novo
                                        Serviço
                                      </button>
                                    </div>
                                  </div>

                                  {editingCompanyAppointmentId === "new" &&
                                    companyAppointmentEditForm.companyId ===
                                      company.id && (
                                      <form
                                        onSubmit={(e) =>
                                          handleCompanyAppointmentSave(
                                            e,
                                            company.id,
                                          )
                                        }
                                        className="bg-slate-50 p-4 pb-0 rounded-xl border border-slate-200 mb-4 animate-in fade-in"
                                      >
                                        <h4 className="font-semibold text-slate-800 mb-3">
                                          Registrar Novo Serviço
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3 text-sm">
                                          <div>
                                            <label className="block text-slate-600 mb-1">
                                              Data
                                            </label>
                                            <input
                                              type="date"
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.date
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  date: e.target.value,
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="md:col-span-2">
                                            <label className="block text-slate-600 mb-1">
                                              Serviço Prestado
                                            </label>
                                            <select
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.serviceId ||
                                                ""
                                              }
                                              onChange={(e) => {
                                                const s = (
                                                  profileData?.services || []
                                                ).find(
                                                  (x: any) =>
                                                    (x.id || x.title) ===
                                                    e.target.value,
                                                );
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  serviceId: e.target.value,
                                                  serviceName: s
                                                    ? s.title
                                                    : e.target.value,
                                                  serviceDescription: s
                                                    ? s.title
                                                    : e.target.value,
                                                  totalAmount:
                                                    s?.price > 0
                                                      ? s.price
                                                      : companyAppointmentEditForm.totalAmount,
                                                });
                                              }}
                                            >
                                              <option value="">
                                                Selecione o Serviço...
                                              </option>
                                              <option value="Serviço Corporativo Geral">
                                                Serviço Corporativo Geral
                                              </option>
                                              {(profileData?.services || [])
                                                .filter(
                                                  (s: any) =>
                                                    s.category === "empresa" ||
                                                    s.category === "igrejas",
                                                )
                                                .map((s: any) => (
                                                  <option
                                                    value={s.id || s.title}
                                                    key={
                                                      s.id ||
                                                      s.title ||
                                                      Math.random().toString()
                                                    }
                                                  >
                                                    {s.title}
                                                  </option>
                                                ))}
                                            </select>
                                          </div>
                                          <div>
                                            <label
                                              className="block text-slate-600 mb-1"
                                              title="Quantidade de Horas"
                                            >
                                              Qtd Horas
                                            </label>
                                            <input
                                              type="number"
                                              min="1"
                                              step="1"
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.hoursQty ||
                                                1
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  hoursQty: Number(
                                                    e.target.value,
                                                  ),
                                                })
                                              }
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-slate-600 mb-1">
                                              Valor (R$)
                                            </label>
                                            <input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.totalAmount
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  totalAmount: Number(
                                                    e.target.value,
                                                  ),
                                                })
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 text-sm">
                                          <div>
                                            <label className="block text-slate-600 mb-1">
                                              Status Financeiro
                                            </label>
                                            <select
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.paymentStatus
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  paymentStatus: e.target.value,
                                                })
                                              }
                                            >
                                              <option value="pending">
                                                Pendente
                                              </option>
                                              <option value="paid">Pago</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-slate-600 mb-1">
                                              NF Emitida
                                            </label>
                                            <select
                                              required
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.invoiceStatus ||
                                                "pending"
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  invoiceStatus: e.target.value,
                                                })
                                              }
                                            >
                                              <option value="pending">
                                                Pendente / Não Emitida
                                              </option>
                                              <option value="issued">
                                                Emitida
                                              </option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 text-sm">
                                          <div>
                                            <label className="block text-slate-600 mb-1">
                                              Modalidade
                                            </label>
                                            <select
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.modality ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  modality: e.target.value,
                                                })
                                              }
                                            >
                                              <option value="">
                                                Selecione...
                                              </option>
                                              <option value="On line">
                                                On line
                                              </option>
                                              <option value="Presencial">
                                                Presencial
                                              </option>
                                              <option value="Híbrido">
                                                Híbrido
                                              </option>
                                            </select>
                                          </div>
                                          <div>
                                            <div className="flex justify-between items-center mb-1">
                                              <label className="text-slate-600 font-medium">
                                                Local / Conta Faturamento
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setIsManageAccountsOpen(true)
                                                }
                                                className="text-amber-500 hover:text-amber-600 text-xs font-semibold flex items-center gap-0.5 pointer-events-auto"
                                                title="Gerenciar Contas"
                                              >
                                                <Settings className="w-3.5 h-3.5 inline" />
                                                Gerenciar
                                              </button>
                                            </div>
                                            <select
                                              className="w-full p-2 border rounded focus:ring-amber-400 bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                              value={
                                                companyAppointmentEditForm.billingAccount ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                setCompanyAppointmentEditForm({
                                                  ...companyAppointmentEditForm,
                                                  billingAccount:
                                                    e.target.value,
                                                })
                                              }
                                            >
                                              <option value="">
                                                Para onde foi pago...
                                              </option>
                                              {billingAccounts.map((acc) => (
                                                <option key={acc} value={acc}>
                                                  {acc}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        <div className="mb-4 text-sm">
                                          <label className="block text-slate-600 mb-1">
                                            Anotações do Serviço
                                          </label>
                                          <textarea
                                            className="w-full p-2 border rounded focus:ring-amber-400 min-h-[60px] bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                            value={
                                              companyAppointmentEditForm.notes
                                            }
                                            onChange={(e) =>
                                              setCompanyAppointmentEditForm({
                                                ...companyAppointmentEditForm,
                                                notes: e.target.value,
                                              })
                                            }
                                            placeholder="Resumo do atendimento, temas abordados..."
                                          ></textarea>
                                        </div>
                                        <div className="flex justify-end gap-2 pb-4">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditingCompanyAppointmentId(
                                                null,
                                              )
                                            }
                                            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 border rounded"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            type="submit"
                                            className="px-3 py-1.5 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded transition"
                                          >
                                            Salvar Serviço
                                          </button>
                                        </div>
                                      </form>
                                    )}

                                  <div className="w-full overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-sm text-slate-600 border-collapse min-w-[600px]">
                                      <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                          <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                            Detalhes do Serviço
                                          </th>
                                          <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                            Data
                                          </th>
                                          <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                            Valores / Status
                                          </th>
                                          <th className="p-3 font-semibold text-slate-700 border-r border-slate-200">
                                            Anotações
                                          </th>
                                          <th className="p-3 font-semibold text-slate-700 text-right w-[80px]">
                                            Ação
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {filteredCompanyAppts
                                          .sort(
                                            (a, b) =>
                                              new Date(b.datetime).getTime() -
                                              new Date(a.datetime).getTime(),
                                          )
                                          .map((ap) => (
                                            <React.Fragment key={ap.id}>
                                              {editingCompanyAppointmentId ===
                                              ap.id ? (
                                                <tr className="bg-amber-50/50 border-b border-slate-100">
                                                  <td
                                                    colSpan={5}
                                                    className="p-4"
                                                  >
                                                    <form
                                                      onSubmit={(e) =>
                                                        handleCompanyAppointmentSave(
                                                          e,
                                                          company.id,
                                                        )
                                                      }
                                                      className="flex flex-col gap-3"
                                                    >
                                                      <div className="flex flex-wrap gap-3 items-center">
                                                        <select
                                                          required
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm flex-grow min-w-[200px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.serviceId ||
                                                            ""
                                                          }
                                                          onChange={(e) => {
                                                            const s = (
                                                              profileData?.services ||
                                                              []
                                                            ).find(
                                                              (x: any) =>
                                                                x.id ===
                                                                e.target.value,
                                                            );
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                serviceId:
                                                                  e.target
                                                                    .value,
                                                                serviceName: s
                                                                  ? s.title
                                                                  : e.target
                                                                      .value,
                                                                serviceDescription:
                                                                  s
                                                                    ? s.title
                                                                    : e.target
                                                                        .value,
                                                                totalAmount:
                                                                  s?.price > 0
                                                                    ? s.price
                                                                    : companyAppointmentEditForm.totalAmount,
                                                              },
                                                            );
                                                          }}
                                                        >
                                                          <option value="">
                                                            Serviço
                                                            Corporativo...
                                                          </option>
                                                          <option value="Serviço Corporativo Geral">
                                                            Geral
                                                          </option>
                                                          {(
                                                            profileData?.services ||
                                                            []
                                                          )
                                                            .filter(
                                                              (s: any) =>
                                                                s.category ===
                                                                  "empresa" ||
                                                                s.category ===
                                                                  "igrejas",
                                                            )
                                                            .map((s: any) => (
                                                              <option
                                                                value={
                                                                  s.id ||
                                                                  s.title
                                                                }
                                                                key={
                                                                  s.id ||
                                                                  s.title ||
                                                                  Math.random().toString()
                                                                }
                                                              >
                                                                {s.title}
                                                              </option>
                                                            ))}
                                                        </select>
                                                        <input
                                                          type="date"
                                                          required
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.date ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                date: e.target
                                                                  .value,
                                                              },
                                                            )
                                                          }
                                                        />
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-slate-500 text-xs">
                                                            Qtd
                                                          </span>
                                                          <input
                                                            type="number"
                                                            step="1"
                                                            min="1"
                                                            required
                                                            className="p-1.5 border w-16 rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              companyAppointmentEditForm.hoursQty ||
                                                              1
                                                            }
                                                            onChange={(e) =>
                                                              setCompanyAppointmentEditForm(
                                                                {
                                                                  ...companyAppointmentEditForm,
                                                                  hoursQty:
                                                                    Number(
                                                                      e.target
                                                                        .value,
                                                                    ),
                                                                },
                                                              )
                                                            }
                                                            title="Quantidade de Horas"
                                                          />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                          <span className="text-slate-500">
                                                            R$
                                                          </span>
                                                          <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            required
                                                            className="p-1.5 border w-24 rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                            value={
                                                              companyAppointmentEditForm.totalAmount
                                                            }
                                                            onChange={(e) =>
                                                              setCompanyAppointmentEditForm(
                                                                {
                                                                  ...companyAppointmentEditForm,
                                                                  totalAmount:
                                                                    Number(
                                                                      e.target
                                                                        .value,
                                                                    ),
                                                                },
                                                              )
                                                            }
                                                          />
                                                        </div>
                                                        <select
                                                          required
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.paymentStatus
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                paymentStatus:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                        >
                                                          <option value="pending">
                                                            Pgto Pendente
                                                          </option>
                                                          <option value="paid">
                                                            Pgto Pago
                                                          </option>
                                                        </select>
                                                        <select
                                                          required
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.invoiceStatus ||
                                                            "pending"
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                invoiceStatus:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                        >
                                                          <option value="pending">
                                                            NF Pendente
                                                          </option>
                                                          <option value="issued">
                                                            NF Emitida
                                                          </option>
                                                        </select>
                                                      </div>
                                                      <div className="flex flex-wrap gap-3 items-center">
                                                        <select
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm w-[120px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.modality ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                modality:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                        >
                                                          <option value="">
                                                            Modalidade...
                                                          </option>
                                                          <option value="On line">
                                                            On line
                                                          </option>
                                                          <option value="Presencial">
                                                            Presencial
                                                          </option>
                                                          <option value="Híbrido">
                                                            Híbrido
                                                          </option>
                                                        </select>
                                                        <select
                                                          className="p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm flex-1 min-w-[150px] text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.billingAccount ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                billingAccount:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                        >
                                                          <option value="">
                                                            Local / Conta...
                                                          </option>
                                                          <option value="ELO">
                                                            ELO
                                                          </option>
                                                          <option value="MEI Carla">
                                                            MEI Carla
                                                          </option>
                                                          <option value="CPF Marcio">
                                                            CPF Marcio
                                                          </option>
                                                          <option value="CPF Carla">
                                                            CPF Carla
                                                          </option>
                                                          <option value="Dinheiro">
                                                            Dinheiro
                                                          </option>
                                                        </select>
                                                        
                                                      </div>
                                                      <div>
                                                        <input
                                                          type="text"
                                                          placeholder="Anotações curtas..."
                                                          className="w-full p-1.5 border rounded focus:ring-amber-400 bg-white shadow-sm text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800"
                                                          value={
                                                            companyAppointmentEditForm.notes ||
                                                            ""
                                                          }
                                                          onChange={(e) =>
                                                            setCompanyAppointmentEditForm(
                                                              {
                                                                ...companyAppointmentEditForm,
                                                                notes:
                                                                  e.target
                                                                    .value,
                                                              },
                                                            )
                                                          }
                                                        />
                                                      </div>
                                                      <div className="flex gap-2 justify-end">
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setEditingCompanyAppointmentId(
                                                              null,
                                                            )
                                                          }
                                                          className="px-3 py-1 text-slate-600 hover:bg-slate-200 border rounded text-xs font-medium"
                                                        >
                                                          Cancelar
                                                        </button>
                                                        <button
                                                          type="submit"
                                                          className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-xs font-medium"
                                                        >
                                                          Salvar
                                                        </button>
                                                      </div>
                                                    </form>
                                                  </td>
                                                </tr>
                                              ) : (
                                                <tr className="border-b border-slate-100 hover:bg-slate-50 group transition-colors">
                                                  <td className="p-3 border-r border-slate-100 font-medium">
                                                    <p>
                                                      {ap.serviceDescription ||
                                                        ap.serviceName ||
                                                        "-"}
                                                    </p>
                                                    {(ap.modality ||
                                                      ap.billingAccount ||
                                                      ap.priceAdjust) && (
                                                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                        {ap.modality && (
                                                          <span className="bg-slate-100 text-slate-600 px-1.5 border border-slate-200 py-0.5 rounded text-[10px] uppercase font-bold">
                                                            {ap.modality}
                                                          </span>
                                                        )}
                                                        {ap.billingAccount && (
                                                          <span className="bg-amber-50 text-amber-600 px-1.5 border border-amber-200 py-0.5 rounded text-[10px] font-bold">
                                                            {ap.billingAccount}
                                                          </span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="p-3 whitespace-nowrap border-r border-slate-100">
                                                    {!isNaN(
                                                      new Date(
                                                        ap.datetime,
                                                      ).getTime(),
                                                    )
                                                      ? format(
                                                          new Date(ap.datetime),
                                                          "dd/MM/yyyy",
                                                        )
                                                      : ap.datetime}
                                                    <div className="text-xs text-slate-500 mt-1">
                                                      {ap.hoursQty || 1}{" "}
                                                      {ap.hoursQty > 1
                                                        ? "Horas"
                                                        : "Hora"}
                                                    </div>
                                                  </td>
                                                  <td className="p-3 border-r border-slate-100">
                                                    <div className="flex flex-col gap-2">
                                                      <span className="font-medium">
                                                        {formatMoneyUI(
                                                          Number(
                                                            ap.totalAmount || 0,
                                                          ),
                                                          hideFinance,
                                                        )}
                                                      </span>
                                                      <div className="flex flex-wrap items-center gap-2">
                                                        {ap.priceAdjust && (
                                                          <span className="bg-marsala-700 text-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                            {ap.priceAdjust}
                                                          </span>
                                                        )}
                                                        <select
                                                          className={cn(
                                                            "text-[10px] p-0.5 border-slate-200 rounded outline-none w-20 font-bold",
                                                            (ap.paymentStatus ||
                                                              "pending") ===
                                                              "paid"
                                                              ? "bg-emerald-100 text-emerald-700"
                                                              : "bg-orange-100 text-orange-700",
                                                          )}
                                                          value={
                                                            ap.paymentStatus ||
                                                            "pending"
                                                          }
                                                          onChange={(e) =>
                                                            handleCompanyPaymentStatusChange(
                                                              ap.id,
                                                              e.target.value,
                                                            )
                                                          }
                                                        >
                                                          <option value="pending">
                                                            Pgto Pend.
                                                          </option>
                                                          <option value="paid">
                                                            Pago
                                                          </option>
                                                        </select>
                                                        <select
                                                          className={cn(
                                                            "text-[10px] p-0.5 border-slate-200 rounded outline-none font-bold",
                                                            (ap.invoiceStatus ||
                                                              "pending") ===
                                                              "issued"
                                                              ? "bg-emerald-100 text-emerald-700"
                                                              : "bg-orange-100 text-orange-700",
                                                          )}
                                                          value={
                                                            ap.invoiceStatus ||
                                                            "pending"
                                                          }
                                                          onChange={(e) =>
                                                            handleCompanyInvoiceStatusChange(
                                                              ap.id,
                                                              e.target.value,
                                                            )
                                                          }
                                                        >
                                                          <option value="pending">
                                                            NF Pendente
                                                          </option>
                                                          <option value="issued">
                                                            NF Emitida
                                                          </option>
                                                        </select>
                                                      </div>
                                                    </div>
                                                  </td>
                                                  <td className="p-3 border-r border-slate-100 text-xs text-slate-600">
                                                    <div
                                                      className="italic mb-1"
                                                      title={ap.notes}
                                                    >
                                                      {ap.notes || "-"}
                                                    </div>
                                                    {ap.documents?.length >
                                                      0 && (
                                                      <div className="flex flex-col gap-1 mt-1">
                                                        {ap.documents.map(
                                                          (
                                                            doc: any,
                                                            i: number,
                                                          ) => (
                                                            <div key={i} className="flex items-center gap-1 group/doc">
                                                              <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-amber-500 hover:text-amber-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                                                                title={doc.name}
                                                              >
                                                                <Upload className="w-3 h-3 flex-shrink-0" />{" "}
                                                                <span className="truncate">{doc.name}</span>
                                                              </a>
                                                              <button 
                                                                onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  handleDeleteCompanyAppointmentDocument(ap.id, i);
                                                                }}
                                                                className="text-rose-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 flex-shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity"
                                                                title="Excluir"
                                                              >
                                                                <Trash2 className="w-3 h-3" />
                                                              </button>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    )}
                                                  </td>
                                                  <td className="p-3 text-right whitespace-nowrap">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                                                      <label
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer relative"
                                                        title="Upload Comprovante/Doc"
                                                      >
                                                        {uploadingAppointmentId ===
                                                        ap.id ? (
                                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                          <Upload className="w-4 h-4" />
                                                        )}
                                                        <input
                                                          type="file"
                                                          className="hidden text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                                                          onChange={(e) =>
                                                            handleCompanyFileUpload(
                                                              e,
                                                              ap.id,
                                                            )
                                                          }
                                                          disabled={
                                                            uploadingAppointmentId ===
                                                            ap.id
                                                          }
                                                        />
                                                      </label>
                                                      <button
                                                        onClick={() =>
                                                          handleEditCompanySession(
                                                            ap,
                                                          )
                                                        }
                                                        className="p-1.5 text-amber-500 hover:bg-amber-100 rounded-lg transition"
                                                        title="Editar"
                                                      >
                                                        <Edit2 className="w-4 h-4" />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleCompanyAppointmentDelete(
                                                            ap.id,
                                                          )
                                                        }
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                        title="Excluir"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                            </React.Fragment>
                                          ))}
                                        {filteredCompanyAppts.length === 0 &&
                                          editingCompanyAppointmentId !==
                                            "new" && (
                                            <tr>
                                              <td
                                                colSpan={5}
                                                className="p-6 text-center text-slate-500 bg-slate-50/50"
                                              >
                                                Nenhuma sessão encontrada para
                                                este filtro.
                                              </td>
                                            </tr>
                                          )}
                                      </tbody>
                                    </table>
                                    {filteredCompanyAppts.length > 0 &&
                                      sessionFilter === "pending" && (
                                        <div className="bg-amber-50 p-4 flex flex-col sm:flex-row justify-between items-center text-sm border-t border-amber-100">
                                          <span className="font-semibold text-amber-800">
                                            Total Pendente:
                                          </span>
                                          <span className="font-bold text-amber-900 text-xl">
                                            {formatMoneyUI(
                                              filteredCompanyAppts
                                                .filter(
                                                  (a: any) =>
                                                    (a.paymentStatus ||
                                                      "pending") === "pending",
                                                )
                                                .reduce(
                                                  (acc: number, curr: any) =>
                                                    acc +
                                                    Number(
                                                      curr.totalAmount || 0,
                                                    ),
                                                  0,
                                                ),
                                              hideFinance,
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    {filteredCompanyAppts.length > 0 &&
                                      sessionFilter === "paid" && (
                                        <div className="bg-emerald-50 p-4 flex flex-col sm:flex-row justify-between items-center text-sm border-t border-emerald-100">
                                          <span className="font-semibold text-emerald-800">
                                            Total Pago (Período/Histórico):
                                          </span>
                                          <span className="font-bold text-emerald-900 text-xl">
                                            {formatMoneyUI(
                                              filteredCompanyAppts
                                                .filter(
                                                  (a: any) =>
                                                    (a.paymentStatus ||
                                                      "pending") === "paid",
                                                )
                                                .reduce(
                                                  (acc: number, curr: any) =>
                                                    acc +
                                                    Number(
                                                      curr.totalAmount || 0,
                                                    ),
                                                  0,
                                                ),
                                              hideFinance,
                                            )}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "avaliacoes" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
              Configurações e Moderação de Avaliações
            </h2>

            <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" /> Configurações na
                Landing Page
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div>
                    <strong className="block text-slate-800 mb-1">
                      Exibir seção de Depoimentos
                    </strong>
                    <p className="text-sm text-slate-500">
                      Mostra ou oculta completamente a área de depoimentos e
                      avaliações no seu site.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const newVal =
                        editForm.hideReviewsOnSite === true ? false : true;
                      setEditForm({ ...editForm, hideReviewsOnSite: newVal });
                      try {
                        await updateDoc(doc(db, "profiles", userId), {
                          hideReviewsOnSite: newVal,
                          updatedAt: serverTimestamp(),
                        });
                        onUpdateProfile({
                          ...profileData,
                          hideReviewsOnSite: newVal,
                        });
                      } catch (e: any) {
                        console.error(e);
                        alert("Erro ao atualizar: " + e.message);
                      }
                    }}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative shrink-0",
                      !editForm.hideReviewsOnSite
                        ? "bg-emerald-500"
                        : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                        !editForm.hideReviewsOnSite
                          ? "translate-x-6"
                          : "translate-x-0",
                      )}
                    />
                  </button>
                </div>

                {!editForm.hideReviewsOnSite && (
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <div className="flex-1">
                      <strong className="block text-slate-800 mb-1">
                        Usar Widget do Google Meu Negócio
                      </strong>
                      <p className="text-sm text-slate-500 mb-4">
                        Substitui o sistema nativo de avaliações do site por um
                        código/widget (iframe) do Google ou outra plataforma de
                        depoimentos.
                      </p>

                      {editForm.useGoogleReviewsWidget && (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Código de Incorporação (HTML/Iframe)
                          </label>
                          <textarea
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-400 outline-none text-slate-900 dark:text-slate-100 dark:border-slate-700"
                            rows={4}
                            placeholder='Ex: <iframe src="https://apps.elfsight.com/widget/..."></iframe>'
                            value={editForm.googleReviewsWidgetCode || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                googleReviewsWidgetCode: e.target.value,
                              })
                            }
                          ></textarea>
                          <button
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, "profiles", userId), {
                                  googleReviewsWidgetCode:
                                    editForm.googleReviewsWidgetCode || "",
                                  updatedAt: serverTimestamp(),
                                });
                                onUpdateProfile({
                                  ...profileData,
                                  googleReviewsWidgetCode:
                                    editForm.googleReviewsWidgetCode || "",
                                });
                                setWidgetSaved(true);
                                setTimeout(() => setWidgetSaved(false), 3000);
                              } catch (e: any) {
                                console.error(e);
                                alert("Erro ao salvar script: " + e.message);
                              }
                            }}
                            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition flex items-center gap-2"
                          >
                            {widgetSaved ? (
                              <>
                                <Check className="w-4 h-4" /> Salvo com sucesso!
                              </>
                            ) : (
                              "Salvar Código"
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const newVal = !editForm.useGoogleReviewsWidget;
                        setEditForm({
                          ...editForm,
                          useGoogleReviewsWidget: newVal,
                        });
                        try {
                          await updateDoc(doc(db, "profiles", userId), {
                            useGoogleReviewsWidget: newVal,
                            updatedAt: serverTimestamp(),
                          });
                          onUpdateProfile({
                            ...profileData,
                            useGoogleReviewsWidget: newVal,
                          });
                        } catch (e: any) {
                          console.error(e);
                          alert("Erro ao atualizar: " + e.message);
                        }
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative shrink-0",
                        editForm.useGoogleReviewsWidget
                          ? "bg-amber-500"
                          : "bg-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                          editForm.useGoogleReviewsWidget
                            ? "translate-x-6"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Avaliações Recebidas pelo Site
            </h3>
            {reviews.length === 0 ? (
              <p className="text-slate-500">Nenhuma avaliação recebida.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900 mb-1">
                        {rev.authorName}
                      </p>
                      <p className="text-slate-600 italic text-sm mb-2">
                        "{rev.content}"
                      </p>
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-1 rounded inline-block",
                          rev.status === "pending" &&
                            "bg-amber-100 text-amber-700",
                          rev.status === "approved" &&
                            "bg-emerald-100 text-emerald-700",
                          rev.status === "hidden" &&
                            "bg-slate-100 text-slate-700",
                        )}
                      >
                        Status: {rev.status}
                      </span>
                    </div>
                    {rev.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewAction(rev.id, "approved")}
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2 rounded-lg transition"
                          title="Aprovar"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReviewAction(rev.id, "hidden")}
                          className="bg-slate-50 text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition"
                          title="Ocultar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReviewDelete(rev.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    {rev.status === "approved" && (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleReviewAction(rev.id, "hidden")}
                          className="text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Ocultar
                        </button>
                        <button
                          onClick={() => handleReviewDelete(rev.id)}
                          className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                    {rev.status === "hidden" && (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => handleReviewAction(rev.id, "approved")}
                          className="text-sm border border-emerald-200 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Desocultar
                        </button>
                        <button
                          onClick={() => handleReviewDelete(rev.id)}
                          className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "automacoes" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            {isRestrictedByPlan && (
              <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-700 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-amber-100 rounded-xl text-amber-700">💡</span>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-slate-800">
                      Modo de Demonstração (Plano Essencial)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Você pode visualizar e simular esta área de automações via Webhook, mas salvar as configurações de integrações e disparar webhooks exige o plano <strong>Gestão Total</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("assinatura")}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition shrink-0 shadow-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Integração com Webhooks
              (Zapier, Make, etc)
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Configure um Webhook para sincronizar automaticamente os dados dos
              seus pacientes e sessões com outras ferramentas em tempo real.
              Sempre que um paciente ou sessão for adicionado, editado ou
              excluído, enviaremos um POST para a URL configurada abaixo.
            </p>

            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL do Webhook
                </label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none bg-white text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  value={editForm.webhookUrl || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, webhookUrl: e.target.value })
                  }
                  placeholder="Ex: https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Deixe em branco para desativar a sincronização automática.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-600 transition flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  Salvar Webhook
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-slate-100 pt-8">
              <h3 className="font-bold text-slate-800 mb-4">Como funciona?</h3>
              <div className="text-sm text-slate-600 space-y-4">
                <p>
                  Enviaremos um JSON no corpo da requisição POST com a seguinte
                  estrutura:
                </p>
                <pre className="bg-marsala-800 text-emerald-400 p-4 rounded-xl overflow-x-auto text-xs font-mono">
                  {`{
  "event": "appointment_created", // ou patient_created, appointment_updated...
  "data": {
    "id": "...", 
    // dados do paciente ou sessão
  },
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                </pre>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-100 pt-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 font-sans">
                <MessageCircle className="w-5 h-5 text-emerald-600" /> Modelos
                de Mensagem para WhatsApp
              </h2>
              <p className="text-sm text-slate-600 mb-6 font-sans">
                Configure os textos padrões das mensagens de lembretes de
                sessões, fechamento de pendências financeiras, votos de
                aniversários e outras notificações. Você pode utilizar marcações
                dinâmicas que serão substituídas automaticamente com os dados do
                paciente ou da sessão antes de enviar.
              </p>

              <div className="bg-amber-50/80 border border-amber-100 p-4 rounded-xl mb-6">
                <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5 font-sans">
                  <span className="font-semibold text-xs bg-amber-250 text-amber-900 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Tags Dinâmicas Disponíveis
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-700">
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{nome}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Primeiro nome
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{nome_completo}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans font-medium text-[10px]">
                      Nome completo
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{data}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Data da sessão
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs font-sans">
                    <code className="text-amber-600 font-bold font-mono">{`{hora}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Hora da sessão
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{valor}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Valor pendente
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{pix}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Sua chave Pix
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                    <code className="text-amber-600 font-bold font-mono">{`{meunome}`}</code>
                    <span className="block text-slate-500 mt-1 font-sans">
                      Seu nome prof.
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5 font-sans">
                      <CalendarIcon className="w-4 h-4 text-emerald-600" />{" "}
                      Lembrete de Sessão
                    </label>
                    <textarea
                      rows={5}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-amber-400 focus:bg-white outline-none font-sans bg-white shadow-xs resize-none text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.whatsappReminderTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          whatsappReminderTemplate: e.target.value,
                        })
                      }
                      placeholder={`Ex: Olá {nome}, tudo bem? Passando para lembrar da nossa próxima sessão agendada para {data} às {hora}. Até lá!`}
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5 font-sans">
                      <DollarSign className="w-4 h-4 text-emerald-600" />{" "}
                      Pendências Financeiras
                    </label>
                    <textarea
                      rows={5}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-amber-400 focus:bg-white outline-none font-sans bg-white shadow-xs resize-none text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.whatsappFinancialTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          whatsappFinancialTemplate: e.target.value,
                        })
                      }
                      placeholder={`Ex: Olá {nome}. Segue fechamento das nossas sessões realizadas. O valor pendente é de {valor}. Pix de pagamento: {pix}. Abraço.`}
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5 font-sans">
                      <Gift className="w-4 h-4 text-rose-500" /> Mensagem de
                      Aniversário
                    </label>
                    <textarea
                      rows={5}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-amber-400 focus:bg-white outline-none font-sans bg-white shadow-xs resize-none text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.whatsappBirthdayTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          whatsappBirthdayTemplate: e.target.value,
                        })
                      }
                      placeholder={`Ex: Olá {nome}! Parabéns pelo seu aniversário! Desejo muita saúde, paz, alegria e realizações na sua jornada. Um grande abraço!`}
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col">
                    <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5 font-sans">
                      <AlertCircle className="w-4 h-4 text-indigo-500" /> Outras
                      Mensagens / Geral
                    </label>
                    <textarea
                      rows={5}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-amber-400 focus:bg-white outline-none font-sans bg-white shadow-xs resize-none text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                      value={editForm.whatsappOtherTemplate || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          whatsappOtherTemplate: e.target.value,
                        })
                      }
                      placeholder={`Ex: Olá {nome}, tudo bem? Espero que sim.`}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition flex items-center gap-2 cursor-pointer shadow-sm font-sans"
                  >
                    {saving ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Salvar Modelos de Mensagem
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "suporte" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-500" /> Canais de Suporte
            </h2>
            <div className="max-w-2xl">
              <p className="text-slate-600 mb-8 leading-relaxed">
                Precisa de ajuda com a plataforma? Entre em contato através dos
                nossos canais de atendimento oficiais. Estaremos prontos para te
                atender.
              </p>

              <div className="grid gap-6">
                <a
                  href={
                    supportSettings?.phone
                      ? `https://wa.me/${formatWa(supportSettings.phone)}?text=${encodeURIComponent(supportSettings.message || "Olá, preciso de ajuda com a plataforma.")}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center p-6 border rounded-2xl transition group",
                    supportSettings?.phone
                      ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
                      : "border-slate-200 opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition shrink-0">
                    <MessageCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Atendimento via WhatsApp
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {supportSettings?.phone
                        ? `Suporte direto no número ${supportSettings.phone}`
                        : "Em breve"}
                    </p>
                  </div>
                </a>

                <a
                  href={
                    supportSettings?.email
                      ? `mailto:${supportSettings.email}?subject=Suporte Plataforma`
                      : "#"
                  }
                  className={cn(
                    "flex items-center p-6 border rounded-2xl transition group",
                    supportSettings?.email
                      ? "border-amber-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
                      : "border-slate-200 opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition shrink-0">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      Atendimento via E-mail
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {supportSettings?.email
                        ? `Envie um e-mail para ${supportSettings.email}`
                        : "Em breve"}
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assinatura" && (
          <div className="animate-in fade-in">
            <TabHeader
              icon={CreditCard}
              title="Assinatura"
              description="Área onde o próprio psicólogo gerencia sua assinatura do SaaS da ELO (planos, atualizações e pagamentos)."
            />
            <SubscriptionManager
              userId={userId}
              profileData={profileData}
              onUpdateProfile={onUpdateProfile}
            />
          </div>
        )}
      </div>

      {/* Generated Meet Modal */}
      {generatedMeetLink && (
        <div className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-500" />
                Sala Gerada
              </h2>
              <button
                onClick={() => setGeneratedMeetLink(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex flex-col gap-4">
              <p className="text-sm text-slate-600">
                Sua sala do Google Meet foi gerada. O link foi copiado para sua área de transferência.
              </p>
              <div className="bg-white p-4 rounded-xl border border-slate-200 break-all select-all text-sm font-medium text-slate-800 font-mono text-center">
                {generatedMeetLink}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setGeneratedMeetLink(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm flex-1 sm:flex-none text-center"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedMeetLink);
                  alert("Link copiado!");
                }}
                className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center justify-center gap-2 text-sm flex-1 sm:flex-none"
              >
                <Copy className="w-4 h-4" /> Copiar Link
              </button>
              <a
                href={generatedMeetLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setGeneratedMeetLink(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 text-sm flex-1 sm:flex-none"
              >
                Acessar Sala <ExternalLink className="w-4 h-4 text-indigo-300" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/95 backdrop-blur z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" />
                Backup & Exportar Pacientes
              </h2>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Informational callout */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-0.5">Informações inclusas no backup:</p>
                  <p>Inclusão de todos os dados cadastrais, dados dos responsáveis (se menor de idade), datas de reajuste anual, histórico completo de reajustes realizados e todas as sessões desmembradas (com serviço, modalidade, faturamento, valor e evolução clínica/prontuário).</p>
                </div>
              </div>

              {/* Independent Filter Selection */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Filtro de Período do Backup (Independente)
                  </span>
                  
                  {/* Segmented controls */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setExportFilterType("all")}
                      className={cn(
                        "py-2 text-xs font-semibold rounded-lg transition-all",
                        exportFilterType === "all"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Todo o Histórico
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFilterType("period")}
                      className={cn(
                        "py-2 text-xs font-semibold rounded-lg transition-all",
                        exportFilterType === "period"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Período Específico
                    </button>
                  </div>
                </div>

                {exportFilterType === "period" && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-xs font-semibold text-slate-700">
                        Ano do Backup
                      </label>
                      <select
                        value={exportFilterYear}
                        onChange={(e) => setExportFilterYear(Number(e.target.value))}
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:ring-amber-400 focus:outline-none min-w-[120px]"
                      >
                        {Array.from({ length: 7 }, (_, idx) => new Date().getFullYear() - 4 + idx).map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Month Multi-Select */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700">
                          Meses do Backup
                        </label>
                        <div className="flex gap-2 text-[10px] font-medium">
                          <button
                            type="button"
                            onClick={() => setExportFilterMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])}
                            className="text-amber-600 hover:text-amber-700 underline"
                          >
                            Todos
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setExportFilterMonths([])}
                            className="text-amber-600 hover:text-amber-700 underline"
                          >
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          "Jan",
                          "Fev",
                          "Mar",
                          "Abr",
                          "Mai",
                          "Jun",
                          "Jul",
                          "Ago",
                          "Set",
                          "Out",
                          "Nov",
                          "Dez",
                        ].map((monthName, idx) => {
                          const isSelected = exportFilterMonths.includes(idx);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setExportFilterMonths(exportFilterMonths.filter((m) => m !== idx));
                                } else {
                                  setExportFilterMonths([...exportFilterMonths, idx].sort((a, b) => a - b));
                                }
                              }}
                              className={cn(
                                "py-1.5 text-xs rounded-lg font-medium border transition-all text-center",
                                isSelected
                                  ? "bg-amber-500 text-white border-amber-500 font-bold shadow-sm shadow-amber-500/10"
                                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                              )}
                            >
                              {monthName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected filter status text */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <span className="text-xs text-slate-600 block">
                    {exportFilterType === "all" ? (
                      <>
                        Exportando <strong>Todo o Histórico</strong> de atendimentos.
                      </>
                    ) : exportFilterMonths.length === 0 ? (
                      <span className="text-rose-500 font-semibold">
                        Por favor, selecione pelo menos um mês.
                      </span>
                    ) : (
                      <>
                        Exportando meses:{" "}
                        <strong>
                          {exportFilterMonths
                            .map(
                              (m) =>
                                [
                                  "Jan",
                                  "Fev",
                                  "Mar",
                                  "Abr",
                                  "Mai",
                                  "Jun",
                                  "Jul",
                                  "Ago",
                                  "Set",
                                  "Out",
                                  "Nov",
                                  "Dez",
                                ][m],
                            )
                            .join(", ")}
                        </strong>{" "}
                        de <strong>{exportFilterYear}</strong>.
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
              <button
                onClick={executeExportToDrive}
                disabled={isExportingDrive || (exportFilterType === "period" && exportFilterMonths.length === 0)}
                className="w-full px-4 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isExportingDrive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isExportingDrive
                  ? "Salvando..."
                  : "Salvar direto no Google Drive"}
              </button>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-lg font-medium transition disabled:opacity-50"
                  disabled={isExportingDrive}
                >
                  Cancelar
                </button>
                <button
                  onClick={executeExportCSV}
                  disabled={isExportingDrive || (exportFilterType === "period" && exportFilterMonths.length === 0)}
                  className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-4 h-4" /> Baixar Planilha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notificationModalClient && (
        <div className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                Central de Notificações -{" "}
                {notificationModalClient.name.split(" ")[0]}
              </h2>
              <button
                onClick={() => setNotificationModalClient(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Selecione o Tipo de Mensagem
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleTemplateChange("financial", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "financial"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Fechamento Financeiro
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("receipt", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "receipt"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Recibo de Sessão
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("invoice", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "invoice"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    NF emitida
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("referral", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "referral"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Encaminhamentos / Documentos
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("reminder", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "reminder"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Lembrete de Sessão
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("birthday", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "birthday"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Mensagem de Aniversário
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange(
                        "readjustment",
                        notificationModalClient,
                      )
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "readjustment"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Reajuste Anual
                  </button>
                  <button
                    onClick={() =>
                      handleTemplateChange("other", notificationModalClient)
                    }
                    className={cn(
                      "px-4 py-2 border rounded-full text-sm font-medium transition",
                      notificationTemplate === "other"
                        ? "bg-marsala-700 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    Outro
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Assunto (Visível apenas para E-mail)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={notificationSubject}
                    onChange={(e) => setNotificationSubject(e.target.value)}
                  />
                </div>
                {profileData?.materials && profileData.materials.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Anexar Materiais Exclusivos (Links)
                    </label>
                    <div className="flex flex-col gap-2 mb-4">
                      {profileData.materials.map((mat: any, idx: number) => {
                        const url =
                          typeof mat === "string" ? mat : mat.url || "";
                        const desc =
                          typeof mat === "string"
                            ? "Material"
                            : mat.description || "Material";
                        if (!url) return null;
                        return (
                          <label
                            key={idx}
                            className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition"
                          >
                            <input
                              type="checkbox"
                              className="rounded text-amber-500 w-4 h-4 cursor-pointer focus:ring-amber-500 border-slate-300 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                              checked={selectedMaterialIndices.includes(idx)}
                              onChange={(e) => {
                                let newIndices = [...selectedMaterialIndices];
                                if (e.target.checked) newIndices.push(idx);
                                else
                                  newIndices = newIndices.filter(
                                    (i) => i !== idx,
                                  );
                                setSelectedMaterialIndices(newIndices);
                                const textToAppend = `\n\n${desc}: ${url}`;
                                if (e.target.checked) {
                                  setNotificationMessage(
                                    (prev) => prev + textToAppend,
                                  );
                                } else {
                                  setNotificationMessage((prev) =>
                                    prev.replace(textToAppend, ""),
                                  );
                                }
                              }}
                            />
                            <span className="font-medium text-slate-800">
                              {desc}
                            </span>
                            <span className="text-slate-500 truncate max-w-sm block">
                              {url}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(notificationTemplate === "receipt" || notificationTemplate === "invoice") && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {notificationTemplate === "invoice"
                        ? "Selecione as sessões para a nota emitida"
                        : "Selecione as sessões para o recibo"}
                    </label>
                    <div className="flex flex-col gap-2 mb-4 max-h-[40vh] overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
                      {appointments
                        .filter(
                          (a) => {
                            const isCompany = !!notificationModalClient?.cnpj;
                            const matchesId = isCompany
                              ? a.companyId === notificationModalClient?.id
                              : a.clientId === notificationModalClient?.id;
                            return matchesId && (a.status === "completed" || a.paymentStatus === "paid" || true);
                          }
                        )
                        .sort((a, b) => {
                          const da = !isNaN(new Date(a.datetime).getTime())
                            ? new Date(a.datetime).getTime()
                            : 0;
                          const db = !isNaN(new Date(b.datetime).getTime())
                            ? new Date(b.datetime).getTime()
                            : 0;
                          return db - da; // Mais recentes primeiro
                        })
                        .map((appt: any) => {
                          const dateStr = !isNaN(
                            new Date(appt.datetime).getTime(),
                          )
                            ? format(new Date(appt.datetime), "dd/MM/yyyy")
                            : appt.datetime;
                          const serviceName =
                            appt.serviceName || "Sessão Padrão";
                          const amount = Number(appt.totalAmount || 0);
                          const appendText = `${dateStr} - ${serviceName} - R$ ${amount.toFixed(2).replace(".", ",")}`;
                          const isChecked = receiptSessionIds.includes(appt.id);

                          return (
                            <label
                              key={appt.id}
                              className="flex items-center gap-3 text-sm text-slate-700 bg-white p-2.5 rounded-md border border-slate-100 cursor-pointer hover:bg-slate-50 transition shadow-sm"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-amber-500 w-4 h-4 cursor-pointer focus:ring-amber-500 border-slate-300 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newIds = [...receiptSessionIds];
                                  if (e.target.checked) {
                                    newIds.push(appt.id);
                                  } else {
                                    newIds = newIds.filter(
                                      (id) => id !== appt.id,
                                    );
                                  }
                                  setReceiptSessionIds(newIds);

                                  // Recalculate total
                                  const newTotal = newIds.reduce((sum, id) => {
                                    const a = appointments.find(
                                      (x) => x.id === id,
                                    );
                                    return (
                                      sum + (a ? Number(a.totalAmount || 0) : 0)
                                    );
                                  }, 0);

                                  // Update message
                                  let currentMsg = notificationMessage;
                                  if (e.target.checked) {
                                    currentMsg = currentMsg.replace(
                                      "Total: R$ ",
                                      appendText + "\nTotal: R$ ",
                                    );
                                  } else {
                                    currentMsg = currentMsg.replace(
                                      appendText + "\n",
                                      "",
                                    );
                                  }

                                  currentMsg = currentMsg.replace(
                                    /Total: R\$ \d*(?:\.\d+)?(?:,\d{2})?/,
                                    `Total: R$ ${newTotal.toFixed(2).replace(".", ",")}`,
                                  );

                                  setNotificationMessage(currentMsg);
                                }}
                              />
                              <span className="font-medium text-slate-800">
                                {dateStr}
                              </span>
                              <span className="text-slate-500 truncate max-w-[200px]">
                                {serviceName}
                              </span>
                              <span className="font-bold text-slate-700 ml-auto">
                                {formatMoneyUI(amount, hideFinance)}
                              </span>
                            </label>
                          );
                        })}
                      {appointments.filter((a) => {
                        const isCompany = !!notificationModalClient?.cnpj;
                        return isCompany
                          ? a.companyId === notificationModalClient?.id
                          : a.clientId === notificationModalClient?.id;
                      }).length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                          {notificationModalClient?.cnpj
                            ? "Nenhuma sessão encontrada para esta empresa."
                            : "Nenhuma sessão encontrada para este paciente."}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 mb-4 bg-blue-50 p-2 rounded border border-blue-100">
                      Dica: Selecionar as sessões acima adicionará
                      automaticamente as linhas e atualizará o total formatado
                      no corpo do texto abaixo.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Mensagem
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Edite a mensagem abaixo conforme necessário antes de enviar.
                  </p>
                  <textarea
                    className="w-full p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none min-h-[250px] leading-relaxed resize-y text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex flex-col md:flex-row justify-end gap-3">
              <button
                onClick={() => setNotificationModalClient(null)}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-xl font-medium transition"
              >
                Cancelar
              </button>
              <a
                href={`mailto:${notificationModalClient.email}?subject=${encodeURIComponent(notificationSubject)}&body=${encodeURIComponent(notificationMessage)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setNotificationModalClient(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Enviar por E-mail
              </a>
              <a
                href={`https://wa.me/${formatWa(notificationModalClient.phone)}?text=${encodeURIComponent(notificationMessage)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setNotificationModalClient(null)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Enviar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-marsala-800/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-slate-600 mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                  }
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {readjustmentConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-marsala-800/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Confirmar Processo de Reajuste Anual
                  </h3>
                  <p className="text-xs text-slate-500">
                    {readjustmentConfirmModal.type === "client" ? "Paciente" : "Empresa"}:{" "}
                    <strong className="font-semibold text-slate-700">
                      {readjustmentConfirmModal.entity?.name}
                    </strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmReadjustmentProcess} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
                  Ao preencher este formulário e confirmar, o sistema registrará este reajuste no histórico financeiro do cliente e desativará o alerta visual do card para o ano corrente de{" "}
                  <strong className="font-bold">{new Date().getFullYear()}</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Percentual de Reajuste (%) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      placeholder="Ex: 5.5"
                      value={readjustmentPercent}
                      onChange={(e) => setReadjustmentPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Novo Valor do Serviço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                      placeholder="Ex: 150.00"
                      value={readjustmentNewValue}
                      onChange={(e) => setReadjustmentNewValue(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Anotações / Observações do Reajuste
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-amber-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                    placeholder="Ex: Reajuste anual acordado conforme IPCA acumulado..."
                    value={readjustmentNotes}
                    onChange={(e) => setReadjustmentNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() =>
                      setReadjustmentConfirmModal({
                        isOpen: false,
                        entity: null,
                        type: null,
                      })
                    }
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition shadow-sm"
                  >
                    Confirmar e Aplicar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showContractEditor && (
        <div className="fixed inset-0 bg-marsala-800/60 flex items-center justify-center p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Editar Termos de Contrato (
                {showContractEditor === "paciente" ? "Pacientes" : "Empresas"})
              </h3>
              <button
                onClick={() => setShowContractEditor(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-4">
                Este texto será exibido aos{" "}
                {showContractEditor === "paciente" ? "pacientes" : "empresas"}{" "}
                quando você enviar o link de termos para assinatura online.
              </p>
              <textarea
                rows={15}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-400 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                value={
                  showContractEditor === "paciente"
                    ? profileData?.contractTerms || ""
                    : profileData?.companyContractTerms || ""
                }
                onChange={(e) => {
                  onUpdateProfile({
                    ...profileData,
                    [showContractEditor === "paciente"
                      ? "contractTerms"
                      : "companyContractTerms"]: e.target.value,
                  });
                }}
                placeholder="Insira as cláusulas do contrato aqui..."
              />
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white/80 backdrop-blur-md">
              <button
                onClick={() => setShowContractEditor(null)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setSaving(true);
                  try {
                    const field =
                      showContractEditor === "paciente"
                        ? "contractTerms"
                        : "companyContractTerms";
                    await updateDoc(doc(db, "profiles", userId), {
                      [field]: profileData?.[field] || "",
                      updatedAt: serverTimestamp(),
                    });
                    alert("Contrato salvo com sucesso!");
                    setShowContractEditor(null);
                  } catch (e) {
                    alert("Erro ao salvar");
                  }
                  setSaving(false);
                }}
                disabled={saving}
                className="px-5 py-2.5 bg-marsala-800 text-white font-medium hover:bg-marsala-700 rounded-xl transition flex items-center gap-2"
              >
                {saving ? "Salvando..." : "Salvar Contrato"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isManageAccountsOpen && (
        <div className="fixed inset-0 bg-marsala-800/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-slate-800">
                  Contas / Locais de Faturamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageAccountsOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-1.5 rounded-full border border-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500">
                Adicione novas contas ou remova contas existentes. A lista
                configurada será exibida em todas as áreas de agendamento de
                consultas (pacientes e empresas) e no gerente de faturamento.
              </p>

              {/* Add form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da Conta (Ex: Banco Inter, Pix, etc)"
                  className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-amber-400 text-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:bg-slate-800 dark:border-slate-700"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBillingAccount(newAccountName);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddBillingAccount(newAccountName)}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-1 shrink-0 bg-amber-500"
                >
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>

              {/* Accounts list */}
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden bg-slate-50/30">
                {billingAccounts.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Nenhuma conta cadastrada. Use o campo acima para adicionar.
                  </div>
                ) : (
                  billingAccounts.map((acc: string) => (
                    <div
                      key={acc}
                      className="flex justify-between items-center p-3 px-4 bg-white text-sm hover:bg-slate-50 transition"
                    >
                      <span className="font-semibold text-slate-700">
                        {acc}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteBillingAccount(acc)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                        title={`Excluir conta ${acc}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageAccountsOpen(false)}
                className="px-4 py-2 bg-marsala-700 hover:bg-marsala-800 text-white font-medium rounded-lg text-sm transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
