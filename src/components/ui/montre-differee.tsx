"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { WatchSvg, type WatchSvgProps } from "@/watch/watch-svg";
import { cn } from "@/lib/utils";

/**
 * Rendu différé d'une montre.
 *
 * Un dessin de montre pèse environ 1 500 nœuds SVG, et le serveur l'écrit deux
 * fois (dans le HTML, puis dans le flux RSC). Pour une montre située loin sous
 * la ligne de flottaison, c'est du poids payé par tous les visiteurs pour une
 * image que beaucoup ne verront pas. Ici le serveur n'envoie que la description
 * de la montre (`render`, quelques centaines d'octets) ; le dessin est monté
 * côté client quand sa boîte approche de l'écran.
 *
 * La boîte garde sa taille avant comme après : aucun décalage de mise en page.
 * Le nom, le lien et le prix du modèle restent dans le HTML du serveur, autour
 * de ce composant : seul le dessin attend.
 */
const MARGE = "600px";

function useApproche(boite: RefObject<HTMLElement | null>): boolean {
  const [proche, setProche] = useState(false);

  useEffect(() => {
    const element = boite.current;
    if (!element || proche) return;
    if (typeof IntersectionObserver === "undefined") {
      setProche(true);
      return;
    }
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((entree) => entree.isIntersecting)) {
          setProche(true);
          observateur.disconnect();
        }
      },
      // `scrollMargin` étend aussi la marge aux conteneurs qui défilent (le rail
      // horizontal des modèles sur téléphone) : la carte suivante est dessinée
      // avant d'entrer dans le champ. Ignoré sans dommage là où il n'existe pas.
      { rootMargin: MARGE, scrollMargin: MARGE } as IntersectionObserverInit,
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [boite, proche]);

  return proche;
}

export function MontreDifferee({
  classeBoite,
  fond = false,
  ...props
}: WatchSvgProps & {
  /** Classes de la boîte réservée. Par défaut un carré pleine largeur, comme le dessin. */
  classeBoite?: string;
  /** Pose le fond de studio sur la boîte, quand le parent n'en porte pas déjà un. */
  fond?: boolean;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const proche = useApproche(boite);

  return (
    <div
      ref={boite}
      data-montre-differee={proche ? "montee" : "attente"}
      className={cn("montre-differee", fond && "cadre-montre", classeBoite ?? "aspect-square w-full")}
    >
      {proche && <WatchSvg {...props} />}
    </div>
  );
}

/**
 * Montre rendue par un composant client, sans attente. Le HTML du serveur est le
 * même qu'avec `WatchSvg` appelé directement, mais le flux RSC ne transporte plus
 * que `render` au lieu de recopier les 1 500 nœuds du dessin : le poids de la
 * page est divisé par deux pour cette montre. C'est aussi ce qui permet à la
 * galerie d'une fiche de ne dessiner ses vues cachées qu'à l'affichage.
 */
export function MontreCliente({
  classeBoite: _classeBoite,
  ...props
}: WatchSvgProps & {
  /** Accepté pour partager les props de `MontreDifferee` ; sans objet ici, le dessin est posé tel quel. */
  classeBoite?: string;
}) {
  return <WatchSvg {...props} />;
}

/**
 * Second coloris d'une carte de modèle. Il n'apparaît qu'au survol ou au focus :
 * on ne le dessine donc qu'à la première intention (pointeur qui entre, focus,
 * doigt posé) sur la carte, puis il reste monté. Le fondu est le même qu'avant :
 * le calque suit `group-hover`, et le dessin arrive lui-même en fondu la
 * première fois, pour ne pas surgir dans un calque déjà opaque.
 */
export function SecondColoris(props: WatchSvgProps) {
  const calque = useRef<HTMLDivElement>(null);
  const [monte, setMonte] = useState(false);

  useEffect(() => {
    if (monte) return;
    const carte = calque.current?.closest<HTMLElement>(".carte-montre");
    if (!carte) return;
    const monter = () => setMonte(true);
    const options = { passive: true, once: true } as const;
    carte.addEventListener("pointerenter", monter, options);
    carte.addEventListener("focusin", monter, options);
    carte.addEventListener("touchstart", monter, options);
    return () => {
      carte.removeEventListener("pointerenter", monter);
      carte.removeEventListener("focusin", monter);
      carte.removeEventListener("touchstart", monter);
    };
  }, [monte]);

  return (
    <div
      ref={calque}
      aria-hidden="true"
      className="second-coloris absolute inset-0 opacity-0 transition-opacity duration-(--d-reveal) ease-atelier group-hover:opacity-100"
    >
      {monte && <WatchSvg {...props} label="" />}
    </div>
  );
}
