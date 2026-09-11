"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Défilement doux, sur le site public uniquement.
 *
 * Volontairement absent du CRM : un tableau de commandes doit répondre au doigt,
 * pas glisser. Et jamais monté sous `prefers-reduced-motion` — un défilement
 * inertiel est précisément ce que ce réglage demande d'éviter.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.05, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    let frame = 0;

    const boucle = (temps: number) => {
      lenis.raf(temps);
      frame = requestAnimationFrame(boucle);
    };
    frame = requestAnimationFrame(boucle);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
