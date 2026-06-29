import React, { useState, useEffect, useRef } from 'react';
import { LogOut, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function SessionTimeout({
  onLogout,
  timeoutMinutes = 8,
  warningSeconds = 60
}: {
  onLogout: () => void;
  timeoutMinutes?: number;
  warningSeconds?: number;
}) {
  const [isWarningMode, setIsWarningMode] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  // Store mutable values in refs to avoid hook re-triggers when parent re-renders
  const onLogoutRef = useRef(onLogout);
  onLogoutRef.current = onLogout;

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningModeRef = useRef<boolean>(false);

  // Update activity timestamp
  const recordActivity = () => {
    // Only record activity if warning dialog is NOT showing.
    // If the warning dialog IS showing, the user must explicitly click "Continuar Logado"
    if (!isWarningModeRef.current) {
      lastActivityRef.current = Date.now();
    }
  };

  const handleContinue = () => {
    lastActivityRef.current = Date.now();
    isWarningModeRef.current = false;
    setIsWarningMode(false);
    setSecondsRemaining(warningSeconds);
  };

  const handleForceLogout = () => {
    onLogoutRef.current();
  };

  useEffect(() => {
    // Event listeners to detect activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, recordActivity));

    // Periodic check interval (runs every 1 second)
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivityRef.current;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const totalAllowedMs = timeoutMs + (warningSeconds * 1000);

      if (elapsedMs >= totalAllowedMs) {
        // Time is completely up - log out!
        clearInterval(intervalId);
        onLogoutRef.current();
      } else if (elapsedMs >= timeoutMs) {
        // In warning zone
        if (!isWarningModeRef.current) {
          isWarningModeRef.current = true;
          setIsWarningMode(true);
        }
        // Calculate dynamic remaining seconds based on actual elapsed time
        const remainingMs = totalAllowedMs - elapsedMs;
        const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsRemaining(remainingSecs);
      } else {
        // Safe zone
        if (isWarningModeRef.current) {
          isWarningModeRef.current = false;
          setIsWarningMode(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach(event => document.removeEventListener(event, recordActivity));
      clearInterval(intervalId);
    };
  }, [timeoutMinutes, warningSeconds]);

  if (!isWarningMode) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-slate-100 mb-3">
          Sessão Expirando
        </h3>
        
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
          Por motivos de segurança, você será desconectado em <strong className="text-amber-600 dark:text-amber-500 font-bold">{secondsRemaining} segundos</strong> por inatividade.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleContinue}
            className="w-full bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors"
          >
            Continuar Logado
          </button>
          
          <button
            onClick={handleForceLogout}
            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Sair Agora
          </button>
        </div>
      </div>
    </div>
  );
}
