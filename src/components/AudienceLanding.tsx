import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, 
  MessageSquare, 
  Building2, 
  Users, 
  Mic, 
  Heart, 
  Church, 
  Eye, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Send,
  Sparkles,
  PhoneCall,
  User,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn, formatWa } from "../lib/utils";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

interface Service {
  id: string;
  category: string;
  title: string;
  description: string;
  price?: number;
  allowScheduling?: boolean;
}

interface ProfileData {
  id: string;
  name: string;
  title: string;
  profilePhoto?: string;
  bio?: string;
  about?: string;
  whatsapp?: string;
  crp?: string;
  inPersonEnabled?: boolean;
  services?: Service[];
}

interface AudienceLandingProps {
  therapistId: string;
  audience: "empresa" | "psicologos" | "igrejas" | "voce";
  profileData: ProfileData;
  onBack: () => void;
}

export function AudienceLanding({ therapistId, audience, profileData, onBack }: AudienceLandingProps) {
  useEffect(() => {
    const logInteraction = async (type: 'page_view' | 'whatsapp_click') => {
      try {
        if (!therapistId || therapistId === "preview") return;
        
        const sessionKey = `elo_interaction_audience_${therapistId}_${type}_${audience}`;
        const now = new Date().getTime();
        const lastLogged = localStorage.getItem(sessionKey);
        
        if (lastLogged && now - parseInt(lastLogged) < 60000) {
          return; 
        }
        
        localStorage.setItem(sessionKey, now.toString());
        
        await addDoc(collection(db, `profiles/${therapistId}/interactions`), {
          type,
          details: { audience },
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to log interaction", e);
      }
    };

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href.includes('wa.me/')) {
        logInteraction('whatsapp_click');
      }
    };

    document.addEventListener("click", handleGlobalClick);
    logInteraction('page_view');
    
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, [therapistId, audience]);

  const finalProfile: ProfileData = {
    id: profileData?.id || "demo-therapist-id",
    name: profileData?.name || "Nome do Profissional",
    title: profileData?.title || "Psicólogo Clínico",
    profilePhoto: profileData?.profilePhoto,
    bio: profileData?.bio,
    about: profileData?.about,
    whatsapp: profileData?.whatsapp,
    crp: profileData?.crp,
    services: profileData?.services || [],
  };

  // Filter services based on selected audience
  const audienceServices = (finalProfile.services || []).filter((s) => {
    if (audience === "empresa") return s.category === "empresa";
    if (audience === "psicologos") return s.category === "psicologos" || s.category === "psicologo";
    if (audience === "igrejas") return s.category === "igrejas";
    if (audience === "voce") return s.category === "voce";
    return false;
  });

  const whatsappNumber = formatWa(finalProfile.whatsapp);

  // Styling and Content based on Audience
  const getAudienceConfig = () => {
    switch (audience) {
      case "empresa":
        return {
          themeColor: "emerald",
          primaryBg: "from-emerald-50 via-emerald-100/30 to-white",
          accentBg: "bg-emerald-50",
          accentText: "text-emerald-700",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          gradientButton: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-200",
          secondaryButton: "border-emerald-200 text-emerald-700 hover:bg-emerald-50/50",
          titleIcon: <Building2 className="w-8 h-8 text-emerald-600" />,
          titleText: "Para Empresas & Organizações",
          heroHeadline: "Potencialize o Capital Humano e Reduza o Burnout na sua Empresa",
          heroSubtitle: "Programas personalizados de saúde mental corporativa, palestras dinâmicas, treinamentos de liderança e gestão de clima emocional para transformar o seu ambiente de trabalho.",
          benefits: [
            { title: "Redução de Absenteísmo", text: "Diminuição de faltas e afastamentos por questões de esgotamento ou estresse." },
            { title: "Aumento de Produtividade", text: "Profissionais saudáveis emocionalmente trabalham com mais foco e motivação." },
            { title: "Fortalecimento do Employer Branding", text: "Sua marca vista como referência em cuidado humano e responsabilidade social." }
          ],
          whatsappPrefill: "Olá! Gostaria de solicitar um orçamento para serviços corporativos na minha empresa.",
          metaTitle: "SOLUÇÕES CORPORATIVAS"
        };
      case "psicologos":
        return {
          themeColor: "purple",
          primaryBg: "from-purple-50 via-purple-100/30 to-white",
          accentBg: "bg-purple-50",
          accentText: "text-purple-700",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          gradientButton: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200",
          secondaryButton: "border-purple-200 text-purple-700 hover:bg-purple-50/50",
          titleIcon: <GraduationCap className="w-8 h-8 text-purple-600" />,
          titleText: "Para Psicólogos & Clínicas",
          heroHeadline: "Acelere sua Carreira Clínica com Quem já Trilhou o Caminho",
          heroSubtitle: "Supervisão clínica especializada, mentoria estratégica de captação ética de pacientes, gestão de consultório e soluções tecnológicas sob medida para o seu sucesso.",
          benefits: [
            { title: "Manejo de Casos Complexos", text: "Ganhe segurança técnica nas intervenções clínicas de alta complexidade." },
            { title: "Posicionamento Estratégico", text: "Aprenda a atrair os pacientes ideais respeitando rigorosamente o código de ética." },
            { title: "Eficiência Tributária & Financeira", text: "Fundo de caixa, carnê-leão e planejamento sem dores de cabeça." }
          ],
          whatsappPrefill: "Olá! Gostaria de conversar sobre supervisão clínica e soluções para psicólogos.",
          metaTitle: "CURSOS E MENTORIAS"
        };
      case "igrejas":
        return {
          themeColor: "blue",
          primaryBg: "from-blue-50 via-blue-100/30 to-white",
          accentBg: "bg-blue-50",
          accentText: "text-blue-700",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          gradientButton: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200",
          secondaryButton: "border-blue-200 text-blue-700 hover:bg-blue-50/50",
          titleIcon: <Church className="w-8 h-8 text-blue-600" />,
          titleText: "Para Igrejas & Comunidades",
          heroHeadline: "Saúde Mental e Fé: Cuidado Integral para sua Comunidade",
          heroSubtitle: "Apoio psicológico institucional, palestras de conscientização de base bíblica, aconselhamento e palestras para casais de forma sensível e acolhedora.",
          benefits: [
            { title: "Acolhimento de Famílias", text: "Apoio estruturado nas crises conjugais, orientação de pais e conflitos de gerações." },
            { title: "Prevenção & Conscientização", text: "Quebrando tabus sobre depressão e ansiedade no contexto da fé." },
            { title: "Capacitação de Líderes", text: "Apoio técnico para pastores e líderes lidarem com demandas emocionais extremas." }
          ],
          whatsappPrefill: "Olá! Gostaria de saber mais sobre as palestras e serviços psicológicos voltados para igrejas.",
          metaTitle: "APOIO INSTITUCIONAL"
        };
      case "voce":
        return {
          themeColor: "amber",
          primaryBg: "from-amber-50 via-amber-100/30 to-white",
          accentBg: "bg-amber-50",
          accentText: "text-amber-700",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          gradientButton: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200",
          secondaryButton: "border-amber-200 text-amber-700 hover:bg-amber-50/50",
          titleIcon: <User className="w-8 h-8 text-amber-600" />,
          titleText: "Para Você",
          heroHeadline: "Cuidado Emocional e Psicoterapia para o seu Autodesenvolvimento",
          heroSubtitle: "Atendimento psicológico individualizado, orientação vocacional e suporte para lidar com ansiedade, depressão e conflitos em um ambiente seguro e acolhedor.",
          benefits: [
            { title: "Autoconhecimento", text: "Compreenda seus padrões de comportamento e desenvolva recursos emocionais." },
            { title: "Saúde Emocional", text: "Aprenda a lidar com ansiedade, estresse e desafios do dia a dia." },
            { title: "Qualidade de Vida", text: "Construa relacionamentos mais saudáveis e alinhe suas decisões com seus valores." }
          ],
          whatsappPrefill: "Olá! Gostaria de saber mais sobre a psicoterapia e agendar uma sessão.",
          metaTitle: "ATENDIMENTO INDIVIDUAL"
        };
    }
  };

  const config = getAudienceConfig();

  const getServiceIcon = (category: string, title: string = "") => {
    const t = title.toLowerCase();
    if (category === "empresa") {
      if (t.includes("palestra") || t.includes("workshop") || t.includes("treinamento"))
        return <Mic className="w-6 h-6 text-emerald-600" />;
      if (t.includes("time") || t.includes("equipe") || t.includes("grupo") || t.includes("lider"))
        return <Users className="w-6 h-6 text-emerald-600" />;
      return <Building2 className="w-6 h-6 text-emerald-600" />;
    }
    if (category === "igrejas") {
      if (t.includes("palestra") || t.includes("pregação") || t.includes("conselho"))
        return <MessageSquare className="w-6 h-6 text-blue-600" />;
      if (t.includes("casal") || t.includes("casais") || t.includes("noivos"))
        return <Heart className="w-6 h-6 text-blue-600" />;
      return <Church className="w-6 h-6 text-blue-600" />;
    }
    if (category === "psicologos" || category === "psicologo") {
      if (t.includes("supervisão") || t.includes("supervisao"))
        return <Eye className="w-6 h-6 text-purple-600" />;
      if (t.includes("curso") || t.includes("aula") || t.includes("grupo") || t.includes("mentoria"))
        return <BookOpen className="w-6 h-6 text-purple-600" />;
      return <GraduationCap className="w-6 h-6 text-purple-600" />;
    }
    return <Sparkles className="w-6 h-6 text-amber-600" />;
  };

  return (
    <div className={cn("min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans")}>
      <Helmet>
        <title>{`${config.titleText} | ${finalProfile.name} - ${finalProfile.title}`}</title>
        <meta name="description" content={config.heroSubtitle} />
      </Helmet>
      
      {/* Header */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full border uppercase tracking-wider", config.badgeColor)}>
              {config.metaTitle}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className={cn("relative py-16 md:py-24 bg-gradient-to-b overflow-hidden", config.primaryBg)}>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex p-3 bg-white rounded-2xl shadow-md mb-6 border border-slate-100"
          >
            {config.titleIcon}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={cn("text-xs font-bold uppercase tracking-widest mb-3", config.accentText)}
          >
            {config.titleText}
          </motion.p>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto mb-6"
          >
            {config.heroHeadline}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed text-justify"
          >
            {config.heroSubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(config.whatsappPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className={cn("w-full sm:w-auto px-8 py-4 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2", config.gradientButton)}
            >
              <PhoneCall className="w-5 h-5" />
              <span>Solicitar Atendimento</span>
            </a>
            
            <a
              href="#servicos"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Serviços</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
        
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full filter blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/30 rounded-full filter blur-3xl -z-10" />
      </section>

      {/* Services List Section (FIRST, as requested) */}
      <section id="servicos" className="py-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Nossas Soluções Contratáveis
          </h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base max-w-xl mx-auto text-justify">
            Serviços desenhados sob medida com rigor técnico, ética e foco em resultados transformadores.
          </p>
        </div>

        {audienceServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {audienceServices.map((svc, index) => {
              const itemPrefill = `Olá! Gostaria de conversar e solicitar um orçamento para o serviço: "${svc.title}".`;
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn("p-3 rounded-xl flex-shrink-0 bg-slate-50", config.accentBg)}>
                        {getServiceIcon(svc.category, svc.title)}
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-tight">
                        {svc.title}
                      </h3>
                    </div>

                    <p className="text-slate-600 text-sm md:text-base mb-6 leading-relaxed text-justify whitespace-pre-line">
                      {svc.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        window.location.href = `/?t=${therapistId || finalProfile.id}&service=${svc.id}&audience=${audience}`;
                      }}
                      className={cn("w-full sm:flex-1 py-3 px-4 border rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5", config.secondaryButton)}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Saiba mais</span>
                    </button>

                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(itemPrefill)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={cn("w-full sm:flex-1 py-3 px-4 text-white text-sm font-bold rounded-xl text-center flex items-center justify-center gap-1.5 shadow-sm hover:brightness-95 transition-all", config.gradientButton)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Contratar / Orçar</span>
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto">
            <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800">Serviços em customização</h3>
            <p className="text-slate-500 text-sm mt-2 text-justify">
              Estamos estruturando propostas altamente personalizadas para este segmento. Entre em contato diretamente no WhatsApp para receber um portfólio customizado.
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(config.whatsappPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className={cn("mt-6 inline-flex px-6 py-3 text-white text-sm font-bold rounded-xl shadow-md", config.gradientButton)}
            >
              Falar com o Profissional
            </a>
          </div>
        )}
      </section>

      {/* Commercial Benefits/Proofs Grid */}
      <section className="bg-slate-100/50 py-16 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className={cn("text-xs font-bold uppercase tracking-wider", config.accentText)}>
              DIFERENCIAIS DA NOSSA ATUAÇÃO
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
              Por que contratar nossas soluções?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {config.benefits.map((benefit, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0", config.accentText)} />
                  <h3 className="font-bold text-slate-900 text-base">
                    {benefit.title}
                  </h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed text-justify">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Professional Section (FURTHER DOWN, as requested) */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {finalProfile.profilePhoto && (
              <div className="flex-shrink-0 w-32 h-32 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-md border-4 border-slate-50 bg-slate-100">
                <img
                  src={finalProfile.profilePhoto}
                  alt={finalProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <span className={cn("inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 bg-slate-100 text-slate-600 rounded-full mb-3")}>
                RESPONSÁVEL TÉCNICO
              </span>
              
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {finalProfile.name}
              </h2>
              
              <p className={cn("text-base font-semibold mt-1", config.accentText)}>
                {finalProfile.title}
              </p>
              
              {finalProfile.crp && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Registro Profissional: {finalProfile.crp}
                </p>
              )}

              {finalProfile.bio && (
                <p className="text-sm italic text-slate-500 mt-4 max-w-2xl text-justify">
                  "{finalProfile.bio}"
                </p>
              )}
            </div>
          </div>

          {finalProfile.about && (
            <div className="text-slate-600 text-sm md:text-base mt-8 leading-relaxed text-justify space-y-4 border-t border-slate-100 pt-8 relative z-10">
              <p className="whitespace-pre-line">{finalProfile.about}</p>
            </div>
          )}
          
          {/* Decorative background element */}
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-50 rounded-tl-full -z-0" />
        </div>
      </section>

      {/* Global conversion footer card */}
      <section className="max-w-4xl mx-auto px-4 mt-8">
        <div className={cn("bg-gradient-to-r text-white p-8 md:p-12 rounded-3xl text-center shadow-lg relative overflow-hidden", 
          audience === "empresa" ? "from-emerald-700 to-teal-800" :
          audience === "psicologos" ? "from-purple-700 to-indigo-800" :
          audience === "voce" ? "from-amber-500 to-orange-600" :
          "from-blue-700 to-indigo-800"
        )}>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
              Vamos construir um projeto juntos?
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8 text-justify">
              Atendimento ágil, diagnósticos precisos e propostas comerciais customizadas com transparência fiscal. Fale conosco agora pelo WhatsApp!
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(config.whatsappPrefill)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-slate-50 transition-all transform hover:-translate-y-0.5"
            >
              <Send className="w-5 h-5" />
              <span>Solicitar Atendimento Imediato</span>
            </a>
          </div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full filter blur-xl" />
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full filter blur-xl" />
        </div>
      </section>
      
    </div>
  );
}
