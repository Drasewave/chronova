"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SceneMontre } from "./scene";
import type { WatchRender, WatchView } from "../types";
import { cn } from "@/lib/utils";

/**
 * Montre en 3D, posée sur son dessin SVG.
 *
 * Le SVG (`children`) est rendu par le serveur et reste l'image affichée tant
 * que la 3D n'est pas prête : c'est lui qui fait le LCP, et c'est lui qui reste
 * si WebGL manque. three.js n'est téléchargé qu'à l'approche de l'écran, dans
 * un morceau à part ; la scène prête, la toile prend la place du dessin en
 * fondu. Le dessin garde son intitulé : les lecteurs d'écran le lisent toujours.
 */
export function Montre3D({
  id,
  render,
  vue = "face",
  interactif = true,
  masquee = false,
  className,
  children,
}: {
  id: string;
  render: WatchRender;
  vue?: WatchView;
  /** Glisser pour tourner la montre. */
  interactif?: boolean;
  /** Rend la main au dessin le temps d'une animation qui lui appartient (passage du défilé). */
  masquee?: boolean;
  className?: string;
  /** Le dessin SVG de la même montre : affiché d'abord, et repli sans WebGL. */
  children: ReactNode;
}) {
  const toile = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneMontre | null>(null);
  const [prete, setPrete] = useState(false);
  // Un objet `render` neuf à chaque rendu du parent ne doit pas recharger la scène.
  const cle = JSON.stringify(render);
  const configuration = useMemo(() => JSON.parse(cle) as WatchRender, [cle]);
  const initiale = useRef({ configuration, vue, interactif });

  useEffect(() => {
    const noeud = toile.current;
    if (!noeud) return;
    let annule = false;
    const approche = new IntersectionObserver(
      ([entree]) => {
        if (!entree?.isIntersecting) return;
        approche.disconnect();
        const { configuration: depart, vue: vueDepart, interactif: geste } = initiale.current;
        import("./scene")
          .then(({ monterScene }) => monterScene(noeud, id, depart, { vue: vueDepart, interactif: geste }))
          .then((montee) => {
            if (annule) return montee.detruire();
            scene.current = montee;
            setPrete(true);
          })
          // Sans WebGL (ou contexte perdu au montage) : le dessin SVG reste.
          .catch(() => undefined);
      },
      { rootMargin: "300px" },
    );
    approche.observe(noeud);
    return () => {
      annule = true;
      approche.disconnect();
      scene.current?.detruire();
      scene.current = null;
    };
  }, [id]);

  // La dernière configuration envoyée à la scène (par sa clé) : on recharge dès
  // qu'elle change, y compris pour revenir à celle de départ.
  const chargee = useRef(cle);
  useEffect(() => {
    if (!scene.current || chargee.current === cle) return;
    chargee.current = cle;
    void scene.current.configuration(configuration).catch(() => undefined);
  }, [cle, configuration, prete]);

  useEffect(() => {
    scene.current?.vue(vue);
  }, [vue, prete]);

  const visible = prete && !masquee;
  return (
    <div className={cn("relative", className)}>
      <div className={cn("h-full w-full transition-opacity duration-(--d-slow) ease-atelier", visible && "opacity-0")}>{children}</div>
      <canvas
        ref={toile}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-(--d-slow) ease-atelier",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
          interactif && visible && "cursor-grab active:cursor-grabbing",
        )}
      />
    </div>
  );
}
