import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconFleche } from "@/components/ui/icons";
import { DefileFiche, DefileModeles, DefileScene, LienComposerModele, type ModeleDefile } from "./defile-modeles";
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
 *
 * La montre n'est plus seule : toute la collection défile (`defile-modeles.tsx`).
 * Ce composant reste côté serveur et prépare, pour chaque modèle, son rendu de
 * départ ; le défilé commence par la vedette, rendue dans le HTML initial.
 */
export function Hero({
  catalogue,
  modeles,
  vedette,
}: {
  catalogue: Catalogue;
  modeles: WatchModelView[];
  vedette: WatchModelView;
}) {
  const vues = modeles.map((modele) => vueDefile(catalogue, modele));
  const depart = Math.max(
    0,
    modeles.findIndex((modele) => modele.slug === vedette.slug),
  );

  return (
    <DefileModeles modeles={vues} depart={depart}>
      <section
        data-theme="night"
        className="scene-nuit relative -mt-16 overflow-hidden pt-16 text-fg md:-mt-20 md:pt-20"
        style={{ paddingInline: "var(--gutter)" }}
        aria-labelledby="titre-accueil"
      >
        <div className="mx-auto grid max-w-wide gap-x-10 gap-y-8 pb-10 pt-8 lg:min-h-[min(calc(100svh-5rem),46rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:grid-rows-[1fr_auto] lg:items-center lg:pb-0 lg:pt-4">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-2">
            {/* Chaque ligne sort de son masque, l'une après l'autre (`.ligne-titre`). */}
            <h1 id="titre-accueil" className="type-display-1">
              <span className="ligne-titre" style={rang(0)}>
                Vous composez
              </span>
              <br />
              <span className="ligne-titre" style={rang(1)}>
                la montre.
              </span>
              <br />
              <span className="ligne-titre text-accent-ink" style={rang(2)}>
                Je l&apos;assemble,
              </span>
              <br />
              <span className="ligne-titre" style={rang(3)}>
                pièce par pièce.
              </span>
            </h1>
          </div>

          <div className="entree-montre lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <DefileScene graduation={<Graduation />} />
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
              <LienComposerModele />
              <ButtonLink href="/collection" variant="discret">
                Voir la collection
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Fiche de la pièce photographiée : ce que l'on regarde, et son prix. */}
        <div className="entree-texte mx-auto max-w-wide border-t border-rule" style={rang(3)}>
          <DefileFiche />
        </div>
      </section>
    </DefileModeles>
  );
}

/** Ce que le défilé a besoin de savoir d'un modèle : de quoi le dessiner et remplir sa fiche. */
function vueDefile(catalogue: Catalogue, modele: WatchModelView): ModeleDefile {
  const { render } = defaultConfiguration(catalogue, modele);
  return {
    slug: modele.slug,
    name: modele.name,
    styleLabel: modele.styleLabel,
    diameterMm: modele.diameterMm,
    waterResistM: modele.waterResistM,
    // Le VK64 est un méca-quartz : l'annoncer « automatique » serait faux.
    movement: render.movement === "VK64" ? "VK64 méca-quartz" : `${render.movement} automatique`,
    basePriceCents: modele.basePriceCents,
    priceLabel: formatPrice(modele.basePriceCents),
    isSample: modele.isSample,
    render,
    label: `${modele.name} : ${modele.tagline}`,
  };
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
      className="entree-graduation pointer-events-none absolute inset-0 size-full scale-[1.08] text-accent-ink"
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
