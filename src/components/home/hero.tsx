import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { WatchModelView } from "@/lib/data/models";
import { formatPrice } from "@/lib/utils";

const rang = (n: number) => ({ "--rang": n }) as CSSProperties;

/**
 * Héros : la scène nuit.
 *
 * La montre est photographiée sur un cyclorama sombre, là où l'acier prend
 * toute sa dynamique ; l'en-tête flotte dessus tant que la page n'a pas défilé
 * (d'où la marge négative qui glisse la scène sous lui).
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
      data-theme="night"
      className="scene-nuit relative -mt-16 overflow-hidden pt-16 text-fg md:-mt-20 md:pt-20"
      style={{ paddingInline: "var(--gutter)" }}
      aria-labelledby="titre-accueil"
    >
      <div className="mx-auto grid max-w-wide gap-x-10 gap-y-8 pb-10 pt-8 lg:min-h-[min(calc(100svh-5rem),54rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:grid-rows-[1fr_auto] lg:items-center lg:pb-0 lg:pt-4">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-2">
          <h1 id="titre-accueil" className="type-display-1 entree-texte" style={rang(0)}>
            Vous composez
            <br />
            la montre.
            <br />
            <span className="text-gold">Je l&apos;assemble,</span>
            <br />
            pièce par pièce.
          </h1>
        </div>

        <div className="entree-montre lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className="relative mx-auto w-[min(92%,30rem)] lg:w-[min(100%,46rem)]">
            <Graduation />
            <InteractiveWatch
              id="hero"
              render={configuration.render}
              label={`${vedette.name} : cadran bleu abysse soleillé, lunette de plongée à insert céramique, bracelet acier trois maillons`}
              className="w-full"
            />
          </div>
        </div>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start lg:pb-16">
          <p className="type-lead measure entree-texte max-w-[44ch] text-fg-soft" style={rang(1)}>
            Vous partez de l&apos;un des modèles de la collection, puis vous choisissez le cadran,
            les aiguilles, la lunette et le bracelet. Je commande les pièces, j&apos;assemble et je
            règle la montre, puis je la laisse tourner soixante-douze heures avant de
            l&apos;expédier.
          </p>

          <div className="entree-texte mt-9 flex flex-wrap items-center gap-x-7 gap-y-4" style={rang(2)}>
            <ButtonLink href="/composer">
              Composer ma montre
              <IconFleche className="fleche-glisse" />
            </ButtonLink>
            <ButtonLink href="/collection" variant="discret">
              Voir la collection
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Fiche de la pièce photographiée : ce que l'on regarde, et son prix. */}
      <div className="entree-texte mx-auto max-w-wide border-t border-rule" style={rang(3)}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 py-6 sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <Spec terme="Modèle" valeur={vedette.name} />
          <Spec terme="Boîtier" valeur={`${vedette.diameterMm} mm, acier 316L`} />
          <Spec terme="Étanchéité" valeur={`${vedette.waterResistM} m`} />
          <Spec terme="Calibre" valeur={`${configuration.render.movement} automatique`} />
          <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-1 lg:justify-end">
            <dt className="sr-only">Prix</dt>
            <dd className="type-title-2 text-fg" data-numeric>
              À partir de {formatPrice(vedette.basePriceCents)}
            </dd>
            <SamplePill />
          </div>
        </dl>
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
      className="pointer-events-none absolute inset-0 -z-10 size-full scale-[1.08] text-gold"
    >
      <circle cx="500" cy="500" r="478" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1" />
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i}
          x1="500"
          y1={i % 5 === 0 ? 30 : 40}
          x2="500"
          y2="50"
          stroke="currentColor"
          strokeOpacity={i % 5 === 0 ? 0.6 : 0.28}
          strokeWidth={i % 5 === 0 ? 1.6 : 1}
          transform={`rotate(${i * 6} 500 500)`}
        />
      ))}
    </svg>
  );
}

function Spec({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div>
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="type-ui mt-1.5 text-fg" data-numeric>
        {valeur}
      </dd>
    </div>
  );
}
