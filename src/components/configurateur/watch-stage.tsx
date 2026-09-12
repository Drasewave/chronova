"use client";

import { useEffect, useRef, useState } from "react";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { IconCroix } from "@/components/ui/icons";
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
        onClick={() => setZoom(true)}
        className="flex h-[27vh] w-full cursor-zoom-in items-center justify-center rounded-card lg:h-auto"
        aria-label="Agrandir la montre"
      >
        {/* La hauteur doit traverser tous les conteneurs intermédiaires : un div
            en hauteur automatique annulerait le `h-full` du SVG. */}
        <InteractiveWatch
          id="configurateur"
          render={render}
          view={vue}
          label={label}
          className="flex h-full w-full items-center justify-center"
          svgClassName="h-full w-auto lg:h-auto lg:w-full"
        />
      </button>

      <div className="mt-3 flex items-center justify-center gap-1" role="group" aria-label="Vue de la montre">
        {VUES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setVue(item.key)}
            aria-pressed={vue === item.key}
            className={cn(
              "type-mono min-h-11 rounded-field px-4 transition-colors duration-200 ease-atelier",
              vue === item.key ? "bg-accent text-on-accent" : "text-fg-soft hover:text-accent",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <dialog
        ref={dialogue}
        onClose={() => setZoom(false)}
        onClick={(event) => {
          if (event.target === dialogue.current) setZoom(false);
        }}
        className="m-auto max-h-[92dvh] w-[min(92vw,52rem)] rounded-card border border-rule bg-bg p-0 text-fg backdrop:bg-[color-mix(in_srgb,var(--color-ink)_58%,transparent)]"
      >
        <div className="relative p-4 sm:p-8">
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center text-fg-soft hover:text-accent"
            aria-label="Fermer l'agrandissement"
          >
            <IconCroix />
          </button>
          {zoom && <WatchSvg id="zoom" render={render} view={vue} label={label} className="h-auto w-full" />}
          <p className="type-mono mt-4 text-center text-fg-soft">{VUES.find((v) => v.key === vue)?.label}</p>
        </div>
      </dialog>
    </div>
  );
}
