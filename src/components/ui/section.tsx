import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Fond = "papier" | "alterne" | "nuit";

const FONDS: Record<Fond, string> = {
  papier: "bg-bg text-fg",
  alterne: "bg-bg-alt text-fg",
  nuit: "bg-night text-night-ink",
};

/**
 * Bande horizontale du site. Le retrait latéral est posé ici, une seule fois :
 * aucun composant enfant ne gère ses propres marges de bord d'écran.
 */
export function Section({
  fond = "papier",
  id,
  children,
  className,
  compact = false,
}: {
  fond?: Fond;
  id?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      id={id}
      data-theme={fond === "nuit" ? "night" : undefined}
      className={cn(FONDS[fond], className)}
      style={{
        paddingInline: "var(--gutter)",
        paddingBlock: compact ? "clamp(40px, 5vw, 72px)" : "var(--section-y)",
      }}
    >
      <div className="mx-auto w-full max-w-content">{children}</div>
    </section>
  );
}

export function SectionHeader({
  surtitre,
  titre,
  niveau = 2,
  intro,
  action,
  className,
}: {
  surtitre?: string;
  titre: ReactNode;
  /**
   * Niveau du titre. Une page dont ce bloc est le titre principal passe 1 ;
   * partout ailleurs on reste en 2, pour ne pas trouer la hiérarchie.
   */
  niveau?: 1 | 2;
  intro?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-[46ch]">
        {surtitre && <p className="type-mono mb-4 text-fg-soft">{surtitre}</p>}
        {niveau === 1 ? (
          <h1 className="type-display-2">{titre}</h1>
        ) : (
          <h2 className="type-display-2">{titre}</h2>
        )}
        {intro && <p className="type-lead measure mt-5 text-fg-soft">{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Filet 1 px. Le séparateur par défaut du site : pas d'ombre, pas de carte. */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-rule", className)} />;
}
