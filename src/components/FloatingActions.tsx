import React, { useState } from 'react';
import { Share2, Check, MessageCircle } from 'lucide-react';
import { formatWa } from '../lib/utils';

export function FloatingActions({ whatsapp }: { whatsapp?: string }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-auto">
      <button
        onClick={handleShare}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/90 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-600 hover:bg-slate-800 hover:scale-105 transition-all backdrop-blur-md"
        title="Compartilhar Perfil"
      >
        {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
      </button>
      
      {whatsapp && (
        <a
          href={`https://wa.me/${formatWa(whatsapp)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:bg-emerald-600 hover:scale-105 transition-all backdrop-blur-md"
          title="Fale no WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      )}
    </div>
  );
}
