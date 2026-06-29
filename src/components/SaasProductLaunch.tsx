import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  LineChart,
  MessageSquare,
  PieChart,
  Shield,
  Smartphone,
  Zap,
  Mic,
  Info,
  X
} from "lucide-react";

export function SaasProductLaunch({
  onLogin,
  user,
}: {
  onLogin: () => void;
  user: any;
}) {
  const [isTranscriptionModalOpen, setIsTranscriptionModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDashboardRedirect = () => {
    if (window.history.pushState) window.history.pushState({}, "", "/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-200">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-yellow-400 to-amber-400 p-2 rounded-xl shadow-sm">
                <span className="font-black text-white text-xs tracking-wider leading-none">
                  ELO
                </span>
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-700">
                Plataforma
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={handleDashboardRedirect}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" /> Ir para o Painel
                </button>
              ) : (
                <button
                  onClick={onLogin}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
                >
                  Já tenho conta
                </button>
              )}
              <button
                onClick={() =>
                  window.open(
                    "https://wa.me/5511999999999?text=Ol%C3%A1%2C+quero+saber+mais+sobre+a+plataforma+ELO+para+psic%C3%B3logos.",
                    "_blank",
                  )
                }
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-slate-900/10 hover:shadow-lg flex items-center gap-2"
              >
                Falar com Especialista
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-white"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/50 text-amber-700 text-xs sm:text-sm font-medium mb-8 border border-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Novo ecossistema integrado para psicólogos
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.1]">
            A plataforma definitiva para transformar a gestão da sua{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
              clínica de psicologia.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Simplifique seus agendamentos, atraia mais pacientes com um perfil
            profissional e tenha controle financeiro total, tudo em um único
            lugar seguro e em conformidade com o CFP e LGPD.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() =>
                window.open(
                  "https://wa.me/5511999999999?text=Quero+conhecer+mais+sobre+a+plataforma.",
                  "_blank",
                )
              }
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-2xl text-base font-bold transition-all shadow-xl shadow-amber-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Quero transformar minha rotina
              <ArrowRight className="w-5 h-5" />
            </button>
            {user ? (
              <button
                onClick={handleDashboardRedirect}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center"
              >
                Acessar meu painel
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center"
              >
                Acessar sistema
              </button>
            )}
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 mb-12">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sem taxa de
              adesão
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Suporte
              humanizado
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancele
              quando quiser
            </div>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-4 hidden md:block">
            <img
              src="/src/assets/images/saas_hero_1780521689703.png"
              alt="Plataforma de Gestão"
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Como funciona / Dor vs Ganho */}
      <div className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Você foca no paciente, nós focamos no resto
              </h2>
              <p className="text-slate-600 text-lg">
                Você passa mais tempo lidando com planilhas, gerando recibos
                manuais e organizando agendamentos no WhatsApp do que focando no
                que realmente importa?
              </p>
            </div>
            <div className="w-full max-w-sm lg:w-1/3 hidden sm:block">
              <img
                src="/src/assets/images/saas_features_1780521723215.png"
                alt="Organização e Crescimento"
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded-2xl shadow-sm border border-slate-100"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-amber-500">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Sua Página Oficial
              </h3>
              <p className="text-slate-600 mb-6 flex-1">
                Uma vitrine profissional na internet (perfeita para o link da
                bio). Centralize seus serviços, receba depoimentos, direcione
                pacientes e mostre seu diferencial com elegância.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Aumente sua autoridade, inspire confiança e converta
                  visitantes em pacientes reais.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-emerald-500">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Documentos & Prontuários
              </h3>
              <p className="text-slate-600 mb-6 flex-1">
                Adeus ao Word. Crie laudos, atestados, recibos com papel
                timbrado digital e registros de evolução (atrelados ao paciente)
                em poucos cliques.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Economize preciosas horas de burocracia semanal e
                  mantenha tudo organizado.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-blue-500">
                <PieChart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Gestão Financeira Visual
              </h3>
              <p className="text-slate-600 mb-6 flex-1">
                Você sabe quanto de fato vai faturar este mês? Tenha um
                dashboard visual, registre entradas, controle custos fixos e
                saiba exatamente quem ainda não pagou a sessão.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Previsibilidade financeira, clareza nos lucros mensais
                  e fim da dor de cabeça na contabilidade.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-purple-500">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Agenda & Onboarding de Pacientes
              </h3>
              <p className="text-slate-600 mb-6 flex-1">
                Integração inteligente. Envie formulários automatizados (LGPD,
                anamnese inicial) e colete termos assinados digitalmente antes
                mesmo da primeira consulta.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Reduza as faltas, facilite a entrada do paciente e
                  esteja 100% amparado legalmente.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-slate-900">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Ética e Segurança no Core
              </h3>
              <p className="text-slate-600 mb-6 flex-1">
                Toda a plataforma foi desenhada pensando no rigor do CRP.
                Informações encriptadas, fluxos focados no sigilo e separação
                clara de dados financeiros e prontuários.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Durma tranquilo sabendo que a reputação da sua clínica
                  e os dados dos pacientes estão seguros.
                </p>
              </div>
            </div>

            {/* Feature 6 - Transcrição e Google Drive */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col h-full hover:shadow-lg transition-shadow duration-300 relative">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-amber-500">
                <Mic className="w-7 h-7" />
              </div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-xl font-bold text-slate-900">
                  Resumo Automático e Drive
                </h3>
                <button
                  onClick={() => setIsTranscriptionModalOpen(true)}
                  className="bg-amber-100 text-amber-700 hover:bg-amber-200 p-1.5 rounded-full transition-colors flex-shrink-0"
                  title="Saiba como funciona"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-600 mb-6 flex-1">
                Conecte-se e foque no paciente. Transcrição e resumo automático dos seus atendimentos por IA com integração direta e segura para o seu Google Drive pessoal.
              </p>
              <div className="pt-4 border-t border-slate-200 mt-auto">
                <p className="text-sm font-semibold text-emerald-600 flex items-start gap-2">
                  <Zap className="w-4 h-4 mt-0.5 shrink-0" />
                  Ganho: Fim do trabalho após o expediente. Não perca mais tempo escrevendo anotações manualmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Bottom */}
      <div className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Eleve o nível do seu atendimento
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Comece hoje a otimizar sua rotina e invista seu tempo no que
            realmente importa: a saúde mental dos seus pacientes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() =>
                window.open(
                  "https://wa.me/5511999999999?text=Gostaria+de+adquirir+a+plataforma+ELO.",
                  "_blank",
                )
              }
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-xl text-lg font-bold transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Falar com um Consultor
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcription Modal */}
      {isTranscriptionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                  <Mic className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setIsTranscriptionModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Como a Automação Economiza Seu Tempo
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Nossa IA atua como seu assistente clínico. Durante a sessão, o áudio é processado em tempo real e transformado em um resumo clínico estruturado, sem gravar a voz para garantir a máxima privacidade.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Foco Total no Paciente</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Esqueça o caderno e a caneta. Olhe nos olhos do seu paciente.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Integração com Google Drive</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Os resumos são salvos diretamente no seu Google Drive, mantendo o controle total dos dados sob a sua conta.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Fim do Trabalho Extra</h4>
                    <p className="text-sm text-slate-500 mt-0.5">Suas anotações estão prontas assim que o paciente sai da sala. Sua noite finalmente será livre.</p>
                  </div>
                </li>
              </ul>
              <button
                onClick={() => setIsTranscriptionModalOpen(false)}
                className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
