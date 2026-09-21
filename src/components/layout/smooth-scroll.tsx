"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Défilement doux, sur les pages de vitrine uniquement.
 *
 * Volontairement absent du CRM : un tableau de commandes doit répondre au doigt,
 * pas glisser. Absent du configurateur pour la même raison : c'est un outil de
 * travail. Lenis fait défiler depuis le fil principal ; or chaque option choisie
 * y redessine la montre (plusieurs centaines de millisecondes). Pendant ce
 * temps le défilement se figeait, puis rattrapait son retard d'un bond, et
 * continuait de glisser plus d'une seconde après le dernier cran de molette —
 * la colonne des options « nageait » à côté de la montre collée. Le défilement
 * natif, lui, vit hors du fil principal : il reste calé sous le doigt.
 *
 * Jamais monté sous `prefers-reduced-motion` — un défilement inertiel est
 * précisément ce que ce réglage demande d'éviter.
 */

let instance: Lenis | null = null;

/** L'instance en cours, ou `null` (configurateur, mouvement réduit, CRM). */
export function lenisCourant(): Lenis | null {
  return instance;
}

/** Pages où le défilement reste natif. */
function defilementNatif(chemin: string): boolean {
  return chemin.startsWith("/composer/");
}

export function SmoothScroll() {
  const chemin = usePathname();
  const actif = !defilementNatif(chemin ?? "");

  useEffect(() => {
    if (!actif) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      wheelMultiplier: 0.9,
      // Les ancres (« Aller au contenu », « #modeles ») passent par Lenis : une
      // seule animation, au lieu du lissage CSS et du sien l'un sur l'autre.
      anchors: true,
      // Un clic sur un lien coupe l'élan : sinon la page suivante arrivait en
      // train de glisser vers la cible de la précédente.
      stopInertiaOnNavigate: true,
      // Dialogues (panier, zoom) et volet mobile défilent nativement : sans cela
      // Lenis avalait la molette et faisait défiler la page derrière eux.
      prevent: (noeud) => noeud.matches("dialog, .volet, [data-defilement-natif]"),
    });
    instance = lenis;

    let frame = 0;
    const boucle = (temps: number) => {
      lenis.raf(temps);
      frame = requestAnimationFrame(boucle);
    };
    frame = requestAnimationFrame(boucle);

    // Un dialogue modal ouvert : le fond ne bouge plus du tout (la règle
    // `html:has(dialog[open])` de globals.css le verrouille aussi sans Lenis).
    const suivreDialogues = () => {
      if (document.querySelector("dialog[open]")) lenis.stop();
      else lenis.start();
    };
    const observateur = new MutationObserver(suivreDialogues);
    observateur.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });
    suivreDialogues();

    return () => {
      observateur.disconnect();
      cancelAnimationFrame(frame);
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, [actif]);

  return null;
}
