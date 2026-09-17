"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Apparition au défilement : opacité + 16 px de montée, une seule fois par
 * élément, 60 ms d'écart entre deux éléments d'une même série.
 *
 * Volontairement sans bibliothèque d'animation : un IntersectionObserver et une
 * transition CSS coûtent moins qu'un composant animé par élément.
 *
 * L'état masqué est rendu DÈS LE SERVEUR (`data-reveal="pending"`) : sinon le
 * contenu s'afficherait, puis disparaîtrait à l'hydratation, puis reviendrait.
 * Le filet de sécurité sans JavaScript est une règle `<noscript>` posée dans le
 * gabarit du site, qui remet tout en place.
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

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.reveal = "done";
      return;
    }

    let minuteur = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          minuteur = window.setTimeout(() => {
            node.dataset.reveal = "done";
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => {
      window.clearTimeout(minuteur);
      observer.disconnect();
    };
  }, [delay]);

  return (
    <Tag
      ref={ref as never}
      data-reveal="pending"
      className={cn(
        "transition-[opacity,transform] duration-[450ms] ease-atelier",
        "data-[reveal=pending]:translate-y-4 data-[reveal=pending]:opacity-0",
        "data-[reveal=done]:translate-y-0 data-[reveal=done]:opacity-100",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
