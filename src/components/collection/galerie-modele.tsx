"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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
 * fait que choisir lequel montrer. Les vues sont superposées et se relaient en
 * fondu ; sous `prefers-reduced-motion`, le changement est immédiat.
 */
export function GalerieModele({ vues, nom }: { vues: VueGalerie[]; nom: string }) {
  const [active, setActive] = useState(vues[0]?.cle);

  return (
    // Sur grand écran les vignettes passent en colonne à gauche de la grande vue :
    // la galerie entière tient alors dans la hauteur d'un écran. L'ordre du DOM
    // ne change pas — la vue, puis de quoi en changer.
    <div className="mx-auto w-full max-w-[36rem] lg:grid lg:max-w-none lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start lg:gap-4">
      <div className="cadre-montre relative aspect-square overflow-hidden lg:col-start-2 lg:row-start-1">
        {vues.map((vue) => {
          const visible = vue.cle === active;
          return (
            <div
              key={vue.cle}
              aria-hidden={visible ? undefined : true}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-atelier motion-reduce:transition-none",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {vue.grande}
            </div>
          );
        })}
      </div>

      <div role="group" aria-label={`${nom} : changer de vue`} className="mt-3 grid grid-cols-4 gap-3 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:grid-cols-1">
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
                  "cadre-montre block aspect-square overflow-hidden border transition-colors duration-200",
                  visible ? "border-gold" : "border-rule group-hover/vignette:border-fg",
                )}
              >
                {vue.vignette}
              </span>
              <span className={cn("type-mono mt-2 block", visible ? "text-fg" : "text-fg-soft")}>
                {vue.titre}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
