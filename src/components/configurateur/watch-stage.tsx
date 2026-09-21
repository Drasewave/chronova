"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { IconCroix, IconZoom } from "@/components/ui/icons";
import { PlatineMontre, type CommandesPlatine, type CotePlatine } from "@/components/motion/platine-montre";
import type { WatchRender, WatchView } from "@/watch/types";
import { cn } from "@/lib/utils";

const VUES: { key: WatchView; label: string }[] = [
  { key: "face", label: "Face" },
  { key: "profil", label: "Profil" },
  { key: "dos", label: "Dos" },
];

/**
 * Scène de la montre : une platine tournante, et le zoom.
 *
 * La montre se manipule (`PlatineMontre`) : on la fait tourner du doigt, elle
 * se cale sur la face, un profil ou le dos. Le sélecteur reflète la vue calée ;
 * y cliquer fait TOURNER la montre jusqu'à la vue demandée. Un clic sans
 * glisser ouvre le zoom, qui reprend la même platine et la même vue.
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
  const [pose, setPose] = useState<{ vue: WatchView; cote: CotePlatine }>({ vue: "face", cote: "3h" });
  const [zoom, setZoom] = useState(false);
  // Le rendu du zoom reste monté après la première ouverture : il doit encore
  // être là pendant que le dialogue se referme en fondu.
  const [zoomMonte, setZoomMonte] = useState(false);
  const dialogue = useRef<HTMLDialogElement>(null);
  const platine = useRef<CommandesPlatine>(null);
  const platineZoom = useRef<CommandesPlatine>(null);

  const surVue = useCallback((vue: WatchView, cote: CotePlatine) => {
    setPose((courante) => (courante.vue === vue && courante.cote === cote ? courante : { vue, cote }));
  }, []);
  const ouvrirZoom = useCallback(() => {
    setZoomMonte(true);
    setZoom(true);
  }, []);
  // Rendus stables : la platine les garde en cache, un seuil de montage ne
  // redessine donc pas la vue déjà en place.
  const rendreScene = useCallback(
    (vueAffichee: WatchView) => (
      <InteractiveWatch
        // Deux vues coexistent pendant la rotation : chacune a ses propres `id` SVG.
        id={`configurateur-${vueAffichee}`}
        render={render}
        view={vueAffichee}
        label={label}
        className="flex h-full w-full items-center justify-center"
        svgClassName="h-full w-auto lg:h-auto lg:w-full"
      />
    ),
    [render, label],
  );
  const rendreZoom = useCallback(
    (vueAffichee: WatchView) => (
      <WatchSvg id={`zoom-${vueAffichee}`} render={render} view={vueAffichee} label={label} className="h-auto w-full" />
    ),
    [render, label],
  );

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
      {/* La hauteur doit traverser tous les conteneurs intermédiaires : un div
          en hauteur automatique annulerait le `h-full` du SVG. */}
      <PlatineMontre
        vue={pose.vue}
        cote={pose.cote}
        surVue={surVue}
        surClic={ouvrirZoom}
        commandes={platine}
        libelle={`${label} : montre à faire tourner`}
        className="cadre-montre h-[27vh] w-full lg:h-auto lg:p-6"
        classeCouche="flex h-full w-full items-center justify-center"
        actions={
          <button
            type="button"
            onClick={ouvrirZoom}
            className="inline-flex size-11 items-center justify-center rounded-pill border border-rule bg-panel text-fg-soft transition-colors duration-(--d-fast) ease-atelier hover:border-fg hover:text-accent-ink"
            aria-label="Agrandir la montre"
          >
            <IconZoom />
          </button>
        }
      >
        {rendreScene}
      </PlatineMontre>

      {/* La vue calée est annoncée par la platine elle-même (`aria-live`). */}
      <SelecteurVue vue={pose.vue} platine={platine} className="mt-4" />

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
            <PlatineMontre
              vue={pose.vue}
              cote={pose.cote}
              surVue={surVue}
              commandes={platineZoom}
              libelle={`${label}, agrandie : montre à faire tourner`}
              className="mx-auto aspect-square w-full max-w-[calc(92dvh-11rem)] rounded-card"
            >
              {rendreZoom}
            </PlatineMontre>
          )}
          <SelecteurVue vue={pose.vue} platine={platineZoom} className="mt-4" />
        </div>
      </dialog>
    </div>
  );
}

/**
 * Face / Profil / Dos : trois boutons à bascule, un seul enfoncé — celui de la
 * vue sur laquelle la montre est calée. Choisir une vue fait tourner la platine
 * jusqu'à elle, par le plus court chemin. La pastille
 * active est UN élément qui glisse d'une option à l'autre (`.segmente`) : les
 * options ont la même largeur, sa position se déduit du rang, sans mesure.
 */
function SelecteurVue({
  vue,
  platine,
  className,
}: {
  vue: WatchView;
  platine: RefObject<CommandesPlatine | null>;
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
          onClick={() => platine.current?.montrer(item.key)}
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
