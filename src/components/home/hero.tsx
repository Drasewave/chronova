import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { WatchModelView } from "@/lib/data/models";
import { formatPrice } from "@/lib/utils";

/**
 * Héros.
 *
 * L'ordre du DOM est l'ordre de lecture sur petit écran : titre, montre, puis
 * promesse et bouton. En grand écran, la grille replace la montre à droite sur
 * deux rangées — sans jamais recourir à `order`, qui aurait désolidarisé
 * l'ordre visuel de l'ordre au clavier et au lecteur d'écran.
 */
export function Hero({ catalogue, vedette }: { catalogue: Catalogue; vedette: WatchModelView }) {
  const configuration = defaultConfiguration(catalogue, vedette);

  return (
    <section
      className="border-b border-rule bg-bg"
      style={{ paddingInline: "var(--gutter)", paddingBlock: "clamp(32px, 5vw, 80px)" }}
      aria-labelledby="titre-accueil"
    >
      <div className="mx-auto grid max-w-content gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.02fr] lg:items-center">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="type-mono surtitre text-fg-soft">Atelier indépendant · Assemblage à la main</p>
          <h1 id="titre-accueil" className="type-display-1 mt-6 text-balance">
            Vous composez la montre.
            <br />
            Je l&apos;assemble, pièce par pièce.
          </h1>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className="scene-montre mx-auto w-[min(88%,34rem)] lg:w-[min(100%,35rem)]">
            <Graduation />
            <InteractiveWatch
              id="hero"
              render={configuration.render}
              label={`${vedette.name} : cadran bleu abysse soleillé, lunette de plongée à insert céramique, bracelet acier trois maillons`}
              className="w-full"
            />
          </div>

          <dl className="mx-auto mt-12 grid max-w-[34rem] grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-6 sm:grid-cols-4">
            <Spec terme="Modèle" valeur={vedette.name} />
            <Spec terme="Boîtier" valeur={`${vedette.diameterMm} mm`} />
            <Spec terme="Étanchéité" valeur={`${vedette.waterResistM} m`} />
            <Spec terme="Calibre" valeur={configuration.render.movement} />
          </dl>

          <p className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="type-caption text-fg-soft" data-numeric>
              À partir de {formatPrice(vedette.basePriceCents)}
            </span>
            <SamplePill />
          </p>
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <p className="type-lead measure text-fg-soft">
            Quatre bases mécaniques. Vous choisissez le cadran, les aiguilles, la lunette, le
            bracelet ; je commande les pièces, je monte, je règle, et je laisse la montre tourner
            soixante-douze heures avant de l&apos;expédier.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ButtonLink href="/composer">
              Composer ma montre
              <IconFleche className="fleche-glisse" />
            </ButtonLink>
            <ButtonLink href="/collection" variant="discret">
              Voir les quatre modèles
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Couronne graduée derrière la montre : soixante traits, un plus long toutes
 * les cinq minutes. Purement décorative, elle reprend la minuterie du cadran.
 */
function Graduation() {
  return (
    <svg
      viewBox="0 0 1000 1000"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 -z-10 size-full scale-[1.1] text-accent-decor"
    >
      <circle cx="500" cy="500" r="478" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="500"
          y1={i % 5 === 0 ? 34 : 40}
          x2="500"
          y2="52"
          stroke="currentColor"
          strokeOpacity={i % 5 === 0 ? 0.75 : 0.4}
          strokeWidth={i % 5 === 0 ? 2 : 1}
          transform={`rotate(${i * 6} 500 500)`}
        />
      ))}
    </svg>
  );
}

function Spec({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="text-center">
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="type-mono mt-1.5 text-fg">{valeur}</dd>
    </div>
  );
}
