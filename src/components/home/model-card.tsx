import Link from "next/link";
import { Pill, SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import type { WatchModelView } from "@/lib/data/models";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import { formatPrice } from "@/lib/utils";

/**
 * Carte de modèle. Au survol, la montre pivote de 3°, un reflet traverse le
 * verre et le second coloris apparaît en fondu — trois indices que la montre
 * est configurable, sans une ligne de texte de plus.
 */
export function ModelCard({
  catalogue,
  modele,
  priorite = false,
}: {
  catalogue: Catalogue;
  modele: WatchModelView;
  priorite?: boolean;
}) {
  const base = defaultConfiguration(catalogue, modele);
  const variante = altConfiguration(catalogue, modele);

  return (
    <article className="carte-montre group">
      <Link
        href={`/collection/${modele.slug}`}
        className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
      >
        <div className="relative overflow-hidden rounded-card border border-rule bg-bg-alt p-5 transition-colors duration-300 ease-atelier group-hover:border-accent-decor">
          <div className="relative transition-transform duration-[450ms] ease-atelier group-hover:rotate-3">
            <WatchSvg
              id={`carte-${modele.slug}`}
              render={base.render}
              detail={priorite ? "full" : "compact"}
              label={`${modele.name}, ${modele.styleLabel.toLowerCase()}, ${modele.diameterMm} millimètres`}
              className="h-auto w-full"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-0 transition-opacity duration-[350ms] ease-atelier group-hover:opacity-100"
            >
              <WatchSvg
                id={`carte-alt-${modele.slug}`}
                render={variante.render}
                detail="compact"
                label=""
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h3 className="type-title-2 text-fg">{modele.name}</h3>
          <Pill>{modele.styleLabel}</Pill>
        </div>

        <p className="type-body mt-2 text-fg-soft">{modele.tagline}</p>

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
