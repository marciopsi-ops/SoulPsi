import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  Sparkles,
  CreditCard,
  QrCode,
  Lock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  ArrowRight,
  FileText,
  ChevronRight,
  Coins,
  Bell,
  RefreshCw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { format, addMonths, addYears } from "date-fns";

interface SubscriptionManagerProps {
  userId: string;
  profileData: any;
  onUpdateProfile: (data: any) => void;
  onClose?: () => void;
}

export function SubscriptionManager({
  userId,
  profileData,
  onUpdateProfile,
  onClose,
}: SubscriptionManagerProps) {
  const [selectedPlanType, setSelectedPlanType] = useState<"essencial" | "gestao_total">("essencial");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | null>(
    null,
  );
  const [step, setStep] = useState<
    "plans" | "checkout" | "processing" | "success"
  >("plans");
  const [loading, setLoading] = useState(false);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCountdown, setPixCountdown] = useState(600); // 10 minutes
  const [forceShowPlans, setForceShowPlans] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<any>(null);

  useEffect(() => {
    const fetchStripeConfig = async () => {
      try {
        const plansSnap = await getDoc(doc(db, "admin_settings", "subscription_plans"));
        if (plansSnap.exists()) {
          setStripeConfig(plansSnap.data());
        } else {
          const snap = await getDoc(doc(db, "admin_settings", "stripe_public"));
          if (snap.exists()) {
            setStripeConfig(snap.data());
          }
        }
      } catch (err) {
        console.error("Error loading stripe config in SubscriptionManager:", err);
      }
    };
    fetchStripeConfig();
  }, []);

  const amountProfMonthly = stripeConfig?.amountProfMonthly ? Number(stripeConfig.amountProfMonthly) : 59.90;
  const amountProfYearly = stripeConfig?.amountProfYearly ? Number(stripeConfig.amountProfYearly) : 499.90;
  const amountPremMonthly = stripeConfig?.amountPremMonthly ? Number(stripeConfig.amountPremMonthly) : 99.90;
  const amountPremYearly = stripeConfig?.amountPremYearly ? Number(stripeConfig.amountPremYearly) : 839.90;

  const isTrial = profileData?.subscriptionStatus === "trial";
  const isTrialValid =
    isTrial &&
    profileData?.trialEndsAt &&
    new Date(profileData.trialEndsAt) > new Date();
  const isActive = profileData?.subscriptionStatus === "active";

  const planPrice =
    selectedPlanType === "essencial"
      ? selectedBillingCycle === "monthly"
        ? amountProfMonthly
        : amountProfYearly
      : selectedBillingCycle === "monthly"
        ? amountPremMonthly
        : amountPremYearly;

  const planName =
    selectedPlanType === "essencial"
      ? selectedBillingCycle === "monthly"
        ? "Plano Essencial Mensal"
        : "Plano Essencial Anual (30% OFF)"
      : selectedBillingCycle === "monthly"
        ? "Plano Gestão Total Mensal"
        : "Plano Gestão Total Anual (30% OFF)";

  // Countdown for Pix QR Code
  useEffect(() => {
    if (step === "checkout" && paymentMethod === "pix" && pixCountdown > 0) {
      const timer = setInterval(() => {
        setPixCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, paymentMethod, pixCountdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Safe credit card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const matches = val.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(val);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + "/" + val.substring(2);
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 4);
    setCardCvv(val);
  };

  const handleCopyPix = () => {
    const priceStr = selectedPlanType === "essencial"
      ? (selectedBillingCycle === "monthly" ? amountProfMonthly.toFixed(2) : amountProfYearly.toFixed(2))
      : (selectedBillingCycle === "monthly" ? amountPremMonthly.toFixed(2) : amountPremYearly.toFixed(2));
    const pixCode = `00020101021226870014br.gov.bcb.pix25650021elo-solucoes-humanas-checkout-prod-5204000053039865405${priceStr}5802BR5925ELO SOLUCOES HUMANAS LTDA6009SAO PAULO62070503***6304CA3B`;
    try {
      navigator.clipboard.writeText(pixCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    } catch (err) {
      console.warn("Clipboard access failed:", err);
      alert("Código Pix copiado! (Caso não tenha sido copiado automaticamente devido às permissões do seu navegador, selecione o código no campo abaixo para copiar)");
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    }
  };

  // Execute actual database update
  const handleProcessPayment = async () => {
    if (paymentMethod === "card") {
      if (
        !cardName.trim() ||
        cardNumber.length < 19 ||
        cardExpiry.length < 5 ||
        cardCvv.length < 3
      ) {
        alert(
          "Por favor, preencha todos os dados do cartão de crédito corretamente.",
        );
        return;
      }
    }

    setStep("processing");
    setLoading(true);

    try {
      // Direct Firestore sync
      const userRef = doc(db, "profiles", userId);
      const endsAt =
        selectedBillingCycle === "monthly"
          ? addMonths(new Date(), 1)
          : addYears(new Date(), 1);

      const newSubscriptionData = {
        subscriptionStatus: "active",
        activePlan: selectedPlanType,
        billingCycle: selectedBillingCycle,
        trialEndsAt: null,
        subscriptionStartedAt: new Date().toISOString(),
        subscriptionExpiresAt: endsAt.toISOString(),
        subscriptionPrice: planPrice,
        paymentMethod: paymentMethod === "card" ? "credit_card" : "pix",
        lastPaymentDate: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, newSubscriptionData);

      // Trigger automatic receipt system notification for professional area
      try {
        const notifRef = doc(
          db,
          `profiles/${userId}/system_notifications`,
          `billing_${Date.now()}`,
        );
        await setDoc(notifRef, {
          title: "Assinatura Ativada! 🎉",
          message: `Obrigado! Seu pagamento para o ${planName} foi processado e aprovado com sucesso via Stripe. Todas as funcionalidades já estão totalmente liberadas.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // Safe check in case write fails
      }

      onUpdateProfile({
        ...profileData,
        ...newSubscriptionData,
      });

      setForceShowPlans(false);
      setStep("success");
    } catch (e: any) {
      setStep("checkout");
      handleFirestoreError(e, OperationType.UPDATE, `profiles/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  if (isActive && !forceShowPlans) {
    const nextDate = profileData?.subscriptionExpiresAt
      ? new Date(profileData.subscriptionExpiresAt)
      : addMonths(
          new Date(profileData?.subscriptionStartedAt || Date.now()),
          1,
        );

    const invoices = [
      {
        id: "INV-0229",
        date: profileData?.lastPaymentDate
          ? new Date(profileData.lastPaymentDate)
          : new Date(),
        amount: profileData?.subscriptionPrice || amountProfMonthly,
        method:
          profileData?.paymentMethod === "pix"
            ? "Pix"
            : "Cartão de Crédito (Visa •••• 4242)",
        status: "paid",
      },
      {
        id: "INV-0182",
        date: addMonths(
          profileData?.lastPaymentDate
            ? new Date(profileData.lastPaymentDate)
            : new Date(),
          -1,
        ),
        amount: profileData?.subscriptionPrice || amountProfMonthly,
        method: "Pix",
        status: "paid",
        dummy: true,
      },
    ];

    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm max-w-4xl mx-auto font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200/50 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Assinatura Ativa
              </span>
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200/40">
                Stripe Billing
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Sua Assinatura ELO
            </h2>
            <p className="text-slate-500 mt-1">
              Gerencie os detalhes do seu plano, faturas e métodos de cobrança.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 uppercase font-black tracking-wider leading-none mb-1">
                Próxima Cobrança Auto
              </p>
              <p className="text-lg font-black text-slate-800">
                {format(nextDate, "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-slate-500 font-bold">
                R${" "}
                {(profileData?.subscriptionPrice || amountProfMonthly)
                  .toFixed(2)
                  .replace(".", ",")}
                /{profileData?.activePlan === "yearly" ? "ano" : "mês"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2">
              Plano Atual
            </h3>
            <p className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              {profileData?.activePlan === "gestao_total" || profileData?.activePlan === "yearly"
                ? "Plano Gestão Total"
                : "Plano Essencial"}
            </p>
            <p className="text-xs text-slate-450 mt-1">
              {profileData?.activePlan === "gestao_total" || profileData?.activePlan === "yearly"
                ? "Acesso completo a todas as ferramentas e IA."
                : "Acesso às configurações, perfil, serviços, agenda e avaliações."}
            </p>
          </div>

          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2">
              Forma de Pagamento
            </h3>
            <p className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              {profileData?.paymentMethod === "credit_card"
                ? "Cartão Mastercard •••• 4242"
                : "Link Direto Pix"}
            </p>
            <p className="text-xs text-slate-450 mt-1">
              Cobrança automática ativa via gateway Stripe.
            </p>
          </div>

          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
            <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2">
              Suporte Prioritário
            </h3>
            <p className="text-sm font-extrabold text-slate-800">
              Liberado & Ativo
            </p>
            <p className="text-xs text-slate-450 mt-1">
              Seu plano possui acesso direto aos canais de apoio do comercial.
            </p>
          </div>
        </div>

        {/* Upgrade alert */}
        {profileData?.activePlan !== "gestao_total" && profileData?.activePlan !== "yearly" && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-300 rounded-3xl p-6 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-left">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Quer liberar a Gestão Total?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Faturamento de pacientes e empresas, documentos automatizados, gerenciador de materiais, WhatsApp integrado e transcrição inteligente de chamadas com domínio corporativo.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPlanType("gestao_total");
                setForceShowPlans(true);
                setStep("plans");
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition shrink-0 shadow-md whitespace-nowrap"
            >
              Fazer Upgrade para Gestão Total
            </button>
          </div>
        )}

        {/* Invoice List */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" /> Histórico de
            Transações e Faturas
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                  <th className="p-4">Fatura ID</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-800 flex items-center gap-1">
                      {inv.id}
                    </td>
                    <td className="p-4 text-slate-600">
                      {format(inv.date, "dd/MM/yyyy")}
                    </td>
                    <td className="p-4 font-extrabold text-slate-700">
                      R$ {inv.amount.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="p-4 text-slate-550 text-xs font-semibold">
                      {inv.method}
                    </td>
                    <td className="p-4">
                      <span className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-green-200">
                        Pago
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50/40 p-4 rounded-xl border border-amber-100/50 text-xs">
            <span className="text-amber-800 font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />{" "}
              Gerenciamento seguro tokenizado sob os rígidos padrões PCI-DSS do
              Stripe.
            </span>
            <button
              onClick={() =>
                alert(
                  "O Portal de Cliente Stripe permite que você mude formas de pagamento, visualize faturas ou cancele sua assinatura em produção real.",
                )
              }
              className="px-3.5 py-1.5 bg-white border border-amber-200 text-amber-800 font-bold rounded-lg hover:bg-amber-100/50 transition-colors"
            >
              Acessar Portal do Stripe
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 max-w-4xl mx-auto shadow-sm font-sans relative overflow-hidden">
      {step === "plans" && (
        <>
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-black px-3.5 py-1.5 rounded-full mb-4 border border-amber-200/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Escolha o seu plano ELO
            </div>
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Os melhores planos para você
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Trabalhe com o plano Essencial para agendamentos ou libere a Gestão Total para controle total de prontuários, financeiro, faturamento de empresas e transcrições automáticas.
            </p>

            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-2 mt-6 bg-slate-100 p-1.5 rounded-xl max-w-xs mx-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("monthly")}
                className={cn(
                  "flex-1 text-xs py-2 px-3 rounded-lg font-bold transition",
                  selectedBillingCycle === "monthly"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingCycle("yearly")}
                className={cn(
                  "flex-1 text-xs py-2 px-3 rounded-lg font-bold transition relative",
                  selectedBillingCycle === "yearly"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                Anual
                <span className="absolute -top-3.5 -right-3.5 bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-bounce">
                  30% OFF
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-10">
            {/* Plan 1 - Essencial */}
            <div
              onClick={() => setSelectedPlanType("essencial")}
              className={cn(
                "p-8 rounded-[2rem] border-2 text-left cursor-pointer transition-all flex flex-col justify-between relative",
                selectedPlanType === "essencial"
                  ? "border-amber-400 bg-amber-50/20 shadow-md shadow-amber-100/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800">
                      Plano Essencial
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Para controle individual e agendamentos
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedPlanType === "essencial"
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-300",
                    )}
                  >
                    {selectedPlanType === "essencial" && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 my-5 text-slate-700">
                  <span className="text-md font-bold">R$</span>
                  <span className="text-4xl font-black text-slate-800">
                    {selectedBillingCycle === "monthly"
                      ? amountProfMonthly.toFixed(2).replace(".", ",")
                      : amountProfYearly.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-slate-450 font-bold">
                    /{selectedBillingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Acesso completo à área "Meu Perfil"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Gerenciamento próprio de Serviços
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Controle da "Minha Agenda"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Gestão de Avaliações recebidas
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Lock className="w-3.5 h-3.5 shrink-0" /> Gestão de Pacientes (Apenas modo Demo)
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <Lock className="w-3.5 h-3.5 shrink-0" /> Faturamento e Notas (Apenas modo Demo)
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan 2 - Gestão Total */}
            <div
              onClick={() => setSelectedPlanType("gestao_total")}
              className={cn(
                "p-8 rounded-[2rem] border-2 text-left cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden",
                selectedPlanType === "gestao_total"
                  ? "border-amber-500 bg-amber-50/20 shadow-md shadow-amber-100/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div className="absolute top-3.5 right-[-35px] bg-amber-500 text-white text-[9px] font-black uppercase py-1 px-10 rotate-45 tracking-wider">
                MELHOR OPÇÃO
              </div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-800">
                      Gestão Total
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Controle total, faturamento e IA
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedPlanType === "gestao_total"
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-300",
                    )}
                  >
                    {selectedPlanType === "gestao_total" && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline gap-1 my-5 text-slate-700">
                  <span className="text-md font-bold">R$</span>
                  <span className="text-4xl font-black text-slate-800">
                    {selectedBillingCycle === "monthly"
                      ? amountPremMonthly.toFixed(2).replace(".", ",")
                      : amountPremYearly.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-slate-450 font-bold">
                    /{selectedBillingCycle === "monthly" ? "mês" : "ano"}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600 font-medium pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    <strong>Tudo do Plano Essencial</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Gestão Completa de Pacientes e Faturamento
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Gestão de Empresas e Faturamento Corporativo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    <strong>Vídeo Chamadas com Transcrição & Resumo</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Gerenciamento de Materiais e Termos / Contratos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />{" "}
                    Conta corporativa com domínio da plataforma
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 border-t border-slate-100 pt-8 max-w-md mx-auto">
            {(onClose || forceShowPlans) && (
              <button
                onClick={() => {
                  if (forceShowPlans) {
                    setForceShowPlans(false);
                  } else if (onClose) {
                    onClose();
                  }
                }}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                setPaymentMethod("card");
                setStep("checkout");
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl transition shadow flex items-center justify-center gap-2 font-semibold text-sm"
            >
              Prosseguir para o Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {step === "checkout" && (
        <div className="max-w-2xl mx-auto">
          {/* Header checkout */}
          <div className="flex items-center justify-between border-b border-slate-150 pb-5 mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                Checkout Seguro Stripe
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Assinando:{" "}
                <span className="font-bold text-amber-600">{planName}</span> •
                R$ {planPrice.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-450">
              <Lock className="w-4 h-4 text-amber-550" />
              <span className="text-xs font-bold font-sans uppercase">
                PCI SECURE
              </span>
            </div>
          </div>

          {/* Selector de metodo de pagamento */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition",
                paymentMethod === "card"
                  ? "bg-marsala-800 border-slate-900 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              <CreditCard className="w-4 h-4" /> Cartão de Crédito
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("pix")}
              className={cn(
                "p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition",
                paymentMethod === "pix"
                  ? "bg-marsala-800 border-slate-900 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100",
              )}
            >
              <QrCode className="w-4 h-4" /> Pix Instantâneo
            </button>
          </div>

          {paymentMethod === "card" ? (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                  Nome Impresso no Cartão
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: DR ROGERIO SILVA"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                  Número do Cartão de Crédito
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full pl-3.5 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-bold"
                  />
                  <div className="absolute right-3.5 top-3.5 text-slate-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                    Validade (MM/AA)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/29"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none focus:border-amber-400 text-slate-800 font-bold text-center"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Para testes rápidos na plataforma de demonstração Sandbox,
                  sinta-se à vontade para preencher com dados fictícios ou usar
                  o número padrão de testes Stripe:{" "}
                  <span className="font-bold text-slate-700">
                    4000 1234 5678 9010
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 bg-emerald-50/20 border border-emerald-100/60 rounded-3xl p-6">
              <h4 className="text-sm font-bold text-emerald-800 mb-1">
                Código Pix para Assinatura Gerado
              </h4>
              <p className="text-xs text-slate-500 text-center mb-5">
                Escaneie o QR Code ou cole o código Copia e Cola para ativar
                instantaneamente.
              </p>

              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent("https://elo.psi/checkout-stripe-simulation")}`}
                  alt="QR Code Assinatura"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="bg-emerald-50 text-emerald-700 text-xs font-black px-3.5 py-1.5 rounded-full mb-5 flex items-center gap-1.5 border border-emerald-200/50">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Aguardando
                aprovação bancária... Expira em:{" "}
                <span className="font-bold">
                  {formatCountdown(pixCountdown)}
                </span>
              </div>

              <div className="w-full flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value="00020101021226870014br.gov.bcb.pix25650021elo-solucoes-h..."
                  className="bg-transparent text-xs text-slate-500 font-bold border-none outline-none select-all px-2 break-all flex-1"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {pixCopied ? "Copiado! ✓" : "Copiar Código"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
            <button
              onClick={() => setStep("plans")}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition"
            >
              Voltar
            </button>
            <button
              onClick={handleProcessPayment}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-6 rounded-xl transition shadow flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <Lock className="w-4 h-4" />{" "}
              {paymentMethod === "card"
                ? "Concluir Assinatura Segura"
                : "Verificamos o Pix Já Realizado"}
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center border border-amber-100/50 text-amber-500 mb-6 shadow-inner">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            Processando Transação via Stripe
          </h3>
          <p className="text-slate-500 mt-2 text-sm max-w-sm">
            Por favor, não feche esta janela nem recarregue a página. Estamos
            autenticando e registrando a liberação do seu plano com segurança.
          </p>
        </div>
      )}

      {step === "success" && (
        <div className="py-14 text-center flex flex-col items-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 border border-emerald-200">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            Assinatura Ativada com Sucesso!
          </h3>
          <p className="text-slate-600 mt-3 text-sm leading-relaxed">
            Parabéns! O seu perfil foi atualizado para o status{" "}
            <span className="font-bold text-emerald-600">Assinante Ativo</span>{" "}
            no banco de dados da ELO. Todas as ferramentas profissionais já
            foram liberadas!
          </p>

          <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl mt-6 text-left w-full">
            <div className="flex items-center gap-2.5 mb-2">
              <Calendar className="w-4 h-4 text-amber-500shrink-0" />
              <span className="text-xs font-bold text-slate-700">
                Resumo da Assinatura
              </span>
            </div>
            <ul className="text-xs text-slate-550 space-y-1.5 font-semibold">
              <li>
                • Plano: <span className="text-slate-700">{planName}</span>
              </li>
              <li>
                • Gateway de Cobrança:{" "}
                <span className="text-slate-700">Stripe Secure (Simulado)</span>
              </li>
              <li>
                • Status no Firestore:{" "}
                <span className="text-emerald-700">active</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => {
              if (onClose) onClose();
              setStep("plans");
            }}
            className="w-full bg-marsala-800 hover:bg-marsala-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow mt-8"
          >
            Acessar Plataforma Agora
          </button>
        </div>
      )}
    </div>
  );
}
