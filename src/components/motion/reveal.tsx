"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** `useLayoutEffect` avertit au rendu serveur ; là-bas, il n'y a rien à mesurer. */
const useEffetAvantImage = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Apparition au défilement : opacité + 20 px de montée, `--d-reveal`, une seule
 * fois par élément. `delay` décale deux voisins d'une même série.
 *
 * Volontairement sans bibliothèque d'animation : un IntersectionObserver et une
 * transition CSS coûtent moins qu'un composant animé par élément.
 *
 * Le contenu est rendu VISIBLE par le serveur. À l'hydratation, avant la
 * première image, seuls les éléments situés SOUS la ligne de flottaison sont
 * masqués (`data-reveal="pending"`) — hors champ, donc sans que rien ne
 * clignote. Ce qui est déjà à l'écran au chargement ne bouge jamais : pas
 * d'éclair de contenu invisible, et rien à rattraper sans JavaScript.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "li" | "article" | "section";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffetAvantImage(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver !== "function") return;
    // Déjà à l'écran, ou déjà dépassé : on n'y touche pas.
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    node.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.dataset.reveal = "done";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      // Un remontage ne doit jamais laisser le contenu masqué.
      delete node.dataset.reveal;
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={delay ? ({ "--reveal-retard": `${delay}ms` } as CSSProperties) : undefined}
      className={cn(
        "data-[reveal=pending]:translate-y-5 data-[reveal=pending]:opacity-0",
        // La transition n'existe qu'à l'arrivée : le masquage initial est sec.
        "data-[reveal=done]:transition-[opacity,transform] data-[reveal=done]:delay-[var(--reveal-retard,0ms)] data-[reveal=done]:duration-(--d-reveal) data-[reveal=done]:ease-atelier",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
