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
    <ul className="flex flex-col gap-3">
      {donnees.map((donnee) => (
        <li key={donnee.label} className="grid grid-cols-[minmax(7rem,11rem)_minmax(0,1fr)_3.5rem] items-center gap-3">
          <span className="type-caption truncate text-fg-soft" title={donnee.label}>
            {donnee.label}
          </span>

          {/* La barre part de zéro : une échelle tronquée mentirait sur les écarts. */}
          <span className="relative block h-5 bg-bg-alt" title={donnee.detail ?? donnee.label}>
            <span
              className="absolute inset-y-0 left-0 rounded-r-[4px] bg-accent"
              style={{ width: `${Math.max(donnee.valeur === 0 ? 0 : 2, (donnee.valeur / max) * 100)}%` }}
            />
          </span>

          <span className="type-mono text-right text-fg" data-numeric>
            {donnee.valeur}
            {unite}
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
        className="flex h-40 items-end gap-2"
        role="img"
        aria-label="Chiffre d'affaires des six derniers mois"
      >
        {donnees.map((mois) => {
          const hauteur = mois.valeurCents === 0 ? 2 : Math.max(6, (mois.valeurCents / max) * 100);
          return (
            <div key={mois.label} className="relative h-full flex-1">
              <span
                className="type-mono absolute inset-x-0 text-center text-fg-soft"
                style={{ bottom: `calc(${hauteur}% + 6px)` }}
                data-numeric
              >
                {mois.valeurCents > 0 ? format.format(mois.valeurCents / 100) : "—"}
              </span>
              <span
                className="absolute inset-x-0 bottom-0 rounded-t-[4px] bg-accent"
                style={{ height: `${hauteur}%` }}
                title={`${mois.label} · ${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(mois.valeurCents / 100)}`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-2 border-t border-rule pt-2">
        {donnees.map((mois) => (
          <span key={mois.label} className="type-mono flex-1 text-center text-fg-soft">
            {mois.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Nombre mis en avant. Quand l'histoire est un seul chiffre, ce n'est pas un graphique. */
export function Chiffre({
  terme,
  valeur,
  detail,
  ton = "neutre",
}: {
  terme: string;
  valeur: string;
  detail?: string;
  ton?: "neutre" | "alerte" | "positif";
}) {
  return (
    <div className="border border-rule bg-bg p-5">
      <p className="type-mono text-fg-soft">{terme}</p>
      <p
        className={cn(
          "type-display-2 mt-3",
          ton === "alerte" ? "text-alert" : ton === "positif" ? "text-positive" : "text-fg",
        )}
        data-numeric
      >
        {valeur}
      </p>
      {detail && <p className="type-caption mt-2 text-fg-soft">{detail}</p>}
    </div>
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
    <section className={cn("border border-rule bg-bg p-5 sm:p-6", className)}>
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="type-title-2">{titre}</h2>
          {aide && <p className="type-caption mt-1 text-fg-soft">{aide}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
