import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Champs du CRM.
 *
 * Un seul dessin pour toutes les saisies de l'atelier : contour `--field`
 * (3:1 sur tous les fonds), rayon de champ, hauteur de 44 px. Chaque champ
 * porte son étiquette au-dessus, dans un `<label>` enveloppant — rien à relier
 * par `for`, rien à oublier. L'aide se lit dessous, en légende.
 */
export const SAISIE =
  "type-ui w-full rounded-field border border-field bg-panel px-3 font-normal text-fg transition-colors duration-200 placeholder:text-fg-soft hover:border-fg focus-visible:border-accent-ink focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:border-rule disabled:bg-bg-alt disabled:text-fg-soft aria-[invalid=true]:border-alert";

/** Case à cocher de 24 px dans une ligne de 44 px. */
export const CASE = "size-6 shrink-0 accent-[var(--accent)]";

export function Champ({
  label,
  aide,
  erreur,
  className,
  children,
}: {
  label: string;
  /** Précision affichée sous le champ, pas un texte d'aide au survol. */
  aide?: string;
  /** Message d'erreur : remplace l'aide, en couleur d'alerte. */
  erreur?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && <span className="type-caption font-medium text-fg">{label}</span>}
      {children}
      {erreur ? (
        <span role="alert" className="type-caption text-alert">
          {erreur}
        </span>
      ) : (
        aide && <span className="type-caption text-fg-soft">{aide}</span>
      )}
    </label>
  );
}

export function Saisie(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(SAISIE, "h-11", props.className)} />;
}

export function Liste(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(SAISIE, "h-11", props.className)} />;
}

export function Zone(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(SAISIE, "min-h-11 py-2.5 leading-[1.5]", props.className)} />;
}

export function Bouton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        "type-ui inline-flex min-h-11 items-center justify-center self-start rounded-pill bg-accent px-6 text-on-accent transition-colors duration-200 hover:bg-accent-hover active:translate-y-px",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Variante discrète : une action secondaire ne doit pas peser autant. */
export function BoutonLeger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      className={cn(
        "type-ui inline-flex min-h-11 items-center justify-center self-start rounded-pill border border-field px-5 text-fg transition-colors duration-200 hover:border-fg hover:bg-bg-alt active:translate-y-px",
        className,
      )}
    >
      {children}
    </button>
  );
}
