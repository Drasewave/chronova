import type { OrderStatus } from "@/generated/prisma/enums";
import { ETAPES_CLIENT, formatDate, indexEtape } from "@/lib/commandes/etapes";
import { cn } from "@/lib/utils";

export interface EvenementFrise {
  toStatus: OrderStatus;
  createdAt: Date;
  note: string | null;
}

/**
 * Frise d'assemblage.
 *
 * Verticale : les intitulés d'étapes sont des phrases, pas des mots, et une
 * frise horizontale les écraserait. Le trait de liaison est en laiton jusqu'à
 * l'étape atteinte, en filet neutre au-delà — la progression se lit sans
 * dépendre de la couleur seule, puisque chaque étape porte aussi sa date.
 */
export function OrderTimeline({
  statut,
  evenements,
}: {
  statut: OrderStatus;
  evenements: EvenementFrise[];
}) {
  const atteint = indexEtape(statut);
  const dates = new Map(evenements.map((e) => [e.toStatus, e.createdAt] as const));

  return (
    <ol className="relative">
      {ETAPES_CLIENT.map((etape, index) => {
        const franchie = index <= atteint;
        const courante = index === atteint;
        const date = formatDate(dates.get(etape.statut));
        const dernière = index === ETAPES_CLIENT.length - 1;

        return (
          <li key={etape.statut} className="relative flex gap-5 pb-8 last:pb-0">
            {/* Trait de liaison. */}
            {!dernière && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[7px] top-4 h-full w-px",
                  index < atteint ? "bg-accent" : "bg-rule",
                )}
              />
            )}

            <span
              aria-hidden="true"
              className={cn(
                "relative mt-1 size-[15px] shrink-0 rounded-pill border-2",
                franchie ? "border-accent bg-accent" : "border-rule bg-bg",
                courante && "ring-4 ring-[color-mix(in_srgb,var(--accent)_22%,transparent)]",
              )}
            />

            <div className="min-w-0 flex-1">
              <p className={cn("type-ui", franchie ? "text-fg" : "text-fg-soft")}>
                {etape.label}
                {courante && <span className="type-mono ml-3 text-accent">En cours</span>}
              </p>
              <p className="type-caption mt-1 text-fg-soft">{etape.description}</p>
              {date && <p className="type-mono mt-2 text-fg-soft">{date}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
