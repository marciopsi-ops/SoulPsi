import { formatWa } from "../lib/utils";
import React, { useState } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QrCode, Lock, ArrowLeft, CheckCircle2, Copy } from "lucide-react";

export function Checkout({
  therapistId,
  profileData,
  bookingData,
  onSuccess,
  onCancel,
}: any) {
  const [phase, setPhase] = useState<
    "review" | "payment-choice" | "payment-pix" | "success"
  >("review");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [patientChoice, setPatientChoice] = useState<"pix" | "whatsapp" | null>(
    null,
  );

  const hasPix = !!profileData?.pixKey;
  const allowPayment = bookingData?.sessionAllowPayment !== false;
  const isPaid = bookingData?.sessionPrice > 0;

  const handleCopyPix = () => {
    if (profileData?.pixKey) {
      navigator.clipboard.writeText(profileData.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmReservation = async () => {
    setLoading(true);
    try {
      let datetime = new Date(Date.now() + 86400000).toISOString();
      if (bookingData?.appointmentDate && bookingData?.appointmentTime) {
        datetime = new Date(
          `${bookingData.appointmentDate}T${bookingData.appointmentTime}`,
        ).toISOString();
      }

      await addDoc(collection(db, `profiles/${therapistId}/appointments`), {
        clientId: bookingData?.clientId || null,
        clientName: bookingData?.clientName || "Anônimo",
        datetime: datetime || new Date().toISOString(),
        status: "scheduled",
        paymentStatus: "pending",
        totalAmount: bookingData?.sessionPrice ?? 0,
        createdAt: serverTimestamp(),
      });

      try {
        await addDoc(
          collection(db, `profiles/${therapistId}/system_notifications`),
          {
            title: "Novo Agendamento Confirmado",
            message: `${bookingData?.clientName || "Anônimo"} agendou uma sessão.`,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        );
      } catch (e) {}

      // Navigate based on payment settings
      if (isPaid && allowPayment && hasPix) {
        setPhase("payment-choice");
      } else {
        setPhase("success");
      }
    } catch (e: any) {
      if (e.message?.includes("missing or insufficient permissions")) {
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `profiles/${therapistId}/appointments`,
        );
      } else {
        alert("Erro no agendamento: " + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (phase === "success") {
    const isWhatsappFlow = profileData?.paymentFlow === "whatsapp";
    return (
      <div className="w-full max-w-lg mx-auto py-20 px-4 flex flex-col items-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Sessão Solicitada com Sucesso!
        </h2>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-sm justify-center flex flex-col items-center mb-8 text-center w-full">
          <div className="text-amber-800 font-medium mb-4 text-left w-full">
            Confirmação enviada por e-mail e SMS. Entre em contato com o
            profissional pelo seu WhatsApp para:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-700">
              <li>confirmar a sessão, data e hora</li>
              <li>
                obter o link da chamada de vídeo ou instruções presenciais
              </li>
              <li>
                obter orientações de pagamento ou enviar o comprovante, caso já
                tenha pago.
              </li>
            </ul>
          </div>
          <a
            href={`https://wa.me/${formatWa(bookingData?.therapistWhatsapp || "")}?text=${encodeURIComponent(
              patientChoice === "whatsapp" || !patientChoice
                ? `Olá, confirmando minha reserva de horário${bookingData?.appointmentDate ? ` para o dia ${bookingData?.appointmentDate} às ${bookingData?.appointmentTime}` : ""} (Valor: ${bookingData?.sessionPrice === 0 ? "À combinar" : `R$ ${bookingData?.sessionPrice}`}). Gostaria de verificar as formas de pagamento e acertar os detalhes da sessão.`
                : `Olá, confirmo minha reserva de horário${bookingData?.appointmentDate ? ` para o dia ${bookingData?.appointmentDate} às ${bookingData?.appointmentTime}` : ""} (Valor: R$ ${bookingData?.sessionPrice}). O pagamento foi realizado via PIX. Segue meu comprovante!`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold shadow-sm transition text-center"
          >
            Confirmar sessão com o profissional
          </a>
        </div>
        <button
          onClick={onSuccess}
          className="bg-amber-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-amber-600"
        >
          Voltar para o Perfil
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {phase === "review" && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {phase === "review" && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-400" />
              Resumo do Agendamento
            </h2>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:justify-between sm:items-center text-slate-800 gap-2">
              <div>
                <p className="font-semibold text-lg">
                  {bookingData?.sessionTitle || "Sessão Online"}
                </p>
                {bookingData?.appointmentDate && (
                  <p className="text-sm text-slate-500 mt-1">
                    {bookingData.appointmentDate} às{" "}
                    {bookingData.appointmentTime}
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold">
                {bookingData?.sessionPrice === 0
                  ? "À combinar"
                  : `R$ ${bookingData?.sessionPrice}`}
              </p>
            </div>

            {(!allowPayment || !isPaid) && (
              <div className="mb-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <p className="text-slate-700 text-center">
                  Para este serviço, os detalhes e formas de pagamento serão
                  alinhados diretamente com o profissional pelo <b>WhatsApp</b>{" "}
                  após a confirmação reserva.
                </p>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button
                disabled={loading}
                onClick={handleConfirmReservation}
                className="w-full bg-marsala-800 text-white font-semibold py-4 rounded-xl hover:bg-marsala-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Confirmando..." : "Confirmar Reserva de Horário"}
              </button>
            </div>
          </>
        )}

        {phase === "payment-choice" && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 text-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Horário Reservado!
            </h2>
            <div className="mb-6 flex flex-col gap-4">
              <p className="text-slate-700 font-medium text-center mb-2">
                Para agilizar, como você prefere realizar o pagamento?
              </p>

              <button
                onClick={() => {
                  setPatientChoice("pix");
                  setPhase("payment-pix");
                }}
                className="w-full text-left p-4 border border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Pagar agora via PIX
                  </p>
                  <p className="text-sm text-slate-500">
                    O profissional disponibilizou uma chave para pagamento
                    rápido.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  setPatientChoice("whatsapp");
                  setPhase("success");
                }}
                className="w-full text-left p-4 border border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xl">Wa</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800">
                    Combinar pelo WhatsApp
                  </p>
                  <p className="text-sm text-slate-500">
                    Pagamento tratado diretamente com o profissional.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {phase === "payment-pix" && (
          <>
            <div className="mb-8 border border-emerald-100 bg-emerald-50 rounded-xl p-6 flex flex-col items-center">
              <h3 className="text-lg font-bold text-emerald-800 mb-4 text-center">
                Pagamento via Pix
              </h3>

              {profileData?.pixQrCode ? (
                <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                  <img
                    src={profileData.pixQrCode}
                    alt="QR Code Pix"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : profileData?.pixKey ? (
                <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileData.pixKey)}`}
                    alt="QR Code Pix"
                    className="w-40 h-40"
                  />
                </div>
              ) : null}
              <p className="text-sm text-emerald-700 text-center mb-4">
                Escaneie o QR Code acima com o aplicativo do seu banco ou copie
                a chave Pix abaixo.
              </p>

              {profileData?.pixKey && (
                <div className="w-full mb-4">
                  <label className="block text-xs font-medium text-emerald-700 mb-1">
                    Chave Pix
                  </label>
                  <div className="flex">
                    <input
                      readOnly
                      value={profileData.pixKey}
                      className="w-full bg-white border border-emerald-200 rounded-l-lg p-3 text-emerald-900 font-mono text-sm outline-none text-slate-900 dark:text-slate-100 dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-4 rounded-r-lg flex items-center justify-center shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-emerald-600 mt-2">
                      Chave Pix copiada para a área de transferência!
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setPhase("success")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition mt-4"
              >
                Já efetuei o pagamento
              </button>
            </div>
            <button
              onClick={() => {
                setPatientChoice("whatsapp");
                setPhase("success");
              }}
              className="w-full text-slate-500 hover:text-slate-700 font-medium py-2 rounded-xl transition"
            >
              Prefiro acertar depois
            </button>
          </>
        )}
      </div>
    </div>
  );
}
