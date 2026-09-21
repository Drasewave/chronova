import Link from "next/link";
import { ViewTransition } from "react";
import { IconFleche } from "@/components/ui/icons";
import { Pill, SamplePill } from "@/components/ui/pill";
import { MontreCliente, MontreDifferee, SecondColoris } from "@/components/ui/montre-differee";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import type { WatchModelView } from "@/lib/data/models";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import { formatPrice } from "@/lib/utils";

/**
 * Vignette de modèle. Au survol, la montre s'approche à peine (3,5 %, sans
 * rotation), un reflet traverse le verre et le second coloris apparaît en fondu
 * — trois indices que la montre est configurable, sans une ligne de texte de
 * plus. Tout est lent (`--d-long`, `--d-reveal`) et réversible à tout instant.
 */
export function ModelCard({
  catalogue,
  modele,
  priorite = false,
  differe = !priorite,
  niveau = 3,
}: {
  catalogue: Catalogue;
  modele: WatchModelView;
  priorite?: boolean;
  /**
   * Dessin monté côté client à l'approche de l'écran (voir `MontreDifferee`).
   * Par défaut, toute carte qui n'est pas prioritaire : le nom, le lien et le
   * prix restent rendus par le serveur, seul le dessin attend.
   */
  differe?: boolean;
  /**
   * Niveau du nom du modèle. 3 sous un titre de section, 2 quand la grille est
   * directement sous le titre de la page : la hiérarchie ne doit pas sauter de
   * niveau, c'est ce qui permet de parcourir une page au lecteur d'écran.
   */
  niveau?: 2 | 3;
}) {
  const base = defaultConfiguration(catalogue, modele);
  const variante = altConfiguration(catalogue, modele);
  const intitule = `${modele.name}, ${modele.styleLabel.toLowerCase()}, ${modele.diameterMm} millimètres`;

  return (
    <article className="carte-montre group">
      <Link
        href={`/collection/${modele.slug}`}
        className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
      >
        <div className="cadre-montre relative overflow-hidden px-4 pb-2 pt-6">
          {/* Le style vit sur l'image : le nom du modèle garde sa ligne pour lui,
              même quand l'étiquette est longue (« Chronographe sport »). */}
          <Pill className="absolute left-4 top-4 z-10 border-transparent bg-panel/80 text-fg backdrop-blur-sm">
            {modele.styleLabel}
          </Pill>
          {/* Élément partagé : au clic, cette montre est la même que celle de
              la fiche — elle s'y déplace et grandit au lieu de disparaître. */}
          <ViewTransition name={`montre-${modele.slug}`} share="morph" default="none">
            <div className="relative transition-transform duration-(--d-long) ease-atelier group-hover:scale-[1.035] group-focus-within:scale-[1.035]">
            {differe ? (
              <MontreDifferee
                id={`carte-${modele.slug}`}
                render={base.render}
                detail="compact"
                label={intitule}
                className="h-auto w-full"
              />
            ) : (
              <MontreCliente
                id={`carte-${modele.slug}`}
                render={base.render}
                detail={priorite ? "full" : "compact"}
                label={intitule}
                className="h-auto w-full"
              />
            )}
            {/* Le second coloris ne se voit qu'au survol : il n'est dessiné, côté
                client, qu'à la première intention sur la carte. */}
            <SecondColoris id={`carte-alt-${modele.slug}`} render={variante.render} detail="compact" label="" />
            </div>
          </ViewTransition>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          {niveau === 2 ? (
            <h2 className="type-title-2 text-fg">{modele.name}</h2>
          ) : (
            <h3 className="type-title-2 text-fg">{modele.name}</h3>
          )}
          <IconFleche className="fleche-glisse shrink-0 text-accent-ink opacity-0 transition-opacity duration-(--d-base) ease-atelier group-hover:opacity-100 group-focus-within:opacity-100" />
        </div>

        <p className="type-body mt-1.5 text-fg-soft">{modele.tagline}</p>

        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
          <div className="flex gap-2">
            <dt className="sr-only">Diamètre</dt>
            <dd className="type-mono text-fg-soft">{modele.diameterMm} mm</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Calibre</dt>
            <dd className="type-mono text-fg-soft">{base.render.movement}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">Étanchéité</dt>
            <dd className="type-mono text-fg-soft">{modele.waterResistM} m</dd>
          </div>
        </dl>

        <p className="mt-4 flex flex-wrap items-center gap-3">
          <span className="type-ui text-fg" data-numeric>
            À partir de {formatPrice(modele.basePriceCents)}
          </span>
          <SamplePill />
        </p>
      </Link>
    </article>
  );
}
