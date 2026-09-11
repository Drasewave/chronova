"use client";

import { useEffect, useRef, useState } from "react";
import { WatchSvg, type WatchSvgProps } from "./watch-svg";

/**
 * Enveloppe cliente du rendu : le reflet du verre suit le pointeur, ou
 * l'inclinaison du téléphone. Lissé en `requestAnimationFrame`, coupé sous
 * `prefers-reduced-motion`. Le SVG lui-même reste un composant sans état : seul
 * le décalage du dégradé change.
 */
export function InteractiveWatch({ className, ...props }: WatchSvgProps) {
  const [sheen, setSheen] = useState({ x: 0, y: 0 });
  const boite = useRef<HTMLDivElement>(null);
  const trame = useRef(0);
  const cible = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const appliquer = () => {
      trame.current = 0;
      setSheen({ ...cible.current });
    };
    const planifier = () => {
      if (trame.current) return;
      trame.current = requestAnimationFrame(appliquer);
    };

    const surPointeur = (event: PointerEvent) => {
      const rect = boite.current?.getBoundingClientRect();
      if (!rect) return;
      cible.current = {
        x: clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2),
        y: clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2),
      };
      planifier();
    };

    const surInclinaison = (event: DeviceOrientationEvent) => {
      if (event.gamma === null || event.beta === null) return;
      cible.current = { x: clamp(event.gamma / 40), y: clamp((event.beta - 45) / 40) };
      planifier();
    };

    window.addEventListener("pointermove", surPointeur, { passive: true });
    window.addEventListener("deviceorientation", surInclinaison);
    return () => {
      window.removeEventListener("pointermove", surPointeur);
      window.removeEventListener("deviceorientation", surInclinaison);
      if (trame.current) cancelAnimationFrame(trame.current);
    };
  }, []);

  return (
    <div ref={boite} className={className}>
      <WatchSvg {...props} sheen={sheen} className="h-auto w-full" />
    </div>
  );
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
