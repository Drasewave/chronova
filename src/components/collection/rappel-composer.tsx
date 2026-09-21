import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Rappel « Composer » : une gamme ou une fiche présente un point de départ,
 * pas un produit figé. Le texte dit ce que le modèle fixe et ce qui se choisit.
 */
export function RappelComposer({
  titre = "Chaque modèle se personnalise",
  modele,
  exemples,
}: {
  titre?: string;
  /** Avec un modèle, le bouton principal ouvre directement son configurateur. */
  modele?: { slug: string };
  /** Rendus côté serveur : deux compositions du même boîtier, par exemple. */
  exemples?: ReactNode;
}) {
  return (
    <Section fond="alterne">
      <div
        className={cn(
          "grid items-center gap-10 lg:gap-16",
          exemples ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : undefined,
        )}
      >
        <div>
          <h2 className="type-display-2">{titre}</h2>
          <p className="type-lead measure mt-5 text-fg-soft">
            Un modèle fixe le boîtier, le diamètre et l&apos;étanchéité. Vous composez ensuite le
            cadran, les aiguilles, la lunette, la couronne, le bracelet, le verre, le mouvement et
            le fond, et vous voyez le rendu, le prix et le délai changer à chaque choix.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {modele ? (
              <>
                <ButtonLink href={`/composer/${modele.slug}`}>
                  Composer cette montre
                  <IconFleche className="fleche-glisse" />
                </ButtonLink>
                <ButtonLink href="/composer" variant="discret">
                  Partir d&apos;un autre modèle
                </ButtonLink>
              </>
            ) : (
              <ButtonLink href="/composer">
                Composer ma montre
                <IconFleche className="fleche-glisse" />
              </ButtonLink>
            )}
          </div>
        </div>
        {exemples}
      </div>
    </Section>
  );
}
