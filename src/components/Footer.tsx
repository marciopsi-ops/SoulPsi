import React from "react";
import { ArrowRight } from "lucide-react";

export function Footer({
  profileData,
  setActiveTab,
  showIgrejasTab = true,
}: {
  profileData: any;
  setActiveTab?: (tab: string) => void;
  showIgrejasTab?: boolean;
}) {
  if (!profileData) return null;

  const hasVoce = profileData.services?.some((s: any) => !["empresa", "psicologos", "psicologo", "igrejas"].includes(s.category));
  const hasEmpresa = profileData.services?.some((s: any) => s.category === "empresa");
  const hasPsicologos = profileData.services?.some((s: any) => s.category === "psicologos" || s.category === "psicologo");
  const hasIgrejas = profileData.services?.some((s: any) => s.category === "igrejas");

  return (
    <footer className="w-full bg-white rounded-2xl border border-slate-100 p-8 sm:p-10 text-slate-600 shadow-sm mt-8 mb-8 overflow-hidden text-center sm:text-left">
      <div className="relative z-10">
        {/* Linha 1: Logo e Nome */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 justify-center sm:justify-start">
          <img
            src="/logo.png?v=2"
            alt="Elo Soluções Humanas"
            className="h-10 sm:h-12 w-auto shrink-0 object-contain rounded-lg"
          />
          <span className="font-bold text-lg sm:text-2xl tracking-tight text-slate-600 mt-1 sm:mt-0">
            Soluções Humanas
          </span>
        </div>

        {/* Linha 2: Descrição e Redes Sociais */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <p className="text-sm leading-relaxed text-slate-500 max-w-3xl text-center sm:text-justify mx-auto sm:mx-0">
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
                {profileData.services
                  ?.filter((s: any) => !["empresa", "psicologos", "psicologo", "igrejas"].includes(s.category))
                  .map((svc: any, idx: number) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          if (setActiveTab) {
                            setActiveTab("voce");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }
                        }}
                        className="hover:text-amber-500 transition text-center sm:text-left w-full"
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
                {profileData.services
                  ?.filter((s: any) => s.category === "empresa")
                  .map((svc: any, idx: number) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          if (setActiveTab) {
                            setActiveTab("empresa");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }
                        }}
                        className="hover:text-amber-500 transition text-center sm:text-left w-full"
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
                {profileData.services
                  ?.filter(
                    (s: any) =>
                      s.category === "psicologos" || s.category === "psicologo",
                  )
                  .map((svc: any, idx: number) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          if (setActiveTab) {
                            setActiveTab("psicologos");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }
                        }}
                        className="hover:text-amber-500 transition text-center sm:text-left w-full"
                      >
                        {svc.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {/* Coluna 4: Para Igrejas */}
          {hasIgrejas && showIgrejasTab && (
            <div>
              <h4 className="text-slate-800 font-bold mb-4 uppercase text-xs tracking-wider">
                Para Igrejas
              </h4>
              <ul className="space-y-3 text-sm text-slate-500">
                {profileData.services
                  ?.filter((s: any) => s.category === "igrejas")
                  .map((svc: any, idx: number) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          if (setActiveTab) {
                            setActiveTab("igrejas");
                            window.scrollTo({ top: 500, behavior: "smooth" });
                          }
                        }}
                        className="hover:text-amber-500 transition text-center sm:text-left w-full"
                      >
                        {svc.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Divisor */}
        <div className="border-t border-slate-200 pt-8 flex flex-col items-center gap-6">
          <div className="text-xs text-slate-500 space-y-2 text-center w-full">
            <p>
              © {new Date().getFullYear()} ELO Soluções Humanas. Todos os
              direitos reservados. CNPJ:{" "}
              {profileData.cnpj || "00.000.000/0001-00"}
            </p>
            <p>
              Responsável Técnico: {profileData.name}{" "}
              {profileData.crp ? `– CRP ${profileData.crp}` : ""}
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
              <strong>CVV - Centro de Valorização da Vida (188)</strong> ou acesse{" "}
              <a
                href="https://www.cvv.org.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-700 font-semibold underline"
              >
                www.cvv.org.br
              </a>
              . O atendimento é gratuito e sigiloso, 24 horas por dia. Se houver
              emergência, dirija-se ao hospital mais próximo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 w-full justify-between">
            <div className="flex items-center gap-4 mb-2 sm:mb-0 justify-center">
              <button className="hover:text-amber-500 transition">
                Privacidade
              </button>
              <button className="hover:text-amber-500 transition">
                Termos
              </button>
            </div>
            <button
              onClick={() => (window.location.href = "/?saas=true")}
              className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 px-3 py-1.5 rounded-lg transition-colors capitalize normal-case text-xs font-semibold border border-amber-100 justify-center"
            >
              Sou Psicólogo: Conheça a Plataforma{" "}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
