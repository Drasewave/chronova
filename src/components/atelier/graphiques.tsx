import Link from "next/link";
import { SURFACE } from "@/components/atelier/gabarit";
import { cn } from "@/lib/utils";

/**
 * Graphiques du tableau de bord.
 *
 * Une seule série par graphique, donc une seule couleur : c'est la longueur de
 * la barre qui porte l'information, pas sa teinte. Aucune légende n'est
 * nécessaire — le titre nomme la série. Les axes restent en filet, les valeurs
 * en encre : jamais de texte coloré à la couleur de la barre.
 *
 * La couleur est `--accent`, qui bascule en laiton clair sur fond nuit ; les
 * deux versions passent le niveau AA sur leur fond respectif.
 */

export interface BarreHorizontale {
  label: string;
  valeur: number;
  /** Détail affiché au survol, en plus de la valeur. */
  detail?: string;
  href?: string;
}

export function BarresHorizontales({
  donnees,
  unite = "",
  vide = "Rien à afficher.",
}: {
  donnees: BarreHorizontale[];
  unite?: string;
  vide?: string;
}) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  if (donnees.length === 0) return <p className="type-caption text-fg-soft">{vide}</p>;

  return (
    <ul className="flex flex-col gap-1">
      {donnees.map((donnee) => (
        <li
          key={donnee.label}
          className="grid min-h-8 grid-cols-[minmax(6rem,9rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)]"
        >
          <span className="type-caption truncate text-fg" title={donnee.label}>
            {donnee.label}
          </span>

          {/* La barre part de zéro : une échelle tronquée mentirait sur les écarts.
              La valeur se lit au bout de la barre, là où l'œil s'arrête ; la
              largeur utile lui réserve donc 3 rem. */}
          <span className="flex items-center gap-2" title={donnee.detail ?? donnee.label}>
            <span
              className="block h-3.5 shrink-0 rounded-[3px] bg-accent"
              style={{
                width:
                  donnee.valeur === 0 ? "2px" : `calc((100% - 3rem) * ${donnee.valeur / max})`,
                minWidth: "2px",
              }}
            />
            <span
              className={cn("type-caption font-medium", donnee.valeur === 0 ? "text-fg-soft" : "text-fg")}
              data-numeric
            >
              {donnee.valeur}
              {unite}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface BarreMois {
  label: string;
  valeurCents: number;
}

/** Chiffre d'affaires mois par mois. Six barres, toutes étiquetées. */
export function HistogrammeMois({ donnees }: { donnees: BarreMois[] }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeurCents));
  const format = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div>
      {/* Positionnement absolu dans une colonne de hauteur définie : une hauteur
          en pourcentage posée sur un enfant de hauteur automatique vaudrait zéro. */}
      <div
        className="flex h-44 items-end gap-2 pt-7 sm:gap-3"
        role="img"
        aria-label="Chiffre d'affaires des six derniers mois"
      >
        {donnees.map((mois) => {
          const hauteur = mois.valeurCents === 0 ? 2 : Math.max(6, (mois.valeurCents / max) * 100);
          return (
            <div key={mois.label} className="relative h-full flex-1">
              <span
                className={cn(
                  "type-caption absolute inset-x-0 whitespace-nowrap text-center font-medium",
                  mois.valeurCents > 0 ? "text-fg" : "text-fg-soft",
                )}
                style={{ bottom: `calc(${hauteur}% + 4px)` }}
                data-numeric
              >
                {mois.valeurCents > 0 ? format.format(mois.valeurCents / 100) : "—"}
              </span>
              <span
                className="absolute inset-x-0 bottom-0 mx-auto max-w-16 rounded-t-[4px] bg-accent"
                style={{ height: `${hauteur}%` }}
                title={`${mois.label} · ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(mois.valeurCents / 100)}`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 border-t border-rule pt-2 sm:gap-3">
        {donnees.map((mois) => (
          <span key={mois.label} className="type-caption flex-1 text-center text-fg-soft">
            {mois.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface ElementSynthese {
  terme: string;
  valeur: string;
  detail?: string;
  /** `alerte` seulement quand il y a vraiment quelque chose à traiter. */
  ton?: "neutre" | "alerte" | "positif";
  /** Où aller pour agir sur ce chiffre. */
  href?: string;
}

/**
 * Bande de synthèse : les chiffres du jour sur une seule surface, séparés par
 * des filets, alignés sur les mêmes lignes de base. Chaque case mène à l'écran
 * où l'on agit — un chiffre qu'on ne peut pas suivre n'aide pas à l'établi.
 */
export function Synthese({ label, elements }: { label: string; elements: ElementSynthese[] }) {
  return (
    <ul
      aria-label={label}
      className="grid gap-px overflow-hidden rounded-card border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4"
    >
      {elements.map((element) => {
        const contenu = (
          <>
            <span className="type-caption block text-fg-soft">{element.terme}</span>
            <span
              className={cn(
                "mt-1 block font-title text-[1.75rem] font-normal leading-[1.2] tracking-[-0.01em]",
                element.ton === "alerte"
                  ? "text-alert"
                  : element.ton === "positif"
                    ? "text-positive"
                    : "text-fg",
              )}
              data-numeric
            >
              {element.valeur}
            </span>
            {element.detail && (
              <span className="type-caption mt-1 block text-fg-soft">{element.detail}</span>
            )}
          </>
        );
        return (
          <li key={element.terme} className="flex bg-panel">
            {element.href ? (
              <Link
                href={element.href}
                className="block flex-1 px-5 py-4 transition-colors duration-200 hover:bg-bg-alt"
              >
                {contenu}
              </Link>
            ) : (
              <div className="flex-1 px-5 py-4">{contenu}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Bloc de tableau de bord : un titre, une explication courte, un contenu. */
export function Panneau({
  titre,
  aide,
  action,
  children,
  className,
}: {
  titre: string;
  aide?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(SURFACE, "p-5 sm:p-6", className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-title text-[1.25rem] font-medium leading-[1.3] text-fg">{titre}</h2>
          {aide && <p className="type-caption measure mt-1 text-fg-soft">{aide}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
