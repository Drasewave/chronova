"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconFleche } from "@/components/ui/icons";

/**
 * Zone qui défile horizontalement, avec deux boutons pour l'avancer d'une
 * colonne.
 *
 * Les navigateurs récents dessinent des barres de défilement en surimpression,
 * qui disparaissent au repos : rien n'indiquerait alors qu'il reste des étapes
 * à droite. Deux boutons de 44 px règlent le problème au doigt comme au
 * clavier, et la zone elle-même reste focalisable pour défiler aux flèches.
 */
export function TableauDefilant({
  label,
  pas = 292,
  children,
}: {
  label: string;
  /** Largeur d'une colonne plus sa gouttière. */
  pas?: number;
  children: ReactNode;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const [bornes, setBornes] = useState({ debut: true, fin: true });

  useEffect(() => {
    const element = zone.current;
    if (!element) return;

    const mesurer = () => {
      const reste = element.scrollWidth - element.clientWidth;
      setBornes({
        debut: element.scrollLeft <= 1,
        // Une marge d'un pixel : les largeurs fractionnaires ne tombent jamais juste.
        fin: element.scrollLeft >= reste - 1,
      });
    };

    mesurer();
    element.addEventListener("scroll", mesurer, { passive: true });
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(element);
    return () => {
      element.removeEventListener("scroll", mesurer);
      observateur.disconnect();
    };
  }, []);

  const glisser = (sens: 1 | -1) => {
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    zone.current?.scrollBy({ left: sens * pas, behavior: doux ? "smooth" : "auto" });
  };

  return (
    <div>
      {/* `scroll-px-*` aligne l'accrochage sur la gouttière : sans lui, la
          première colonne viendrait coller le bord de l'écran. */}
      <div className="mb-3 flex justify-end gap-2">
        <Bouton sens={-1} libelle="Colonnes précédentes" inactif={bornes.debut} action={glisser} />
        <Bouton sens={1} libelle="Colonnes suivantes" inactif={bornes.fin} action={glisser} />
      </div>

      <div
        ref={zone}
        tabIndex={0}
        role="group"
        aria-label={label}
        className="defilement-atelier -mx-4 overflow-x-auto scroll-px-4 px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {children}
      </div>
    </div>
  );
}

function Bouton({
  sens,
  libelle,
  inactif,
  action,
}: {
  sens: 1 | -1;
  libelle: string;
  inactif: boolean;
  action: (sens: 1 | -1) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => action(sens)}
      disabled={inactif}
      aria-label={libelle}
      className="inline-flex size-11 items-center justify-center rounded-field border border-rule text-fg transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:border-rule disabled:text-fg-soft disabled:hover:border-rule disabled:hover:text-fg-soft"
    >
      <IconFleche className={sens === -1 ? "rotate-180" : undefined} />
    </button>
  );
}
