import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Ton = "neutre" | "accent" | "positif" | "alerte";

const TONS: Record<Ton, string> = {
  neutre: "border-rule text-fg-soft",
  accent: "border-accent text-accent",
  positif: "border-positive text-positive",
  alerte: "border-alert text-alert",
};

/** Étiquette courte : statut de stock, mention « exemple », style de montre. */
export function Pill({
  ton = "neutre",
  children,
  className,
}: {
  ton?: Ton;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "type-mono inline-flex items-center gap-1.5 border px-2 py-1 leading-none",
        TONS[ton],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Marque une donnée de démonstration. Tout ce qui porte cette pastille est
 * fictif et modifiable depuis le CRM — jamais un chiffre présenté comme réel.
 */
export function SamplePill({ className }: { className?: string }) {
  return (
    <Pill ton="alerte" className={className}>
      Exemple
    </Pill>
  );
}
