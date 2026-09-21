"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { INTRO_STYLE_SELECTOR } from "./intro-boot";

declare global {
  interface Window {
    /** Posé par `INTRO_BOOT` quand le rideau doit être sauté. */
    __chronovaIntro?: "off";
  }
}

const NOM = "CHRONOVA";

/** Le volet a fini de se lever à 1 400 ms ; marge pour une hydratation tardive. */
const SECOURS_RIDEAU_MS = 2000;
/** Dernière entrée du héros terminée (≈ 2 300 ms) : le retard peut être retiré. */
const FIN_CHOREGRAPHIE_MS = 2800;

/**
 * Retire la feuille posée par `INTRO_BOOT` : le rideau retombe à `display:none`
 * et `--entree-retard` disparaît. Sans ce ménage, un retour à l'accueil par
 * navigation interne rejouerait l'entrée du héros avec une seconde de vide.
 */
function retirerRetard() {
  const feuille = document.querySelector(INTRO_STYLE_SELECTOR);
  if (feuille) feuille.textContent = "";
}

/**
 * Rideau d'entrée. Sur la nuit, le nom s'écrit lettre à lettre, un filet bleu se
 * trace dessous, puis le volet se lève et découvre le héros qui entre au même
 * moment (montre, aiguilles, titre, cascade : voir « Ouverture » dans
 * globals.css). 1,4 s du premier pixel au volet levé.
 *
 * Toute l'animation est en CSS : elle part à la première image, avant
 * l'hydratation. Ce composant ne fait que l'intendance — verrou du défilement,
 * clé de session, bouton « Passer », démontage. Joué une seule fois par
 * session, jamais sous `prefers-reduced-motion`, jamais sans JavaScript (le
 * rideau est caché par défaut, voir `intro-boot.ts`).
 */
export function IntroCurtain() {
  const [fini, setFini] = useState(false);
  const racine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.__chronovaIntro === "off") {
      setFini(true);
      return;
    }

    const noeud = racine.current;
    if (!noeud) return;

    document.body.style.overflow = "hidden";
    try {
      sessionStorage.setItem("chronova:intro", "vu");
    } catch {
      // Stockage refusé (navigation privée stricte) : le rideau rejouera, sans plus.
    }

    const terminer = () => {
      document.body.style.overflow = "";
      setFini(true);
    };

    const surFin = (event: AnimationEvent) => {
      if (event.target === noeud && event.animationName === "intro-leve") terminer();
    };
    noeud.addEventListener("animationend", surFin);

    // Hydratation tardive : le volet est peut-être déjà levé.
    const dejaLeve = noeud
      .getAnimations?.()
      .some((a) => (a as CSSAnimation).animationName === "intro-leve" && a.playState === "finished");
    if (dejaLeve) terminer();

    const secours = window.setTimeout(terminer, SECOURS_RIDEAU_MS);
    const menage = window.setTimeout(retirerRetard, FIN_CHOREGRAPHIE_MS);

    return () => {
      noeud.removeEventListener("animationend", surFin);
      window.clearTimeout(secours);
      window.clearTimeout(menage);
      document.body.style.overflow = "";
      // Démontage réel (pas le double passage du mode strict, qui laisse le
      // nœud en place) : le retard ne doit pas survivre au rideau.
      window.setTimeout(() => {
        if (!noeud.isConnected) retirerRetard();
      }, 0);
    };
  }, []);

  // L'effet vit aussi longtemps que le composant, pas que le rideau : `menage`
  // court toujours et retirera le retard une fois le héros posé.
  if (fini) return null;

  return (
    <div
      ref={racine}
      className="intro-curtain fixed inset-0 z-[100]"
      role="presentation"
    >
      <div className="intro-nom flex flex-col items-center gap-5" aria-hidden="true">
        <p
          className="text-[clamp(1.375rem,4.4vw,2.5rem)] font-light leading-none text-[var(--color-nuit-encre)]"
          style={{ fontFamily: "var(--font-title)", letterSpacing: "0.42em", paddingLeft: "0.42em" }}
        >
          {NOM.split("").map((lettre, i) => (
            <span key={i} className="intro-lettre" style={{ "--i": i } as CSSProperties}>
              {lettre}
            </span>
          ))}
        </p>
        <span
          className="intro-filet block h-px w-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-bleu-clair), var(--color-bleu-clair) 70%, transparent)",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          // Le héros ne doit pas attendre un volet qui n'existe plus : sans le
          // retard, ses animations reprennent là où l'horloge en est.
          retirerRetard();
          document.body.style.overflow = "";
          setFini(true);
        }}
        // Il ne reste visible qu'une seconde et demie à peine : sa cible doit être
        // franche, d'où les 44 px de hauteur malgré un libellé d'un mot.
        className="type-mono link-underline absolute bottom-6 right-[calc(var(--gutter)-0.75rem)] inline-flex min-h-11 items-center px-3 text-[var(--color-nuit-douce)] hover:text-[var(--color-bleu-clair)]"
      >
        Passer
      </button>
    </div>
  );
}
