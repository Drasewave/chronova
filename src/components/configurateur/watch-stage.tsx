"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { IconCroix } from "@/components/ui/icons";
import { VueMontre } from "@/components/motion/vue-montre";
import type { WatchRender, WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

const VUES: { key: WatchView; label: string }[] = [
  { key: "face", label: "Face" },
  { key: "profil", label: "Profil" },
  { key: "dos", label: "Dos" },
];

/**
 * Scène de la montre : les trois vues, et le zoom.
 *
 * Changer de vue enchaîne deux prises de studio (`VueMontre`) : l'ancienne
 * recule et s'éteint, la nouvelle se pose, une lumière passe. Le même sélecteur
 * est repris dans le zoom, où il pilote la même vue avec le même fondu.
 *
 * Le zoom utilise l'élément `<dialog>` natif — piégeage du focus, fermeture par
 * Échap et retour du focus au bouton sont gérés par le navigateur, sans une
 * ligne de gestion clavier de notre côté.
 */
export function WatchStage({
  render,
  label,
  className,
}: {
  render: WatchRender;
  label: string;
  className?: string;
}) {
  const [vue, setVue] = useState<WatchView>("face");
  const [zoom, setZoom] = useState(false);
  // Le rendu du zoom reste monté après la première ouverture : il doit encore
  // être là pendant que le dialogue se referme en fondu.
  const [zoomMonte, setZoomMonte] = useState(false);
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const noeud = dialogue.current;
    if (!noeud) return;
    if (zoom && !noeud.open) noeud.showModal();
    if (!zoom && noeud.open) noeud.close();
  }, [zoom]);

  return (
    <div className={className}>
      {/* Sur téléphone, la montre est bornée en HAUTEUR : collée en haut d'un
          écran de 780 px, une montre pleine largeur ne laisserait presque rien
          aux options qui défilent dessous. */}
      <button
        type="button"
        onClick={() => {
          setZoomMonte(true);
          setZoom(true);
        }}
        className="cadre-montre flex h-[27vh] w-full cursor-zoom-in items-center justify-center lg:h-auto lg:p-6"
        aria-label="Agrandir la montre"
      >
        {/* La hauteur doit traverser tous les conteneurs intermédiaires : un div
            en hauteur automatique annulerait le `h-full` du SVG. */}
        <VueMontre
          vue={vue}
          className="h-full w-full"
          classeCouche="flex h-full w-full items-center justify-center"
        >
          {(vueAffichee) => (
            <InteractiveWatch
              // Deux vues coexistent le temps du fondu : chacune a ses propres `id` SVG.
              id={`configurateur-${vueAffichee}`}
              render={render}
              view={vueAffichee}
              label={label}
              className="flex h-full w-full items-center justify-center"
              svgClassName="h-full w-auto lg:h-auto lg:w-full"
            />
          )}
        </VueMontre>
      </button>

      <SelecteurVue vue={vue} surChoix={setVue} className="mt-4" />

      {/* Annonce discrète : le rendu garde le même intitulé d'une vue à l'autre,
          un lecteur d'écran ne saurait pas autrement que l'image a changé. */}
      <p className="sr-only" aria-live="polite">
        Vue affichée : {VUES.find((v) => v.key === vue)?.label}
      </p>

      <dialog
        ref={dialogue}
        onClose={() => setZoom(false)}
        onClick={(event) => {
          if (event.target === dialogue.current) setZoom(false);
        }}
        className="dialogue-anime m-auto max-h-[92dvh] w-[min(92vw,52rem)] rounded-card border border-rule bg-bg p-0 text-fg backdrop:bg-[color-mix(in_srgb,var(--color-nuit)_58%,transparent)]"
      >
        <div className="relative p-4 sm:p-8">
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center text-fg-soft transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink"
            aria-label="Fermer l'agrandissement"
          >
            <IconCroix />
          </button>
          {/* Le carré se borne à la hauteur du dialogue : le sélecteur reste
              visible sans défiler, même sur un écran large et bas. */}
          {zoomMonte && (
            <VueMontre vue={vue} carre className="mx-auto w-full max-w-[calc(92dvh-11rem)]">
              {(vueAffichee) => (
                <WatchSvg id={`zoom-${vueAffichee}`} render={render} view={vueAffichee} label={label} className="h-auto w-full" />
              )}
            </VueMontre>
          )}
          <SelecteurVue vue={vue} surChoix={setVue} className="mt-4" />
        </div>
      </dialog>
    </div>
  );
}

/**
 * Face / Profil / Dos : trois boutons à bascule, un seul enfoncé. La pastille
 * active est UN élément qui glisse d'une option à l'autre (`.segmente`) : les
 * options ont la même largeur, sa position se déduit du rang, sans mesure.
 */
function SelecteurVue({
  vue,
  surChoix,
  className,
}: {
  vue: WatchView;
  surChoix: (vue: WatchView) => void;
  className?: string;
}) {
  const rang = Math.max(0, VUES.findIndex((item) => item.key === vue));
  return (
    <div
      className={cn("segmente mx-auto w-fit rounded-pill border border-rule bg-panel p-1", className)}
      style={{ "--n": VUES.length, "--i": rang } as CSSProperties}
      role="group"
      aria-label="Vue de la montre"
    >
      <span aria-hidden="true" className="segmente-pastille rounded-pill bg-accent" />
      {VUES.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => surChoix(item.key)}
          aria-pressed={vue === item.key}
          className={cn(
            "type-mono relative min-h-11 rounded-pill px-5 transition-colors duration-(--d-base) ease-atelier",
            vue === item.key ? "text-on-accent" : "text-fg-soft hover:text-fg",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
