"use client";

import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "motion";

declare global {
  interface Window {
    /** Posé par `INTRO_BOOT` quand le rideau doit être sauté. */
    __chronovaIntro?: "off";
  }
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Angles à 10 h 10 : la position sur laquelle toutes les montres sont photographiées. */
const ANGLE_HEURE = (10 + 10 / 60) * 30; // 305°
const ANGLE_MINUTE = 10 * 6; // 60°

/**
 * Rideau d'entrée. Un cadran se dessine, ses index apparaissent au rythme d'une
 * trotteuse, les aiguilles se posent sur 10 h 10, le nom se resserre, puis le
 * cadran s'ouvre en masque circulaire sur la page — on entre par le cadran.
 *
 * Durée totale 2,4 s. Joué une seule fois par session, jamais sous
 * `prefers-reduced-motion` (voir `intro-boot.ts`). La page d'accueil est déjà
 * montée et peinte derrière le rideau : il n'y a donc rien à précharger.
 */
export function IntroCurtain() {
  const [fini, setFini] = useState(false);
  const scope = useRef<HTMLDivElement>(null);
  const trou = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (window.__chronovaIntro === "off") {
      setFini(true);
      return;
    }

    const racine = scope.current;
    if (!racine) return;

    document.body.style.overflow = "hidden";
    sessionStorage.setItem("chronova:intro", "vu");

    const q = (sel: string) => racine.querySelectorAll(sel);
    const rayonFinal = Math.hypot(window.innerWidth, window.innerHeight) * 0.62;
    let annule = false;

    const commandes = [
      // 1. Le contour du cadran se trace.
      animate(q("#intro-cercle"), { strokeDashoffset: [880, 0] }, { duration: 0.6, ease: EASE }),
      // 2. Les douze index, un par un, dans le sens horaire.
      animate(
        q(".intro-index"),
        { opacity: [0, 1], scale: [0.4, 1] },
        { duration: 0.24, delay: stagger(0.032, { startDelay: 0.55 }), ease: EASE },
      ),
      // 3. Les aiguilles tournent et se posent, avec un léger amorti.
      animate(
        q("#intro-heure"),
        { rotate: [0, ANGLE_HEURE] },
        { type: "spring", bounce: 0.24, duration: 0.9, delay: 0.82 },
      ),
      animate(
        q("#intro-minute"),
        { rotate: [0, ANGLE_MINUTE] },
        { type: "spring", bounce: 0.3, duration: 0.95, delay: 0.86 },
      ),
      animate(
        q("#intro-seconde"),
        { rotate: [0, 192], opacity: [0, 1] },
        { type: "spring", bounce: 0.2, duration: 0.8, delay: 0.95 },
      ),
      // 4. Le nom apparaît et son interlettrage se resserre.
      animate(
        q("#intro-mot"),
        { opacity: [0, 1], letterSpacing: ["0.4em", "0.08em"] },
        { duration: 0.62, ease: EASE, delay: 1.34 },
      ),
      // 5. Le cadran s'agrandit et son cercle devient la fenêtre sur le site.
      animate(q("#intro-cadran"), { scale: [1, 1.5], opacity: [1, 0] }, { duration: 0.52, ease: EASE, delay: 1.92 }),
      animate(q("#intro-mot"), { opacity: [1, 0] }, { duration: 0.28, ease: EASE, delay: 1.92 }),
    ];

    if (trou.current) {
      commandes.push(
        animate(trou.current, { r: [0, rayonFinal] }, { duration: 0.58, ease: EASE, delay: 1.9 }),
      );
    }

    const terminer = () => {
      if (annule) return;
      document.body.style.overflow = "";
      setFini(true);
    };
    const minuteur = window.setTimeout(terminer, 2440);

    return () => {
      annule = true;
      window.clearTimeout(minuteur);
      document.body.style.overflow = "";
      for (const c of commandes) c.stop();
    };
  }, []);

  if (fini) return null;

  return (
    <div
      ref={scope}
      className="intro-curtain fixed inset-0 z-[100] grid place-items-center"
      role="presentation"
    >
      {/* Fond crème percé d'un trou qui s'ouvre : c'est lui la transition. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <mask id="intro-masque">
            <rect width="100%" height="100%" fill="#fff" />
            <circle ref={trou} cx="50%" cy="50%" r="0" fill="#000" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="var(--color-paper)" mask="url(#intro-masque)" />
      </svg>

      <div className="relative flex flex-col items-center gap-10">
        <svg
          id="intro-cadran"
          viewBox="0 0 400 400"
          className="w-[min(56vw,300px)]"
          aria-hidden="true"
          style={{ transformOrigin: "center" }}
        >
          <circle
            id="intro-cercle"
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeDasharray="880"
            strokeDashoffset="880"
            transform="rotate(-90 200 200)"
          />
          {/* La rotation reste sur le <g> (attribut SVG) : une transformation CSS
              posée sur le même élément l'écraserait, et les douze index se
              superposeraient à midi. */}
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 30} 200 200)`}>
              <rect
                className="intro-index"
                x="198.5"
                y="68"
                width="3"
                height={i % 3 === 0 ? 18 : 11}
                fill="var(--color-ink)"
                opacity="0"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            </g>
          ))}
          <g style={{ transformBox: "view-box", transformOrigin: "200px 200px" }} id="intro-heure">
            <rect x="197" y="120" width="6" height="84" rx="3" fill="var(--color-ink)" />
          </g>
          <g style={{ transformBox: "view-box", transformOrigin: "200px 200px" }} id="intro-minute">
            <rect x="198" y="82" width="4" height="122" rx="2" fill="var(--color-ink)" />
          </g>
          <g
            style={{ transformBox: "view-box", transformOrigin: "200px 200px" }}
            id="intro-seconde"
            opacity="0"
          >
            <rect x="199.25" y="74" width="1.5" height="146" fill="var(--color-brass)" />
          </g>
          <circle cx="200" cy="200" r="5" fill="var(--color-ink)" />
        </svg>

        <p
          id="intro-mot"
          className="type-mono text-[clamp(1rem,3vw,1.5rem)] text-ink opacity-0"
          style={{ fontFamily: "var(--font-title)", letterSpacing: "0.4em", textIndent: "0.4em" }}
        >
          CHRONOVA
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          document.body.style.overflow = "";
          setFini(true);
        }}
        className="type-mono absolute bottom-8 right-[var(--gutter)] text-ink-soft link-underline hover:text-brass"
      >
        Passer
      </button>
    </div>
  );
}
