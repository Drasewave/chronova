import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Gabarit du CRM : les quelques pièces de présentation que toutes les pages de
 * l'atelier partagent. L'outil sert à l'établi, souvent sur une tablette : les
 * titres restent à une échelle d'outil, les cibles font 44 px, et une surface
 * porte une bordure — jamais une ombre en plus.
 */

/** Grand panneau : rayon de carte, filet, fond de panneau. */
export const SURFACE = "rounded-card border border-rule bg-panel";

/** Petit bloc posé DANS un panneau : teinté, sans bordure, pour ne pas imbriquer deux cartes. */
export const BLOC = "rounded-field bg-bg-alt";

/**
 * Identifiant technique à lire tel quel (clé, variable de gabarit, slug).
 * `.type-mono` le mettrait en capitales : une clé sensible à la casse y perdrait son sens.
 */
export const CODE = "font-mono text-[0.8125rem] leading-[1.4] tracking-normal normal-case";

/** Chiffre mis en avant dans un panneau : lisible, sans l'emphase d'une vitrine. */
export const CHIFFRE_FORT =
  "font-title text-[1.75rem] font-normal leading-[1.15] tracking-[-0.01em] text-fg";

/** Ligne cliquable d'une liste de panneau : 44 px, survol discret. */
export const LIGNE_LISTE =
  "-mx-2 flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-field px-2 py-2 transition-colors duration-200 hover:bg-bg-alt";

/** Ligne de tableau : filet bas, survol discret. */
export const LIGNE_TABLEAU = "border-b border-rule transition-colors duration-200 hover:bg-bg-alt";

/** Titre de page du CRM : ≈ 1,75–2,125 rem, graisse 400. */
export function TitrePage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "font-title text-[clamp(1.75rem,1.45rem+0.8vw,2.125rem)] font-normal leading-[1.15] tracking-[-0.012em] text-fg",
        className,
      )}
    >
      {children}
    </h1>
  );
}

/** Retour à la liste parente. Cible de 44 px. */
export function FilAriane({ href, children }: { href: string; children: ReactNode }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-1">
      <Link href={href} className="type-caption lien-atelier link-underline text-fg-soft hover:text-accent">
        ← {children}
      </Link>
    </nav>
  );
}

/** Rangée de filtres d'une liste. */
export function Filtres({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2">
      {children}
    </nav>
  );
}

export function Filtre({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={cn(
        "type-ui flex min-h-11 items-center rounded-pill border px-4 transition-colors duration-200",
        actif
          ? "border-accent bg-accent text-on-accent"
          : "border-rule text-fg hover:border-fg-soft hover:bg-bg-alt",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Tableau du CRM. Il défile dans son propre cadre : la page, elle, ne déborde
 * jamais. `cadre` l'habille en panneau quand il est posé à même la page ; dans
 * un `Panneau`, on s'en passe pour ne pas imbriquer deux cartes.
 */
export function Tableau({
  largeurMin,
  cadre = false,
  children,
}: {
  /** Classe Tailwind de largeur minimale, par ex. `min-w-[54rem]`. */
  largeurMin: string;
  cadre?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "defilement-atelier overflow-x-auto",
        cadre && [SURFACE, "[&_tbody_tr:last-child]:border-0"],
      )}
    >
      <table className={cn("w-full border-collapse", largeurMin)}>{children}</table>
    </div>
  );
}

export function Th({ children, align }: { children: ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={cn(
        "type-mono h-11 whitespace-nowrap px-3 py-2 font-medium text-fg-soft",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align,
  className,
}: {
  children: ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <td className={cn("h-12 whitespace-nowrap px-3 py-1.5", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}

/** État vide d'une liste posée à même la page. */
export function EtatVide({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "type-ui rounded-card border border-dashed border-rule px-5 py-8 text-center font-normal text-fg-soft",
        className,
      )}
    >
      {children}
    </p>
  );
}
