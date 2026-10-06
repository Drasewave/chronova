"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { Montre3D } from "@/watch/three/montre-3d";
import { WatchSvg } from "@/watch/watch-svg";
import { FonduStudio } from "@/components/motion/vue-montre";
import { IconCroix, IconZoom } from "@/components/ui/icons";
import type { WatchRender, WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

const VUES: { key: WatchView; label: string }[] = [
  { key: "face", label: "Face" },
  { key: "profil", label: "Profil" },
  { key: "dos", label: "Dos" },
];

/**
 * Scène de la montre : la montre 3D, qu'on fait tourner au glisser, et trois
 * vues (face, profil, dos) choisies par le sélecteur, vers lesquelles elle
 * pivote. Tant que la 3D charge — ou sans WebGL — c'est le dessin de la vue
 * demandée, dans un fondu de studio (`FonduStudio`). La loupe ouvre le zoom
 * vectoriel, qui reprend la même vue.
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

  const ouvrirZoom = useCallback(() => {
    setZoomMonte(true);
    setZoom(true);
  }, []);

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
      <div className="cadre-montre relative h-[27vh] w-full lg:aspect-square lg:h-auto lg:p-6" role="group" aria-label={`${label} : montre`}>
        <Montre3D id="configurateur" render={render} vue={vue} className="h-full w-full">
          <FonduStudio cle={vue} className="h-full w-full" classeCouche="flex h-full w-full items-center justify-center">
            {(v) => (
              <InteractiveWatch
                id={`configurateur-${v}`}
                render={render}
                view={v}
                label={label}
                className="flex h-full w-full items-center justify-center"
                svgClassName="h-full w-auto lg:h-auto lg:w-full"
              />
            )}
          </FonduStudio>
        </Montre3D>
        <button
          type="button"
          onClick={ouvrirZoom}
          className="absolute right-3 top-3 z-10 inline-flex size-11 items-center justify-center rounded-pill border border-rule bg-panel text-fg-soft transition-colors duration-(--d-fast) ease-atelier hover:text-accent-ink"
          aria-label={`Agrandir la montre, vue ${LIBELLES[vue]}`}
        >
          <IconZoom />
        </button>
      </div>

      <SelecteurVue vue={vue} onChoisir={setVue} className="mt-4" />

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
            <FonduStudio
              cle={vue}
              className="mx-auto aspect-square w-full max-w-[calc(92dvh-11rem)] rounded-card"
              classeCouche="h-full w-full"
            >
              {(v) => <WatchSvg id={`zoom-${v}`} render={render} view={v} label={label} className="h-auto w-full" />}
            </FonduStudio>
          )}
          <SelecteurVue vue={vue} onChoisir={setVue} className="mt-4" />
        </div>
      </dialog>
    </div>
  );
}

const LIBELLES: Record<WatchView, string> = { face: "Face", profil: "Profil", dos: "Dos" };

/**
 * Face / Profil / Dos : trois boutons à bascule, un seul enfoncé. La pastille
 * active est UN élément qui glisse d'une option à l'autre (`.segmente`) : les
 * options ont la même largeur, sa position se déduit du rang, sans mesure.
 */
function SelecteurVue({
  vue,
  onChoisir,
  className,
}: {
  vue: WatchView;
  onChoisir: (vue: WatchView) => void;
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
          onClick={() => onChoisir(item.key)}
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
