"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

/** Ordre physique des vues : on retourne la montre de la face vers le dos. */
const ORDRE: Record<WatchView, number> = { face: 0, profil: 1, dos: 2 };

const DUREE_SORTIE = 230;
const DUREE_ENTREE = 290;
/** Miroir de `--ease` : la sortie accélère, l'entrée (`--ease`) se pose. */
const EASE_SORTIE = "cubic-bezier(0.7, 0, 0.84, 0)";
const EASE_ENTREE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Transition entre deux vues d'une montre : l'objet pivote comme on le retourne
 * dans la main.
 *
 *   face ↔ dos      rotation autour de l'axe vertical (`rotateY`)
 *   ↔ profil        bascule autour de l'axe horizontal (`rotateX`)
 *
 * L'ancienne vue sort jusqu'à 90°, où elle n'a plus d'épaisseur ; la nouvelle
 * entre depuis −90°. La substitution a lieu sur la tranche, sous un léger flou
 * assombri : une seule vue est donc montée à la fois, l'enfant n'est jamais
 * remonté (un `InteractiveWatch` garde ses écouteurs et son reflet), et la
 * hauteur du cadre ne peut pas sauter. 520 ms en tout.
 *
 * `children` reçoit la vue À AFFICHER, qui retarde d'une demi-transition sur la
 * prop `vue` :
 *
 *   <VueMontre vue={vue}>{(v) => <WatchSvg view={v} … />}</VueMontre>
 *
 * Sous `prefers-reduced-motion`, la substitution est immédiate.
 */
export function VueMontre({
  vue,
  children,
  className,
  carre = false,
}: {
  vue: WatchView;
  children: (vueAffichee: WatchView) => ReactNode;
  className?: string;
  /** Réserve un carré (les rendus font 1000 × 1000) quand le parent ne borne rien. */
  carre?: boolean;
}) {
  const [affichee, setAffichee] = useState<WatchView>(vue);
  const afficheeRef = useRef<WatchView>(vue);
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const depart = afficheeRef.current;
    if (vue === depart) return;

    const noeud = boite.current;
    const poser = () => {
      afficheeRef.current = vue;
      setAffichee(vue);
    };

    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!noeud || calme || typeof noeud.animate !== "function") {
      poser();
      return;
    }

    const axe = depart === "profil" || vue === "profil" ? "rotateX" : "rotateY";
    const sens = ORDRE[vue] > ORDRE[depart] ? 1 : -1;
    const pose = (angle: number) => `perspective(1100px) ${axe}(${angle}deg)`;
    const net = "blur(0px) brightness(1)";
    const voile = "blur(3px) brightness(0.55)";

    let annule = false;
    let entree: Animation | undefined;
    const sortie = noeud.animate(
      [
        { transform: pose(0), filter: net },
        { transform: pose(90 * sens), filter: voile },
      ],
      { duration: DUREE_SORTIE, easing: EASE_SORTIE, fill: "forwards" },
    );

    sortie.finished
      .then(() => {
        if (annule) return;
        // La vue change pendant que l'objet est sur la tranche, invisible.
        flushSync(poser);
        entree = noeud.animate(
          [
            { transform: pose(-90 * sens), filter: voile },
            { transform: pose(0), filter: net },
          ],
          { duration: DUREE_ENTREE, easing: EASE_ENTREE },
        );
        sortie.cancel();
      })
      // `cancel()` rejette `finished` : c'est l'interruption prévue, pas une erreur.
      .catch(() => {});

    return () => {
      annule = true;
      sortie.cancel();
      entree?.cancel();
    };
  }, [vue]);

  return (
    <div ref={boite} className={cn(carre && "aspect-square", className)} data-vue={affichee}>
      {children(affichee)}
    </div>
  );
}
