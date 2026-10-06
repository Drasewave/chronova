"use client";

import { useCallback, useState, type CSSProperties, type ReactNode } from "react";
import { FonduStudio } from "@/components/motion/vue-montre";
import { MontreCliente } from "@/components/ui/montre-differee";
import type { WatchRender, WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

const VUES_OBJET: readonly string[] = ["profil", "dos"] satisfies WatchView[];
const LIBELLE: Partial<Record<string, string>> = { profil: "de profil", dos: "de dos" };

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
 * objet ; profil et dos sont dessinés côté client à partir de `render`, dans
 * leur vue statique habituelle (jamais la vue projetée de la platine tournante,
 * qui rogne le bracelet pour laisser tourner l'objet) — la vue de face rendue
 * par le serveur reste celle transmise dans `vues`. Les autres vues
 * (« Cadran ») sont des gros plans fixes, déjà rendus.
 * Toutes passent par le même fondu de studio (`FonduStudio`), sans rotation.
 * Le repère de la vignette active est un seul cadre qui glisse de l'une à
 * l'autre.
 */
export function GalerieModele({ vues, nom, render }: { vues: VueGalerie[]; nom: string; render?: WatchRender }) {
  const [active, setActive] = useState(vues[0]?.cle);

  const rendreVue = useCallback(
    (cle: string) => {
      if (cle === "face") return vues.find((vue) => vue.cle === "face")?.grande;
      if (render && VUES_OBJET.includes(cle)) {
        return <MontreCliente id={`galerie-${cle}`} render={render} view={cle as WatchView} label={`${nom}, vue ${LIBELLE[cle] ?? cle}`} className="block h-full w-full" />;
      }
      return vues.find((vue) => vue.cle === cle)?.grande;
    },
    [vues, render, nom],
  );

  return (
    // Sur grand écran les vignettes passent en colonne à gauche de la grande vue :
    // la galerie entière tient alors dans la hauteur d'un écran. L'ordre du DOM
    // ne change pas — la vue, puis de quoi en changer.
    <div className="mx-auto w-full max-w-[36rem] lg:grid lg:max-w-none lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start lg:gap-4">
      <div className="cadre-montre relative aspect-square overflow-hidden lg:col-start-2 lg:row-start-1">
        {active && (
          <FonduStudio cle={active} className="h-full w-full" classeCouche="h-full w-full">
            {rendreVue}
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
              onClick={() => setActive(vue.cle)}
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
