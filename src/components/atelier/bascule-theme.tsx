"use client";

import type { ThemeAtelier } from "@/lib/atelier/theme";
import { cn } from "@/lib/utils";

/**
 * Clair / sombre pour le CRM.
 *
 * L'atelier travaille parfois en lumière basse : le mode sombre n'est pas une
 * coquetterie. Deux boutons plutôt qu'un interrupteur, pour que l'état courant
 * soit lisible sans avoir à deviner ce que bascule l'interrupteur.
 */
export function BasculeTheme({
  theme,
  onChange,
}: {
  theme: ThemeAtelier;
  onChange: (theme: ThemeAtelier) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Thème de l'interface">
      {(
        [
          ["light", "Clair"],
          ["night", "Sombre"],
        ] as const
      ).map(([valeur, label]) => (
        <button
          key={valeur}
          type="button"
          onClick={() => onChange(valeur)}
          aria-pressed={theme === valeur}
          className={cn(
            "type-mono min-h-9 rounded-field px-3 transition-colors duration-200",
            theme === valeur ? "bg-accent text-on-accent" : "text-fg-soft hover:text-accent",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
