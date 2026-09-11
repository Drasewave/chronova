import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind en laissant la dernière gagner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formate un montant stocké en centimes. */
export function formatPrice(cents: number, options?: { decimals?: boolean }): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: options?.decimals ? 2 : 0,
    maximumFractionDigits: options?.decimals ? 2 : 0,
  }).format(cents / 100);
}
