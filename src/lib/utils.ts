import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWa(phone: string | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10 || cleaned.length === 11) {
    return "55" + cleaned;
  }
  return cleaned;
}

export const ALLOWED_CORPORATE_DOMAINS = ["elosolucoeshumanas.com", "elosolucoes.com.br"];

export function validateEmailDomain(email: string | undefined, allowedDomains: string[] = ALLOWED_CORPORATE_DOMAINS): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return allowedDomains.includes(domain);
}

