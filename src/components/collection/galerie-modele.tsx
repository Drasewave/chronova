"use client";

import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FonduStudio } from "@/components/motion/vue-montre";
import { PlatineMontre, type CommandesPlatine } from "@/components/motion/platine-montre";
import { MontreCliente } from "@/components/ui/montre-differee";
import type { WatchRender, WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

/** Les vues qui sont des faces de l'objet : elles se relaient en tournant. */
const VUES_PLATINE: readonly string[] = ["face", "profil", "dos"] satisfies WatchView[];

export interface VueGalerie {
  cle: string;
  /** Libellé de la vignette : « Face », « Profil »… */
  titre: string;
  /** Grande vue et vignette, rendues côté serveur et transmises telles quelles. */
  grande: ReactNode;
  vignette: ReactNode;
}

/**
 * Galerie d'une fiche modèle : une grande vue, des vignettes pour en changer.
 *
 * Le composant ne dessine rien : les SVG arrivent déjà rendus du serveur, il ne
 * fait que choisir lequel montrer. Face, profil et dos sont les faces d'un même
 * objet : ils vivent sur la platine tournante du configurateur
 * (`PlatineMontre`), qu'on manipule du doigt ; leurs vignettes la font tourner
 * jusqu'à la vue voulue et reflètent celle où elle s'est calée. La platine
 * dessine la montre sous chaque angle à partir de `render` (vue projetée) ; la
 * vue de face rendue par le serveur reste celle de la pose 0. Les autres vues
 * (« Cadran ») sont des gros plans fixes : on y passe par le fondu de studio
 * (`FonduStudio`). Le repère de la vignette active est un seul cadre qui glisse
 * de l'une à l'autre.
 */
export function GalerieModele({ vues, nom, render }: { vues: VueGalerie[]; nom: string; render?: WatchRender }) {
  const [active, setActive] = useState(vues[0]?.cle);
  // La dernière vue montrée par la platine : c'est d'elle qu'elle repart
  // quand on revient d'un gros plan.
  const [vuePlatine, setVuePlatine] = useState<WatchView>("face");
  const platine = useRef<CommandesPlatine>(null);
  const tournante = render !== undefined && vues.filter((vue) => VUES_PLATINE.includes(vue.cle)).length >= 2;
  const surPlatine = tournante && active !== undefined && VUES_PLATINE.includes(active);

  const rendreVue = useCallback(
    (cle: WatchView, yaw: number) => {
      const face = vues.find((vue) => vue.cle === "face")?.grande;
      if (yaw === 0 && face) return face;
      if (!render) return vues.find((vue) => vue.cle === cle)?.grande;
      return <MontreCliente id={`galerie-${yaw}`} render={render} view={cle} yaw={yaw} label={`${nom}, tournée de ${yaw} degrés`} className="block h-full w-full" />;
    },
    [vues, render, nom],
  );
  const surVue = useCallback((vue: WatchView) => {
    setVuePlatine(vue);
    setActive(vue);
  }, []);
  const choisir = (cle: string) => {
    if (tournante && VUES_PLATINE.includes(cle)) {
      setVuePlatine(cle as WatchView);
      // Déjà sur la platine : elle tourne. Sinon elle revient, déjà sur la vue.
      if (surPlatine) platine.current?.montrer(cle as WatchView);
    }
    setActive(cle);
  };

  return (
    // Sur grand écran les vignettes passent en colonne à gauche de la grande vue :
    // la galerie entière tient alors dans la hauteur d'un écran. L'ordre du DOM
    // ne change pas — la vue, puis de quoi en changer.
    <div className="mx-auto w-full max-w-[36rem] lg:grid lg:max-w-none lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start lg:gap-4">
      <div className="cadre-montre relative aspect-square overflow-hidden lg:col-start-2 lg:row-start-1">
        {active && (
          <FonduStudio cle={surPlatine ? "platine" : active} className="h-full w-full" classeCouche="h-full w-full">
            {(cle) =>
              cle === "platine" ? (
                <PlatineMontre
                  vue={vuePlatine}
                  surVue={surVue}
                  commandes={platine}
                  render={render}
                  libelle={`${nom} : montre à faire tourner`}
                  className="h-full w-full"
                  classeCouche="h-full w-full"
                >
                  {rendreVue}
                </PlatineMontre>
              ) : (
                vues.find((vue) => vue.cle === cle)?.grande
              )
            }
          </FonduStudio>
        )}
      </div>

      <div role="group" aria-label={`${nom} : changer de vue`} className="relative mt-3 grid grid-cols-4 gap-3 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:grid-cols-1">
        {vues.map((vue) => {
          const visible = vue.cle === active;
          return (
            <button
              key={vue.cle}
              type="button"
              aria-pressed={visible}
              onClick={() => choisir(vue.cle)}
              className="group/vignette block text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
            >
              <span
                className={cn(
                  "cadre-montre block aspect-square overflow-hidden border border-rule transition-colors duration-(--d-base) ease-atelier",
                  !visible && "group-hover/vignette:border-fg",
                )}
              >
                {vue.vignette}
              </span>
              <span
                className={cn(
                  "type-mono mt-2 block transition-colors duration-(--d-base) ease-atelier",
                  visible ? "text-fg" : "text-fg-soft",
                )}
              >
                {vue.titre}
              </span>
            </button>
          );
        })}
        {/* Le repère de la vue active : un seul cadre, qui glisse de vignette en
            vignette — en ligne sur téléphone, en colonne sur grand écran. */}
        <span
          aria-hidden="true"
          className="rail-repere"
          data-axe-lg="y"
          style={
            {
              "--n": vues.length,
              "--i": Math.max(0, vues.findIndex((vue) => vue.cle === active)),
              "--ecart": "0.75rem",
            } as CSSProperties
          }
        >
          <span className="rounded-card border border-accent-ink" />
        </span>
      </div>
    </div>
  );
}
