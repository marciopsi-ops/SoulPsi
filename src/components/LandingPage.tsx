import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { THEMES, hexToRgb } from "../lib/themes";
import {
  MessageCircle,
  ArrowRight,
  Star,
  Calendar,
  Building,
  GraduationCap,
  X,
  FileText,
  ExternalLink,
  Church,
  MapPin,
  Award,
  Share2,
  Check,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Link as LinkIcon,
  Phone,
  Mail,
  ArrowLeftRight,
  Mic,
  Users,
  Building2,
  MessageSquare,
  Heart,
  Eye,
  BookOpen,
  Brain,
  User,
  Smile,
  Compass,
  HeartPulse,
} from "lucide-react";

import { cn, formatWa } from "../lib/utils";

const WidgetRenderer = ({ htmlCode }: { htmlCode: string }) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; }
          </style>
        </head>
        <body>
          ${htmlCode}
          <script>
            // Automatically resize iframe to its content
            const resize = () => {
              const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
              window.parent.postMessage({ type: 'widget-resize', height }, '*');
            };
            window.addEventListener('load', resize);
            setInterval(resize, 1000);
            new MutationObserver(resize).observe(document.body, { childList: true, subtree: true, attributes: true });
          </script>
        </body>
      </html>
    `);
    doc.close();
  }, [htmlCode]);

  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "widget-resize" && iframeRef.current) {
        // Some widgets expand, add a little extra room to avoid scrollbars
        iframeRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        title="Widget de Avaliações"
        className="w-full border-none min-h-[400px]"
        scrolling="no"
      />
    </div>
  );
};

export function LandingPage({
  therapistId,
  profileData,
  onBook,
  isLoggedIn,
}: {
  therapistId: string;
  profileData: any;
  onBook: (data: any) => void;
  isLoggedIn?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<
    "voce" | "empresa" | "igrejas" | "psicologos" | "materiais"
  >("voce");
  const [reviews, setReviews] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<0 | 1 | 2>(1);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showIgrejasTab, setShowIgrejasTab] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("igrejas") || params.get("tab") === "igrejas") {
      setShowIgrejasTab(true);
      if (params.get("tab") === "igrejas") {
        setActiveTab("igrejas");
      }
    }
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openScheduleModal = (service: any, isPresencial: boolean = false) => {
    if (service.allowScheduling === false) {
      window.open(
        `https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, gostaria de conversar sobre " + service.title)}`,
        "_blank",
      );
      return;
    }
    setSelectedService(service);
    if (isPresencial && profileData?.inPersonEnabled) {
      setRegistrationStep(0);
    } else {
      setRegistrationStep(1);
    }
    setCreatedClientId(null);
    setFormErrors({});
    setShowScheduleModal(true);
  };
  const [reviewForm, setReviewForm] = useState({ authorName: "", content: "" });
  const [clientForm, setClientForm] = useState({
    name: "",
    dob: "",
    cpf: "",
    email: "",
    phone: "",
    referralSource: "",
    lgpdAccepted: false,
    appointmentDate: "",
    appointmentTime: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    cpf?: string;
    dob?: string;
    email?: string;
    phone?: string;
    referralSource?: string;
    appointmentDate?: string;
    appointmentTime?: string;
  }>({});
  const [selectedService, setSelectedService] = useState<any>(null);

  const dummyProfile = {
    name: "Marcio Rocha",
    title: "Psicólogo Clínico",
    crp: "06/128410",
    cpf: "123.456.789-00",
    city: "São Paulo, SP",
    about:
      "Olá, sou especialista no tratamento de transtornos de ansiedade e depressão. Minha missão é te ajudar a encontrar equilíbrio emocional e melhorar sua qualidade de vida através da Terapia Cognitivo-Comportamental.",
    specialties: [
      "Ansiedade",
      "Depressão",
      "Terapia de Casal",
      "Autoconhecimento",
    ],
    approaches: ["Terapia Cognitivo-Comportamental", "Mindfulness"],
    companyName: "ELO Soluções Humanas",
    cnpj: "00.000.000/0000-00",
    coverPhoto:
      "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=1600&h=400",
    profilePhoto:
      "https://images.unsplash.com/photo-1594824432258-2bafe75cdbeb?auto=format&fit=crop&q=80&w=400&h=400",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/ELO_logo.svg/1200px-ELO_logo.svg.png",
    whatsapp: "5511999999999",
  };

  const finalProfile = profileData || dummyProfile;

  const hasVoce =
    finalProfile.services?.some((s: any) => s.category === "voce") ?? false;
  const hasEmpresa =
    finalProfile.services?.some((s: any) => s.category === "empresa") ?? false;
  const hasPsicologos =
    finalProfile.services?.some(
      (s: any) => s.category === "psicologos" || s.category === "psicologo",
    ) ?? false;
  const hasIgrejas =
    finalProfile.services?.some((s: any) => s.category === "igrejas") ?? false;

  useEffect(() => {
    if (!hasVoce && activeTab === "voce") {
      if (hasEmpresa) setActiveTab("empresa");
      else if (hasIgrejas) setActiveTab("igrejas");
      else if (hasPsicologos) setActiveTab("psicologos");
    }
  }, [hasVoce, hasEmpresa, hasIgrejas, hasPsicologos, activeTab]);

  const customStyle: React.CSSProperties = {};
  if (
    finalProfile.themeColor &&
    (!finalProfile.theme || finalProfile.theme === "auto")
  ) {
    const rgb = hexToRgb(finalProfile.themeColor);
    if (rgb)
      customStyle["--theme-primary" as any] = `${rgb.r} ${rgb.g} ${rgb.b}`;
  } else if (
    finalProfile.theme &&
    finalProfile.theme !== "auto" &&
    THEMES[finalProfile.theme]
  ) {
    const themeObj = THEMES[finalProfile.theme];
    customStyle["--theme-primary" as any] =
      `${themeObj.r} ${themeObj.g} ${themeObj.b}`;
  } else {
    customStyle["--theme-primary" as any] = `37 99 235`; // default blue
  }

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, `profiles/${therapistId}/reviews`),
          where("status", "==", "approved"),
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(
          fetched.length
            ? fetched
            : [
                {
                  id: "1",
                  authorName: "Maria F.",
                  content: "Excelente profissional, mudou minha vida!",
                  status: "approved",
                },
                {
                  id: "2",
                  authorName: "Carlos A.",
                  content:
                    "Muito atencioso e empático. Recomendo de olhos fechados.",
                  status: "approved",
                },
              ],
        );
      } catch (e: any) {
        if (e.message?.includes("missing or insufficient permissions")) {
          handleFirestoreError(
            e,
            OperationType.LIST,
            `profiles/${therapistId}/reviews`,
          );
        }
        setReviews([
          {
            id: "1",
            authorName: "Maria F.",
            content: "Excelente profissional, mudou minha vida!",
            status: "approved",
          },
        ]);
      }
    };
    if (therapistId !== "demo-therapist-id") {
      fetchReviews();
    } else {
      setReviews([
        {
          id: "1",
          authorName: "Maria F.",
          content: "Excelente profissional, mudou minha vida!",
          status: "approved",
        },
      ]);
    }
  }, [therapistId]);

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: any = {};
    if (!clientForm.name.trim()) errors.name = "O nome é obrigatório.";
    if (!clientForm.dob) errors.dob = "A data de nascimento é obrigatória.";
    if (!clientForm.referralSource.trim())
      errors.referralSource = "Por favor, informe de onde nos conheceu.";

    const cpfRegex = /^([0-9]{3}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9]{2})$/;
    const numbersOnlyCpf = /^[0-9]{11}$/;
    if (
      !clientForm.cpf ||
      (!cpfRegex.test(clientForm.cpf) && !numbersOnlyCpf.test(clientForm.cpf))
    ) {
      errors.cpf = "O CPF deve estar no formato 000.000.000-00 ou 00000000000.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clientForm.email || !emailRegex.test(clientForm.email)) {
      errors.email = "Insira um e-mail válido.";
    }

    const phoneRegex = /^(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/;
    if (!clientForm.phone || !phoneRegex.test(clientForm.phone)) {
      errors.phone = "Insira um telefone válido com DDD.";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    if (!clientForm.lgpdAccepted)
      return alert("Você precisa aceitar os termos da LGPD.");

    setIsSubmittingBooking(true);
    try {
      const clientRef = await addDoc(
        collection(db, `profiles/${therapistId}/clients`),
        {
          name: clientForm.name,
          dob: clientForm.dob,
          cpf: clientForm.cpf,
          email: clientForm.email,
          phone: clientForm.phone,
          source: clientForm.referralSource,
          lgpdAccepted: clientForm.lgpdAccepted,
          createdAt: serverTimestamp(),
        },
      );

      setCreatedClientId(clientRef.id);
      setRegistrationStep(2);
    } catch (e: any) {
      if (e.message?.includes("missing or insufficient permissions")) {
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `profiles/${therapistId}/clients`,
        );
      } else {
        alert("Erro ao cadastrar: " + e.message);
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleManualScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.appointmentDate || !clientForm.appointmentTime) {
      setFormErrors({
        ...formErrors,
        appointmentDate: !clientForm.appointmentDate ? "Obrigatório" : "",
        appointmentTime: !clientForm.appointmentTime ? "Obrigatório" : "",
      });
      return;
    }

    onBook({
      clientId: createdClientId,
      clientName: clientForm.name,
      therapistId: therapistId,
      sessionTitle: selectedService?.title || "Sessão",
      sessionPrice: selectedService?.price || 0,
      appointmentDate: clientForm.appointmentDate,
      appointmentTime: clientForm.appointmentTime,
      therapistWhatsapp: finalProfile.whatsapp,
    });
    setShowScheduleModal(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.authorName.trim() || !reviewForm.content.trim())
      return alert("Por favor, preencha todos os campos.");
    try {
      await addDoc(collection(db, `profiles/${therapistId}/reviews`), {
        authorName: reviewForm.authorName,
        content: reviewForm.content,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      try {
        await addDoc(
          collection(db, `profiles/${therapistId}/system_notifications`),
          {
            title: "Nova Avaliação Recebida",
            message: `${reviewForm.authorName} enviou uma avaliação. O status está como pendente para sua aprovação.`,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        );
      } catch (e) {}

      setShowReviewModal(false);
      setReviewForm({ authorName: "", content: "" });
      alert(
        "Avaliação enviada com sucesso! Ela será exibida no perfil após a aprovação do profissional.",
      );
    } catch (e: any) {
      if (e.message?.includes("missing or insufficient permissions")) {
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `profiles/${therapistId}/reviews`,
        );
      } else {
        alert("Ocorreu um erro ao enviar a avaliação: " + e.message);
      }
    }
  };

  const renderSocialButtons = () => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {finalProfile.instagramUrl && (
        <a
          href={finalProfile.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 hover:bg-pink-50 text-pink-600 transition-colors border border-slate-100 shadow-sm"
          title="Instagram"
        >
          <Instagram className="w-5 h-5" />
        </a>
      )}
      {finalProfile.facebookUrl && (
        <a
          href={finalProfile.facebookUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 hover:bg-amber-50 text-amber-500 transition-colors border border-slate-100 shadow-sm"
          title="Facebook"
        >
          <Facebook className="w-5 h-5" />
        </a>
      )}
      {finalProfile.linkedinUrl && (
        <a
          href={finalProfile.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 hover:bg-sky-50 text-sky-600 transition-colors border border-slate-100 shadow-sm"
          title="LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {finalProfile.youtubeUrl && (
        <a
          href={finalProfile.youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-50 hover:bg-red-50 text-red-600 transition-colors border border-slate-100 shadow-sm"
          title="YouTube"
        >
          <Youtube className="w-5 h-5" />
        </a>
      )}
    </div>
  );

  if (finalProfile.isPublicSiteActive === false && !isLoggedIn) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8" style={customStyle}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
          <div className="h-48 w-full bg-slate-200 relative overflow-hidden">
            <img
              src={finalProfile.coverPhoto}
              alt="Cover"
              className="absolute -inset-2 w-[calc(100%+1rem)] h-[calc(100%+1rem)] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            {finalProfile.logoUrl && (
              <img
                src={finalProfile.logoUrl}
                alt="Logo"
                className="absolute bottom-4 right-4 z-10 max-w-[120px] max-h-[80px] object-contain drop-shadow-md"
              />
            )}
          </div>
          <div className="px-6 sm:px-10 pb-10 relative">
            <div className="flex flex-col sm:flex-row gap-6 relative -top-16 mb-[-3rem]">
              <img
                src={finalProfile.profilePhoto}
                alt={finalProfile.name}
                className="w-32 h-32 rounded-2xl object-cover shadow-xl border-4 border-white bg-white"
              />
              <div className="pt-16 sm:pt-20 flex-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {finalProfile.name}
                </h1>
                <p className="text-lg text-theme-primary font-medium mt-1">
                  {finalProfile.title}
                </p>
                {finalProfile.crp && (
                  <p className="text-slate-500 mt-1">CRP: {finalProfile.crp}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">
            Agenda Temporariamente Indisponível
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-8 px-4">
            No momento, o agendamento online através desta plataforma
            encontra-se desativado. Por favor, entre em contato diretamente via
            nossos canais de atendimento.
          </p>
        </div>
      </div>
    );
  }

  const getServiceIcon = (category: string, title: string = "") => {
    const t = title.toLowerCase();

    if (category === "empresa") {
      if (t.includes("palestra") || t.includes("workshop"))
        return <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
      if (
        t.includes("time") ||
        t.includes("equipe") ||
        t.includes("grupo") ||
        t.includes("lider")
      )
        return <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
      return <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
    }
    if (category === "igrejas") {
      if (t.includes("palestra") || t.includes("pregação"))
        return (
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
        );
      if (t.includes("casal") || t.includes("casais") || t.includes("noivos"))
        return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
      return <Church className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
    }
    if (category === "psicologos" || category === "psicologo") {
      if (t.includes("supervisão") || t.includes("supervisao"))
        return <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
      if (
        t.includes("curso") ||
        t.includes("aula") ||
        t.includes("grupo") ||
        t.includes("mentoria")
      )
        return <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
      return (
        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
      );
    }

    // Default 'voce'
    if (t.includes("casal") || t.includes("casais"))
      return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes("família") || t.includes("familia"))
      return <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (
      t.includes("ansiedade") ||
      t.includes("depressão") ||
      t.includes("avali") ||
      t.includes("teste")
    )
      return <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes("adolescen"))
      return <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes("infantil") || t.includes("criança"))
      return <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (
      t.includes("orientação") ||
      t.includes("vocacional") ||
      t.includes("carreira")
    )
      return <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes("psicologia") || t.includes("terapia"))
      return <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    return <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8" style={customStyle}>
      {finalProfile.isPublicSiteActive === false && isLoggedIn && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center justify-center">
          O seu site está atualmente DESATIVADO para o público. Esta é apenas
          uma pré-visualização.
        </div>
      )}
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="relative w-full h-48 md:h-64 overflow-hidden bg-[rgb(var(--theme-primary)_/_0.2)]">
          <div
            className="absolute -inset-2 bg-cover bg-center"
            style={{ backgroundImage: `url(${finalProfile.coverPhoto})` }}
          />
          {finalProfile.logoUrl && (
            <img
              src={finalProfile.logoUrl}
              alt="Logo"
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 max-w-[120px] sm:max-w-[160px] max-h-[80px] sm:max-h-[100px] object-contain drop-shadow-md"
            />
          )}
        </div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-16 md:-top-24 left-6 border-4 border-white rounded-full bg-white shadow-sm overflow-hidden">
            <img
              src={finalProfile.profilePhoto}
              alt={finalProfile.name}
              className="w-32 h-32 md:w-48 md:h-48 object-cover"
            />
          </div>

          <div className="pt-20 md:pt-28">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {finalProfile.name}
                </h1>
                <p className="text-slate-600 font-medium text-base sm:text-lg">
                  {finalProfile.title}
                </p>
              </div>
            </div>
            {finalProfile.bio && (
              <p className="text-slate-700 italic mb-3">"{finalProfile.bio}"</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
              {finalProfile.crp && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <Award className="w-4 h-4 text-[rgb(var(--theme-primary))]" />
                  CRP: {finalProfile.crp}
                </span>
              )}
              {finalProfile.city && (
                <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {finalProfile.city}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-justify text-slate-700 leading-relaxed max-w-3xl mb-6">
              {finalProfile.about}
            </p>

            <div className="flex flex-wrap gap-2 mb-2">
              {finalProfile.specialties?.length > 0 &&
                finalProfile.specialties.map((spec: string, idx: number) => (
                  <span
                    key={`spec-${idx}`}
                    className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  >
                    {spec}
                  </span>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {finalProfile.approaches?.length > 0 &&
                finalProfile.approaches.map((appr: string, idx: number) => (
                  <span
                    key={`appr-${idx}`}
                    className="bg-[rgb(var(--theme-primary)_/_0.05)] border border-[rgb(var(--theme-primary)_/_0.2)] text-[rgb(var(--theme-primary))] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                  >
                    {appr}
                  </span>
                ))}
            </div>

            {finalProfile.companyName && (
              <div className="flex items-center gap-4 p-4 mb-2 bg-slate-50 border border-slate-100 rounded-xl max-w-sm">
                {(finalProfile.companyLogo || finalProfile.profilePhoto) && (
                  <img
                    src={finalProfile.companyLogo || finalProfile.profilePhoto}
                    alt={finalProfile.companyName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Proprietário(a) da
                  </p>
                  <p className="text-slate-600 font-medium">
                    {finalProfile.companyName}
                  </p>
                  {finalProfile.cnpj && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      CNPJ: {finalProfile.cnpj}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 px-2">
        <span>Deslize</span>
        <ArrowLeftRight className="w-3 h-3 animate-pulse" />
      </div>
      <div className="relative flex overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-slate-200 mb-8 w-full">
        {hasVoce && (
          <button
            onClick={() => setActiveTab("voce")}
            className={cn(
              "px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2",
              activeTab === "voce"
                ? "border-[rgb(var(--theme-primary))] text-[rgb(var(--theme-primary))]"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Calendar className="w-4 h-4" /> Para Você
            </div>
          </button>
        )}
        {hasEmpresa && (
          <button
            onClick={() => setActiveTab("empresa")}
            className={cn(
              "px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2",
              activeTab === "empresa"
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Building className="w-4 h-4" /> Para sua Empresa
            </div>
          </button>
        )}
        {hasPsicologos && (
          <button
            onClick={() => setActiveTab("psicologos")}
            className={cn(
              "px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2",
              activeTab === "psicologos"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GraduationCap className="w-4 h-4" /> Para Psicólogos
            </div>
          </button>
        )}
        {(isLoggedIn || showIgrejasTab) && (
          <button
            onClick={() => setActiveTab("igrejas")}
            className={cn(
              "px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2",
              activeTab === "igrejas"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Church className="w-4 h-4" /> Para Igrejas
            </div>
          </button>
        )}
        {isLoggedIn && (
          <button
            onClick={() => setActiveTab("materiais")}
            className={cn(
              "px-4 py-3 sm:px-6 sm:py-4 text-sm sm:text-base font-medium flex-shrink-0 transition-colors border-b-2",
              activeTab === "materiais"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FileText className="w-4 h-4" /> Materiais
            </div>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
        {activeTab === "voce" && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            {/* Dynamic Services List for 'voce' */}
            {finalProfile.services?.filter((s: any) => s.category === "voce")
              .length > 0 ? (
              <div className="space-y-4 mb-8">
                {finalProfile.services
                  .filter((s: any) => s.category === "voce")
                  .map((svc: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {" "}
                        <div className="p-2 sm:p-2.5 bg-amber-50 rounded-xl flex-shrink-0">
                          {" "}
                          {getServiceIcon(svc.category, svc.title)}{" "}
                        </div>{" "}
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">
                          {svc.title}
                        </h3>{" "}
                      </div>
                      <p className="text-sm sm:text-base text-slate-600 mb-5 sm:mb-6 text-justify">
                        {svc.description}
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                        {svc.allowScheduling === false ? (
                          <a
                            href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, gostaria de agendar: " + svc.title)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:flex-1 bg-[rgb(var(--theme-primary))] text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
                          >
                            Agendar pelo Whatsapp
                          </a>
                        ) : (
                          <>
                            <button
                              onClick={() => openScheduleModal(svc)}
                              className="w-full sm:flex-1 bg-[rgb(var(--theme-primary))] text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:opacity-90 transition-opacity text-center"
                            >
                              Agendar
                            </button>
                            {finalProfile.inPersonEnabled && (
                              <button
                                onClick={() => openScheduleModal(svc, true)}
                                className="w-full sm:flex-1 bg-white border border-[rgb(var(--theme-primary)_/_0.2)] text-[rgb(var(--theme-primary))] px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-[rgb(var(--theme-primary)_/_0.05)] transition-colors text-center flex items-center justify-center gap-2"
                              >
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                Presencial
                              </button>
                            )}
                          </>
                        )}
                        <button
                           onClick={() => { window.location.href = `/?t=${therapistId || finalProfile.id}&service=${svc.id}`; }}
                           className="w-full sm:flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-slate-100 transition-colors text-center flex items-center justify-center gap-2"
                        >
                           Saiba mais
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">
                  Terapia Individual
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-2xl">
                  Agende uma sessão e dê o primeiro passo para o seu bem-estar
                  emocional. As sessões duram 50 minutos e ocorrem de forma
                  online.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  {finalProfile.services?.[0]?.allowScheduling === false ? (
                    <a
                      href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, gostaria de conversar sobre a Terapia Individual")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[rgb(var(--theme-primary))] text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-center"
                    >
                      Agendar pelo Whatsapp
                    </a>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          openScheduleModal({
                            title: "Terapia Individual",
                            price: finalProfile.services?.[0]?.price || 0,
                            allowScheduling:
                              finalProfile.services?.[0]?.allowScheduling,
                          })
                        }
                        className="w-full sm:flex-1 bg-[rgb(var(--theme-primary))] text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base shadow-sm hover:opacity-90 transition-opacity"
                      >
                        Agendar
                      </button>
                      {finalProfile.inPersonEnabled && (
                        <button
                          onClick={() =>
                            openScheduleModal(
                              {
                                title: "Terapia Individual",
                                price: finalProfile.services?.[0]?.price || 0,
                                allowScheduling:
                                  finalProfile.services?.[0]?.allowScheduling,
                              },
                              true,
                            )
                          }
                          className="w-full sm:flex-1 bg-white border border-[rgb(var(--theme-primary)_/_0.2)] text-[rgb(var(--theme-primary))] px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base shadow-sm hover:bg-[rgb(var(--theme-primary)_/_0.05)] transition-colors text-center flex items-center justify-center gap-2"
                        >
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                          Presencial
                        </button>
                      )}
                    </>
                  )}
                  <button
                     onClick={() => { window.location.href = `/?t=${therapistId || finalProfile.id}&service=${finalProfile.services?.[0]?.id || ''}`; }}
                     className="w-full sm:flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-medium sm:font-semibold text-sm sm:text-base shadow-sm hover:bg-slate-100 transition-colors flex items-center justify-center text-center gap-2"
                  >
                     Saiba mais
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "empresa" && (
          <div className="animate-in fade-in">
            {finalProfile.services?.filter((s: any) => s.category === "empresa").length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">
                  Serviços Corporativos
                </h2>
                {finalProfile.services
                  .filter((s: any) => s.category === "empresa")
                  .map((svc: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-emerald-100 rounded-xl p-5 sm:p-6 bg-emerald-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 sm:p-2.5 bg-emerald-100/50 rounded-xl flex-shrink-0">
                          {getServiceIcon(svc.category, svc.title)}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-emerald-900">
                          {svc.title}
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-emerald-800 mb-5 sm:mb-6 text-justify">
                        {svc.description}
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                        <a
                          href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent(`Olá, gostaria de solicitar um orçamento para serviços para empresa (${svc.title}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:flex-1 bg-emerald-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-emerald-700 transition-colors text-center flex items-center justify-center gap-2"
                        >
                          Solicitar Orçamento
                        </a>
                        <button
                           onClick={() => { window.location.href = `/?t=${therapistId || finalProfile.id}&service=${svc.id}`; }}
                           className="w-full sm:flex-1 bg-white border border-emerald-200 text-emerald-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-emerald-50 transition-colors text-center flex items-center justify-center gap-2"
                        >
                           Saiba mais
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-slate-800">
                  Palestras e Consultoria
                </h2>
                <p className="text-slate-600 mb-6 max-w-2xl">
                  Levando saúde mental para o ambiente corporativo. Programas
                  customizados de bem-estar, workshops e parcerias in-company.
                </p>
                <div className="p-6 border border-emerald-100 bg-emerald-50 rounded-xl text-center">
                  <p className="text-emerald-800 font-medium mb-4">
                    Tem interesse em levar meu trabalho para sua equipe?
                  </p>
                  <a
                    href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent(`Olá, gostaria de solicitar um orçamento para serviços para empresa.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center sm:w-auto inline-block bg-emerald-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Solicitar Orçamento
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "igrejas" && (
          <div className="animate-in fade-in">
            {finalProfile.services?.filter((s: any) => s.category === "igrejas").length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">
                  Serviços para Igrejas
                </h2>
                {finalProfile.services
                  .filter((s: any) => s.category === "igrejas")
                  .map((svc: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-blue-100 rounded-xl p-5 sm:p-6 bg-blue-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 sm:p-2.5 bg-blue-100/50 rounded-xl flex-shrink-0">
                          {getServiceIcon(svc.category, svc.title)}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-blue-900">
                          {svc.title}
                        </h3>
                      </div>
                      <p className="text-sm sm:text-base text-blue-800 mb-5 sm:mb-6 text-justify">
                        {svc.description}
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                        <a
                          href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent(`Olá, gostaria de solicitar um orçamento para atividades na igreja (${svc.title}).`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:flex-1 bg-blue-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-blue-700 transition-colors text-center flex items-center justify-center gap-2"
                        >
                          Solicitar Orçamento
                        </a>
                        <button
                           onClick={() => { window.location.href = `/?t=${therapistId || finalProfile.id}&service=${svc.id}`; }}
                           className="w-full sm:flex-1 bg-white border border-blue-200 text-blue-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-blue-50 transition-colors text-center flex items-center justify-center gap-2"
                        >
                           Saiba mais
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-slate-800">
                  Para Igrejas
                </h2>
                <p className="text-slate-600 mb-6 max-w-2xl">
                  Apoio psicológico e palestras voltadas para a comunidade
                  religiosa, respeitando os princípios da fé e promovendo saúde
                  e bem-estar emocional.
                </p>
                <div className="p-6 border border-blue-100 bg-blue-50 rounded-xl text-center">
                  <p className="text-blue-800 font-medium mb-4">
                    Entre em contato para saber mais sobre palestras e
                    atendimento focado neste segmento.
                  </p>
                  <a
                    href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, gostaria de saber mais sobre os serviços voltados para igrejas.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center sm:w-auto inline-block bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition-colors"
                  >
                    Solicitar mais informações
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "psicologos" && (
          <div className="animate-in fade-in">
            {finalProfile.services?.filter(
              (s: any) =>
                s.category === "psicologos" || s.category === "psicologo",
            ).length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">
                  Cursos e Supervisão
                </h2>
                {finalProfile.services
                  .filter(
                    (s: any) =>
                      s.category === "psicologos" || s.category === "psicologo",
                  )
                  .map((svc: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-purple-100 rounded-xl p-5 sm:p-6 bg-purple-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {" "}
                        <div className="p-2 sm:p-2.5 bg-purple-100/50 rounded-xl flex-shrink-0">
                          {" "}
                          {getServiceIcon(svc.category, svc.title)}{" "}
                        </div>{" "}
                        <h3 className="text-base sm:text-lg font-bold text-purple-900">
                          {svc.title}
                        </h3>{" "}
                      </div>
                      <p className="text-sm sm:text-base text-purple-800 mb-5 sm:mb-6 text-justify">
                        {svc.description}
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4">
                        {svc.allowScheduling === false ? (
                          <a
                            href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, gostaria de agendar: " + svc.title)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:flex-1 bg-purple-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
                          >
                            Agendar pelo Whatsapp
                          </a>
                        ) : (
                          <>
                            <button
                              onClick={() => openScheduleModal(svc)}
                              className="w-full sm:flex-1 bg-purple-600 text-white px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:opacity-90 transition-opacity text-center"
                            >
                              Agendar
                            </button>
                            {finalProfile.inPersonEnabled && (
                              <button
                                onClick={() => openScheduleModal(svc, true)}
                                className="w-full sm:flex-1 bg-white border border-purple-200 text-purple-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-purple-50 transition-colors text-center flex items-center justify-center gap-2"
                              >
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                Presencial
                              </button>
                            )}
                          </>
                        )}
                        <button
                           onClick={() => { window.location.href = `/?t=${therapistId || finalProfile.id}&service=${svc.id}`; }}
                           className="w-full sm:flex-1 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium sm:font-semibold shadow-sm hover:bg-slate-100 transition-colors text-center flex items-center justify-center gap-2"
                        >
                           Saiba mais
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-slate-800">
                  Supervisão Clínica
                </h2>
                <p className="text-slate-600 mb-6 max-w-2xl">
                  Orientação técnica e discussão de casos para recém-formados e
                  profissionais que buscam aprimoramento em Terapia
                  Cognitivo-Comportamental.
                </p>
                <div className="p-6 border border-purple-100 bg-purple-50 rounded-xl text-center">
                  <p className="text-purple-800 font-medium mb-4">
                    Vagas limitadas para grupos de estudo e supervisão
                    individual.
                  </p>
                  <a
                    href={`https://wa.me/${formatWa(finalProfile.whatsapp)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center sm:w-auto inline-block bg-purple-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium hover:bg-purple-700 transition-colors"
                  >
                    Falar sobre Supervisão
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "materiais" && isLoggedIn && (
          <div className="animate-in fade-in">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">
              Materiais Exclusivos
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-2xl">
              Links para conteúdos, exercícios e documentos disponibilizados via
              Google Drive.
            </p>
            {!finalProfile.materials || finalProfile.materials.length === 0 ? (
              <div className="p-6 border border-slate-100 bg-slate-50 rounded-xl text-center">
                <p className="text-slate-500">
                  Nenhum material disponibilizado no momento.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {finalProfile.materials.map((mat: any, idx: number) => {
                  const url = typeof mat === "string" ? mat : mat.url || "";
                  const desc =
                    typeof mat === "string"
                      ? `Material ${idx + 1}`
                      : mat.description || `Material ${idx + 1}`;
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-[rgb(var(--theme-primary)_/_0.3)] hover:bg-[rgb(var(--theme-primary)_/_0.05)] transition-colors group"
                    >
                      <span className="flex items-center gap-3 text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                        <FileText className="w-5 h-5 text-[rgb(var(--theme-primary))] flex-shrink-0" />
                        <span className="truncate">{desc}</span>
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[rgb(var(--theme-primary))] flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {finalProfile.inPersonEnabled && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8 mb-8">
          <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2 text-base sm:text-lg">
            <MapPin className="w-5 h-5 text-[rgb(var(--theme-primary))]" />
            Atendimento Presencial
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Para atendimento presencial, verifique a viabilidade de acesso
          </p>

          <div className="w-full mb-4 overflow-hidden rounded-xl border border-slate-200">
            {finalProfile.googleMapsEmbed ? (
              <div
                className="w-full h-[300px]"
                dangerouslySetInnerHTML={{
                  __html: finalProfile.googleMapsEmbed
                    .replace(/width="[^"]*"/, 'width="100%"')
                    .replace(/height="[^"]*"/, 'height="100%"'),
                }}
              />
            ) : (
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(finalProfile.address || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            )}
          </div>

          {finalProfile.howToGetThere && (
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              <span className="font-medium text-slate-700 block mb-1">
                Como chegar:
              </span>
              {finalProfile.howToGetThere}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2">
            {finalProfile.googleReviewsUrl && (
              <a
                href={finalProfile.googleReviewsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[rgb(var(--theme-primary))] font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                <Star className="w-4 h-4 fill-current" />
                Veja minhas avaliações no Google
              </a>
            )}
          </div>
        </div>
      )}

      {/* Social Links Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mt-8 mb-8 flex flex-col items-center">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-6 text-center">
          Acompanhe minhas redes sociais
        </h3>
        {renderSocialButtons()}
      </div>

      {/* Reviews Section */}
      {!finalProfile.hideReviewsOnSite && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-8 mb-8">
          {finalProfile.useGoogleReviewsWidget &&
          finalProfile.googleReviewsWidgetCode ? (
            <div className="w-full">
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />{" "}
                Avaliações
              </h3>
              <WidgetRenderer htmlCode={finalProfile.googleReviewsWidgetCode} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />{" "}
                  Depoimentos
                </h3>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="text-sm font-medium text-[rgb(var(--theme-primary))] bg-[rgb(var(--theme-primary)_/_0.05)] px-4 py-2 rounded-lg hover:bg-[rgb(var(--theme-primary)_/_0.1)] transition"
                >
                  Deixar Avaliação
                </button>
              </div>
              {reviews.length > 0 ? (
                <>
                  <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 mt-2 px-2">
                    <span>Deslize</span>
                    <ArrowLeftRight className="w-3 h-3 animate-pulse" />
                  </div>
                  <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-slate-50 p-6 rounded-xl border border-slate-100 min-w-[300px] sm:min-w-[350px] shrink-0 snap-start flex flex-col justify-between"
                      >
                        <p className="text-slate-700 italic mb-4 leading-relaxed">
                          "{rev.content}"
                        </p>
                        <div className="flex items-center gap-2 mt-auto">
                          <div className="w-8 h-8 rounded-full bg-[rgb(var(--theme-primary)_/_0.15)] flex items-center justify-center">
                            <span className="text-[rgb(var(--theme-primary)_/_0.8)] font-bold text-sm">
                              {rev.authorName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {rev.authorName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm py-4">
                  Nenhum depoimento ainda. Seja o primeiro a avaliar!
                </p>
              )}
            </>
          )}
        </div>
      )}

      <footer className="w-full bg-white rounded-2xl border border-slate-100 p-8 sm:p-10 text-slate-600 shadow-sm mt-8 mb-8 overflow-hidden">
        <div className="relative z-10">
          {/* Linha 1: Logo e Nome */}
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-2 rounded-xl shadow-sm">
              <span className="font-black text-white text-sm tracking-wider leading-none flex items-center justify-center w-6 h-6">
                ELO
              </span>
            </div>
            <span className="font-bold text-lg sm:text-2xl tracking-tight text-slate-600">
              Soluções Humanas
            </span>
          </div>

          {/* Linha 2: Descrição e Redes Sociais */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <p className="text-sm leading-relaxed text-slate-500 max-w-3xl">
              Conectando pessoas e organizações através da psicologia aplicada e
              tecnologia para o desenvolvimento humano.
            </p>
          </div>

          {/* Linha 3: Áreas em 3 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 border-t border-slate-100 pt-10">
            {/* Coluna 1: Para Você */}
            {hasVoce && (
              <div>
                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">
                  Para Você
                </h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {finalProfile.services
                    ?.filter((s: any) => s.category === "voce")
                    .map((svc: any, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setActiveTab("voce");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }}
                          className="hover:text-amber-500 transition text-left"
                        >
                          {svc.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Coluna 2: Para a Empresa */}
            {hasEmpresa && (
              <div>
                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">
                  Para sua Empresa
                </h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {finalProfile.services
                    ?.filter((s: any) => s.category === "empresa")
                    .map((svc: any, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setActiveTab("empresa");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }}
                          className="hover:text-amber-500 transition text-left"
                        >
                          {svc.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Coluna 3: Para Psicólogos */}
            {hasPsicologos && (
              <div>
                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">
                  Para Psicólogos
                </h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {finalProfile.services
                    ?.filter(
                      (s: any) =>
                        s.category === "psicologos" ||
                        s.category === "psicologo",
                    )
                    .map((svc: any, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setActiveTab("psicologos");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }}
                          className="hover:text-amber-500 transition text-left"
                        >
                          {svc.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {/* Coluna 4: Para Igrejas */}
            {(isLoggedIn || showIgrejasTab) && (
              <div>
                <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">
                  Para Igrejas
                </h4>
                <ul className="space-y-3 text-sm text-slate-500">
                  {finalProfile.services
                    ?.filter((s: any) => s.category === "igrejas")
                    .map((svc: any, idx: number) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setActiveTab("igrejas");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }}
                          className="hover:text-amber-500 transition text-left"
                        >
                          {svc.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div className="border-t border-slate-200 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs text-slate-500 space-y-2 text-center md:text-left">
            <p>
              © {new Date().getFullYear()} ELO Soluções Humanas. Todos os
              direitos reservados. CNPJ:{" "}
              {finalProfile.cnpj || "00.000.000/0001-00"}
            </p>
            <p>
              Responsável Técnico: {finalProfile.name}{" "}
              {finalProfile.crp ? `– CRP ${finalProfile.crp}` : ""}
            </p>
            <p className="mt-2 text-slate-500">
              Atenção: Este site segue rigorosamente as normas do{" "}
              <strong>
                Código de Ética do Conselho Federal de Psicologia (CFP)
              </strong>
              . O atendimento psicológico online é regulamentado e reconhecido.
            </p>
            <p className="text-slate-500">
              Em caso de crise suicida, ligue para o{" "}
              <strong>CVV - Centro de Valorização da Vida (188)</strong>, com
              atendimento gratuito e sigiloso 24 horas por dia. Se houver
              emergência, dirija-se ao hospital mais próximo.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center md:text-right w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-end gap-4 mb-2 md:mb-0">
              <button className="hover:text-amber-500 transition">
                Privacidade
              </button>
              <button className="hover:text-amber-500 transition">
                Termos
              </button>
            </div>
            <button
              onClick={() => (window.location.href = "/?saas=true")}
              className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 px-3 py-1.5 rounded-lg transition-colors capitalize normal-case text-xs font-semibold border border-amber-100 mx-auto md:mx-0"
            >
              Sou Psicólogo: Conheça a Plataforma{" "}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                  Agendar {selectedService?.title || "Sessão"}
                </h3>
                <p className="text-[rgb(var(--theme-primary))] font-medium text-xs sm:text-sm mt-1">
                  Valor:{" "}
                  {selectedService?.price === 0
                    ? "Entre em contato para saber mais"
                    : `R$ ${selectedService?.price}`}
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto w-full custom-scrollbar max-h-[80vh]">
              {registrationStep === 0 ? (
                <div className="p-6 flex flex-col gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-[rgb(var(--theme-primary))]" />
                      Veja se é fácil chegar ao meu consultório
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                      {finalProfile.address}
                    </p>
                    <div className="w-full mb-4 overflow-hidden rounded-xl border border-slate-200">
                      {finalProfile.googleMapsEmbed ? (
                        <div
                          className="w-full h-[250px]"
                          dangerouslySetInnerHTML={{
                            __html: finalProfile.googleMapsEmbed
                              .replace(/width="[^"]*"/, 'width="100%"')
                              .replace(/height="[^"]*"/, 'height="100%"'),
                          }}
                        />
                      ) : (
                        <iframe
                          width="100%"
                          height="200"
                          frameBorder="0"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(finalProfile.address || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a
                      href={`https://wa.me/${formatWa(finalProfile.whatsapp)}?text=${encodeURIComponent("Olá, tenho fácil acesso ao seu consultório e gostaria de agendar uma sessão presencialmente.")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[rgb(var(--theme-primary))] text-white font-semibold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity text-center text-sm"
                      onClick={() => setShowScheduleModal(false)}
                    >
                      Quero agendar presencial
                    </a>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(1)}
                      className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors text-center text-sm border border-slate-200"
                    >
                      Prefiro agendar on line
                    </button>
                  </div>
                </div>
              ) : registrationStep === 1 ? (
                <form
                  onSubmit={handleRegistrationSubmit}
                  className="p-6 flex flex-col gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      required
                      type="text"
                      className={cn(
                        "w-full p-2 border rounded-lg focus:ring-2 focus:ring-[rgb(var(--theme-primary))] focus:outline-none",
                        formErrors.name ? "border-red-500" : "border-slate-300",
                      )}
                      value={clientForm.name}
                      onChange={(e) => {
                        setClientForm({ ...clientForm, name: e.target.value });
                        setFormErrors({ ...formErrors, name: "" });
                      }}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Data de Nasc. *
                      </label>
                      <input
                        required
                        type="date"
                        className={cn(
                          "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none",
                          formErrors.dob
                            ? "border-red-500"
                            : "border-slate-300",
                        )}
                        value={clientForm.dob}
                        onChange={(e) => {
                          setClientForm({ ...clientForm, dob: e.target.value });
                          setFormErrors({ ...formErrors, dob: "" });
                        }}
                      />
                      {formErrors.dob && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.dob}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        CPF *
                      </label>
                      <input
                        required
                        type="text"
                        className={cn(
                          "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none",
                          formErrors.cpf
                            ? "border-red-500"
                            : "border-slate-300",
                        )}
                        value={clientForm.cpf}
                        onChange={(e) => {
                          setClientForm({ ...clientForm, cpf: e.target.value });
                          setFormErrors({ ...formErrors, cpf: "" });
                        }}
                        placeholder="000.000.000-00"
                      />
                      {formErrors.cpf && (
                        <p className="text-red-500 text-xs mt-1">
                          {formErrors.cpf}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      E-mail *
                    </label>
                    <input
                      required
                      type="email"
                      className={cn(
                        "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none",
                        formErrors.email
                          ? "border-red-500"
                          : "border-slate-300",
                      )}
                      value={clientForm.email}
                      onChange={(e) => {
                        setClientForm({ ...clientForm, email: e.target.value });
                        setFormErrors({ ...formErrors, email: "" });
                      }}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      WhatsApp *
                    </label>
                    <input
                      required
                      type="tel"
                      className={cn(
                        "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none",
                        formErrors.phone
                          ? "border-red-500"
                          : "border-slate-300",
                      )}
                      value={clientForm.phone}
                      onChange={(e) => {
                        setClientForm({ ...clientForm, phone: e.target.value });
                        setFormErrors({ ...formErrors, phone: "" });
                      }}
                      placeholder="(11) 90000-0000"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      De onde você nos conheceu? (Fonte de Indicação) *
                    </label>
                    <select
                      required
                      className={cn(
                        "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white",
                        formErrors.referralSource
                          ? "border-red-500"
                          : "border-slate-300",
                      )}
                      value={clientForm.referralSource}
                      onChange={(e) => {
                        setClientForm({
                          ...clientForm,
                          referralSource: e.target.value,
                        });
                        setFormErrors({ ...formErrors, referralSource: "" });
                      }}
                    >
                      <option value="" disabled>
                        Selecione uma opção...
                      </option>
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
                      <option value="Instagram/ Redes Sociais">
                        Instagram/ Redes Sociais
                      </option>
                      <option value="YouTube">YouTube</option>
                      <option value="Outros">Outros</option>
                    </select>
                    {formErrors.referralSource && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.referralSource}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-3 mt-2">
                    <input
                      required
                      type="checkbox"
                      id="lgpd"
                      className="mt-1"
                      checked={clientForm.lgpdAccepted}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          lgpdAccepted: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="lgpd" className="text-sm text-slate-600">
                      Li e concordo com a Política de Privacidade e aceito o
                      fornecimento dos meus dados de acordo com a LGPD.
                    </label>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="w-full bg-[rgb(var(--theme-primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSubmittingBooking
                        ? "Aguarde..."
                        : "Prosseguir para Horários"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 p-6">
                  {finalProfile.calendarEmbed ? (
                    <div className="w-full h-full min-h-[400px] flex flex-col">
                      <div
                        className="w-full flex-1"
                        dangerouslySetInnerHTML={{
                          __html: finalProfile.calendarEmbed,
                        }}
                      />
                      <button
                        onClick={() => {
                          onBook({
                            clientId: createdClientId,
                            clientName: clientForm.name,
                            therapistId: therapistId,
                            sessionTitle: selectedService?.title || "Sessão",
                            sessionPrice: selectedService?.price || 0,
                            therapistWhatsapp: finalProfile.whatsapp,
                          });
                          setShowScheduleModal(false);
                        }}
                        className="mt-4 bg-[rgb(var(--theme-primary))] text-white font-semibold py-3 rounded-xl w-full"
                      >
                        Já escolhi meu horário, concluir agendamento
                      </button>
                    </div>
                  ) : finalProfile.calendarUrl ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
                      <div className="w-20 h-20 bg-[rgb(var(--theme-primary)_/_0.1)] rounded-full flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-[rgb(var(--theme-primary))]" />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                          Agendamento Externo
                        </h4>
                        <p className="text-sm sm:text-base text-slate-600 max-w-sm mx-auto leading-relaxed">
                          O agendamento para as sessões de {finalProfile.name} é
                          feito diretamente de forma segura usando o Google
                          Calendar.
                        </p>
                      </div>
                      <a
                        href={finalProfile.calendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-[rgb(var(--theme-primary))] text-white font-semibold w-full sm:w-auto px-8 py-4 rounded-xl hover:opacity-90 transition-opacity mt-4 shadow-sm"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Acessar Agenda</span>
                        <ExternalLink className="w-5 h-5 opacity-70 ml-2" />
                      </a>

                      <div className="mt-8 pt-6 border-t w-full border-slate-100">
                        <p className="text-sm text-slate-500 mb-3">
                          Após escolher seu horário no link acima, conclua aqui:
                        </p>
                        <button
                          onClick={() => {
                            onBook({
                              clientId: createdClientId,
                              clientName: clientForm.name,
                              therapistId: therapistId,
                              sessionTitle: selectedService?.title || "Sessão",
                              sessionPrice: selectedService?.price || 0,
                              therapistWhatsapp: finalProfile.whatsapp,
                            });
                            setShowScheduleModal(false);
                          }}
                          className="bg-slate-100 text-slate-700 font-medium py-3 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                        >
                          Concluir Agendamento
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleManualScheduleSubmit}
                      className="flex flex-col gap-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Data da Sessão *
                          </label>
                          <input
                            required
                            min={new Date().toISOString().split("T")[0]}
                            type="date"
                            className={cn(
                              "w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none",
                              formErrors.appointmentDate
                                ? "border-red-500"
                                : "border-slate-300",
                            )}
                            value={clientForm.appointmentDate}
                            onChange={(e) => {
                              setClientForm({
                                ...clientForm,
                                appointmentDate: e.target.value,
                                appointmentTime: "",
                              });
                              setFormErrors({
                                ...formErrors,
                                appointmentDate: "",
                                appointmentTime: "",
                              });
                            }}
                          />
                          {formErrors.appointmentDate && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors.appointmentDate}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2 mt-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Horários Disponíveis *
                          </label>
                          {clientForm.appointmentDate ? (
                            (() => {
                              const dayOfW = new Date(
                                clientForm.appointmentDate + "T12:00:00Z",
                              ).getDay();
                              const slots =
                                finalProfile.schedule?.[dayOfW] || [];
                              if (slots.length === 0) {
                                return (
                                  <p className="text-sm text-slate-500">
                                    Nenhum horário cadastrado para este dia da
                                    semana.
                                  </p>
                                );
                              }
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((t: string, idx: number) => (
                                    <button
                                      type="button"
                                      key={`${t}-${idx}`}
                                      onClick={() => {
                                        setClientForm({
                                          ...clientForm,
                                          appointmentTime: t,
                                        });
                                        setFormErrors({
                                          ...formErrors,
                                          appointmentTime: "",
                                        });
                                      }}
                                      className={cn(
                                        "px-4 py-2 border rounded-lg text-sm font-medium transition",
                                        clientForm.appointmentTime === t
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-white text-slate-600 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50",
                                      )}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              );
                            })()
                          ) : (
                            <p className="text-sm text-slate-400">
                              Selecione uma data para ver os horários.
                            </p>
                          )}
                          {formErrors.appointmentTime && (
                            <p className="text-red-500 text-xs mt-2">
                              {formErrors.appointmentTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          type="submit"
                          className="w-full bg-[rgb(var(--theme-primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                        >
                          Continuar para Pagamento
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                Deixar Avaliação
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleReviewSubmit}
              className="p-6 flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  required
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  value={reviewForm.authorName}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, authorName: e.target.value })
                  }
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Avaliação *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  value={reviewForm.content}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, content: e.target.value })
                  }
                  placeholder="Como foi sua experiência?"
                />
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="w-full bg-[rgb(var(--theme-primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Enviar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
