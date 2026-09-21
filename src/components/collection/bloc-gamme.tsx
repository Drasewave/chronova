import Link from "next/link";
import { IconFleche } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { GammeVue } from "@/lib/content/gammes";
import { cn, formatPrice } from "@/lib/utils";

function compte(gamme: GammeVue): string {
  return `${gamme.modeles.length} modèle${gamme.modeles.length > 1 ? "s" : ""}`;
}

const FOCUS =
  "rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]";

/**
 * Grand bloc d'une gamme sur la page Collection : la montre phare sur son fond
 * de studio, le nom, une phrase, le nombre de modèles et le premier prix. Tout
 * le bloc est un seul lien vers la page de la gamme.
 */
export function BlocGamme({
  catalogue,
  gamme,
  className,
}: {
  catalogue: Catalogue;
  gamme: GammeVue;
  className?: string;
}) {
  const { render } = defaultConfiguration(catalogue, gamme.phare);

  return (
    <article className={cn("group", className)}>
      <Link href={gamme.href} className={cn("block", FOCUS)}>
        <div className="cadre-montre relative aspect-[4/3] overflow-hidden sm:aspect-[16/10]">
          <WatchSvg
            id={`gamme-${gamme.style}`}
            render={render}
            label={`${gamme.phare.name}, montre phare de la gamme ${gamme.nom}`}
            className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-atelier group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <h2 className="type-title-1 text-fg">{gamme.nom}</h2>
          <IconFleche className="fleche-glisse shrink-0 text-gold" />
        </div>
        <p className="type-body mt-2 text-fg-soft">{gamme.contenu.phrase}</p>

        <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="type-mono text-fg-soft">{compte(gamme)}</span>
          <span className="type-ui text-fg" data-numeric>
            À partir de {formatPrice(gamme.prixMinCents)}
          </span>
          <SamplePill />
        </p>
      </Link>
    </article>
  );
}

/** Version compacte : les « autres gammes » au pied d'une page de gamme. */
export function TuileGamme({ catalogue, gamme }: { catalogue: Catalogue; gamme: GammeVue }) {
  const { render } = defaultConfiguration(catalogue, gamme.phare);

  return (
    <Link href={gamme.href} className={cn("group block", FOCUS)}>
      <div className="cadre-montre relative aspect-square overflow-hidden">
        <WatchSvg
          id={`tuile-gamme-${gamme.style}`}
          render={render}
          detail="compact"
          label=""
          className="absolute inset-0 h-full w-full transition-transform duration-[900ms] ease-atelier group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      </div>
      <h3 className="type-title-2 mt-4 text-fg transition-colors duration-200 group-hover:text-gold">
        {gamme.nom}
      </h3>
      <p className="type-mono mt-1.5 text-fg-soft">{compte(gamme)}</p>
    </Link>
  );
}
