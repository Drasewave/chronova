"use client";

import { useEffect, useRef } from "react";
import { WatchSvg, type WatchSvgProps } from "./watch-svg";

/**
 * Enveloppe cliente du rendu : le reflet du verre suit le pointeur. Le décalage
 * s'écrit dans deux variables CSS du conteneur (`--sheen-x`, `--sheen-y`) : aucun
 * état React, donc le SVG (un millier de nœuds) n'est jamais re-rendu au
 * mouvement. Lissé en `requestAnimationFrame`, coupé sous `prefers-reduced-motion`
 * et sur les écrans tactiles (`pointer: coarse`). Pas d'inclinaison du téléphone :
 * la Permissions-Policy du site interdit l'accéléromètre.
 */
export function InteractiveWatch({
  className,
  svgClassName = "h-auto w-full",
  ...props
}: WatchSvgProps & { svgClassName?: string }) {
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let trame = 0;
    let x = 0;
    let y = 0;
    const appliquer = () => {
      trame = 0;
      boite.current?.style.setProperty("--sheen-x", String(x));
      boite.current?.style.setProperty("--sheen-y", String(y));
    };

    const surPointeur = (event: PointerEvent) => {
      const rect = boite.current?.getBoundingClientRect();
      if (!rect) return;
      x = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2);
      y = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2);
      if (!trame) trame = requestAnimationFrame(appliquer);
    };

    window.addEventListener("pointermove", surPointeur, { passive: true });
    return () => {
      window.removeEventListener("pointermove", surPointeur);
      if (trame) cancelAnimationFrame(trame);
    };
  }, []);

  return (
    <div ref={boite} className={className}>
      <WatchSvg {...props} className={svgClassName} />
    </div>
  );
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
