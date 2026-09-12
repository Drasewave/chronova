import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Champs du CRM.
 *
 * Un seul dessin pour toutes les saisies de l'atelier : filet de 1 px, coin de
 * 2 px, hauteur de 44 px. Chaque champ porte son étiquette dans un `<label>`
 * enveloppant — rien à relier par `for`, rien à oublier.
 */
const SAISIE =
  "type-ui w-full rounded-field border border-rule bg-bg px-3 text-fg placeholder:text-fg-soft";

export function Champ({
  label,
  aide,
  className,
  children,
}: {
  label: string;
  /** Précision affichée sous le champ, pas un texte d'aide au survol. */
  aide?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="type-caption text-fg-soft">{label}</span>
      {children}
      {aide && <span className="type-caption text-fg-soft">{aide}</span>}
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
  return <textarea {...props} className={cn(SAISIE, "py-2", props.className)} />;
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
        "type-ui inline-flex min-h-11 items-center justify-center self-start rounded-field bg-accent px-5 text-on-accent transition-colors duration-200 hover:bg-accent-hover",
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
        "type-ui inline-flex min-h-11 items-center justify-center self-start rounded-field border border-rule px-5 text-fg transition-colors duration-200 hover:border-accent hover:text-accent",
        className,
      )}
    >
      {children}
    </button>
  );
}
