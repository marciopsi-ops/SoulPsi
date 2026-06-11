import { formatWa } from "../lib/utils";
import React from "react";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  Church,
} from "lucide-react";
import { ReviewSection } from "./ReviewSection";

export function ServiceDetail({
  therapistId,
  service,
  profileData,
  onBack,
}: {
  therapistId?: string;
  service: any;
  profileData: any;
  onBack: () => void;
}) {
  if (!service) return null;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá, gostaria de conversar sobre o serviço: ${service.title}`,
    );
    const whatsapp = profileData?.whatsapp?.replace(/\\D/g, "");
    if (whatsapp) {
      window.open(`https://wa.me/${formatWa(whatsapp)}?text=${text}`, "_blank");
    }
  };

  const getIcon = () => {
    if (service.category === "empresa")
      return <Building className="w-8 h-8 text-emerald-500" />;
    if (service.category === "psicologos" || service.category === "psicologo")
      return <GraduationCap className="w-8 h-8 text-purple-500" />;
    if (service.category === "igrejas")
      return <Church className="w-8 h-8 text-blue-500" />;
    return <Calendar className="w-8 h-8 text-amber-500" />;
  };

  // Determine standard colors based on category to keep the design matched
  let colorTheme = "amber";
  if (service.category === "empresa") colorTheme = "emerald";
  if (service.category === "psicologos" || service.category === "psicologo")
    colorTheme = "purple";
  if (service.category === "igrejas") colorTheme = "blue";

  const themeClasses: any = {
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-800",
      button: "bg-amber-500 hover:bg-amber-600",
      bgIcon: "bg-amber-100/50",
    },
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-800",
      button: "bg-emerald-600 hover:bg-emerald-700",
      bgIcon: "bg-emerald-100/50",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      text: "text-purple-800",
      button: "bg-purple-600 hover:bg-purple-700",
      bgIcon: "bg-purple-100/50",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      text: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700",
      bgIcon: "bg-blue-100/50",
    },
  };

  const theme = themeClasses[colorTheme];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {profileData && (
          <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {profileData.profilePhoto ? (
              <img
                src={profileData.profilePhoto}
                alt={profileData.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-full bg-[rgb(var(--theme-primary)_/_0.1)] text-[rgb(var(--theme-primary))] flex items-center justify-center text-2xl font-bold shadow-sm">
                {profileData.name?.charAt(0) || "P"}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800">
                {profileData.name}
              </h3>
              <p
                className="text-sm font-medium mb-3"
                style={{ color: "rgb(var(--theme-primary))" }}
              >
                {profileData.title || profileData.profession || "Psicólogo(a)"}
              </p>
              {profileData.bio && (
                <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed">
                  {profileData.bio}
                </p>
              )}
            </div>
          </div>
        )}

        <div
          className={`bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100`}
        >
          <div
            className={`${theme.bg} border-b ${theme.border} p-8 sm:p-12 text-center`}
          >
            <div
              className={`w-20 h-20 mx-auto ${theme.bgIcon} rounded-2xl flex items-center justify-center mb-6`}
            >
              {getIcon()}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              {service.title}
            </h1>
            <p
              className={`text-base sm:text-lg ${theme.text} mb-0 max-w-lg mx-auto`}
            >
              {service.description}
            </p>
          </div>

          <div className="p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {(service.duration || "") && (
                <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-full flex flex-shrink-0 items-center justify-center text-slate-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Duração
                    </h4>
                    <p className="font-semibold text-slate-800">
                      {service.duration}
                    </p>
                  </div>
                </div>
              )}
              {service.price > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-white shadow-sm rounded-full flex flex-shrink-0 items-center justify-center text-slate-500">
                    <span className="font-bold">R$</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Valor
                    </h4>
                    <p className="font-semibold text-slate-800">
                      R${" "}
                      {service.price.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(service.detailedDescription || "") && (
              <div className="mb-10 text-slate-600 leading-relaxed whitespace-pre-wrap text-justify">
                {service.detailedDescription}
              </div>
            )}

            <div className="pt-8 border-t border-slate-100">
              <button
                onClick={handleWhatsApp}
                className={`w-full text-white px-6 py-4 rounded-xl text-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 ${theme.button}`}
              >
                Agende ou saiba mais pelo Whatsapp
              </button>
            </div>
          </div>
        </div>

        {profileData && (
          <>
            <ReviewSection
              therapistId={therapistId || "demo-therapist-id"}
              profileData={profileData}
            />
          </>
        )}
      </div>
    </div>
  );
}
