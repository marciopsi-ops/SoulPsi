import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Mail, Lock, Chrome, X, Loader2, ArrowRight, AlertCircle, MessageSquare } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  saasEnabled?: boolean;
  supportInfo?: {
    phone: string;
    email: string;
    message: string;
  };
}

export function AuthModal({ onClose, saasEnabled = true, supportInfo }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot_password">(
    "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error: any) {
      if (
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        return;
      }
      console.error("Login failed", error);
      if (error.code === "auth/unauthorized-domain") {
        setError(
          "O domínio atual não está autorizado. Adicione-o no painel do Firebase.",
        );
      } else {
        setError("Falha no login com Google. Erro: " + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        onClose();
      } else if (mode === "forgot_password") {
        await sendPasswordResetEmail(auth, email);
        setMessage(
          "Email de redefinição de senha enviado. Verifique sua caixa de entrada.",
        );
      }
    } catch (err: any) {
      console.error(err);

      let errorMsg = err.message || "Ocorreu um erro desconhecido.";
      if (err.code === "auth/email-already-in-use")
        errorMsg = "Este email já está em uso.";
      if (err.code === "auth/invalid-credential")
        errorMsg = "Email ou senha incorretos.";
      if (err.code === "auth/weak-password")
        errorMsg = "A senha deve ter pelo menos 6 caracteres.";
      if (err.code === "auth/user-not-found")
        errorMsg = "Usuário não encontrado.";
      if (err.code === "auth/configuration-not-found") {
        errorMsg =
          "A autenticação por Email/Senha não está ativada. Ative-a no Console do Firebase (Authentication > Sign-in method > Email/Password) para liberar o cadastro com outros emails.";
      }
      if (err.code === "auth/operation-not-allowed") {
        errorMsg =
          "O cadastro com email e senha está desabilitado no Firebase. É necessário ativar a opção 'Email/Password' no menu Authentication do Firebase Console.";
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {mode === "login" && "Acesso Profissional"}
            {mode === "register" && "Criar sua Conta"}
            {mode === "forgot_password" && "Redefinir Senha"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl border border-emerald-100">
              {message}
            </div>
          )}

          {mode === "register" && !saasEnabled ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-inner border border-amber-100/50">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                Cadastros de Novos Psicólogos Suspensos
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed px-1">
                O fluxo de novas vendas e captação de clientes está temporariamente suspenso. Para ingressar na plataforma ou obter mais detalhes, entre em contato direto com a empresa:
              </p>

              {supportInfo?.message && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 italic leading-relaxed">
                  "{supportInfo.message}"
                </div>
              )}

              <div className="space-y-2 pt-2">
                {supportInfo?.phone && (
                  <button
                    onClick={() => window.open(`https://wa.me/${supportInfo.phone.replace(/\D/g, '')}`, '_blank')}
                    className="w-full flex items-center justify-center gap-3 bg-emerald-550 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Falar via WhatsApp
                  </button>
                )}

                {supportInfo?.email && (
                  <a
                    href={`mailto:${supportInfo.email}`}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
                  >
                    <Mail className="w-5 h-5 text-slate-400" />
                    Enviar E-mail para Suporte
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-750">
                <button
                  onClick={() => setMode("login")}
                  className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-350 font-bold text-sm transition-colors"
                >
                  Voltar para o Login Profissional
                </button>
              </div>
            </div>
          ) : (
            <>
              {(mode === "login" || mode === "register") && (
                <div className="space-y-4 mb-6">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Chrome className="w-5 h-5 text-blue-500" />
                    {mode === "login"
                      ? "Entrar com Google"
                      : "Cadastrar com Google"}
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">
                      ou com email
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 relative">
                {loading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                    <span className="text-amber-600 font-medium text-sm">
                      Aguarde...
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {mode !== "forgot_password" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Senha
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                >
                  {mode === "login" && "Entrar"}
                  {mode === "register" && "Cadastrar agora"}
                  {mode === "forgot_password" && "Enviar email"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
                {mode === "login" && (
                  <>
                    <button
                      onClick={() => {
                        setMode("forgot_password");
                        setError("");
                        setMessage("");
                      }}
                      className="text-amber-650 hover:text-amber-700 font-medium block w-full"
                    >
                      Esqueci minha senha
                    </button>
                    <div>
                      Não tem uma conta?{" "}
                      <button
                        onClick={() => {
                          setMode("register");
                          setError("");
                          setMessage("");
                        }}
                        className="text-amber-655 hover:text-amber-700 font-medium"
                      >
                        Cadastre-se
                      </button>
                    </div>
                  </>
                )}
                {mode === "register" && (
                  <div>
                    Já tem uma conta?{" "}
                    <button
                      onClick={() => {
                        setMode("login");
                        setError("");
                        setMessage("");
                      }}
                      className="text-amber-650 hover:text-amber-700 font-medium"
                    >
                      Fazer login
                    </button>
                  </div>
                )}
                {mode === "forgot_password" && (
                  <button
                    onClick={() => {
                      setMode("login");
                      setError("");
                      setMessage("");
                    }}
                    className="text-amber-650 hover:text-amber-700 font-medium block w-full"
                  >
                    Voltar para o Login
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
