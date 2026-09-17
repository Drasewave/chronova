"use client";

import { useEffect, useRef, useState } from "react";
import { COUCHES_ECLATEES } from "@/lib/content/home";
import { cn } from "@/lib/utils";

const CX = 310;
const CY = 510;
const RX = 244;
const RY = 80; // ~0,33 : l'écrasement d'un plan vu de trois quarts
const ECART_REPOS = 8;
const ECART_ECLATE = 132;

/** Le dessin est contraint par la hauteur : il doit tenir dans l'écran collant. */
const HAUTEUR_DESSIN = "min(76vh, 44rem)";

const ACIER = { clair: "#DCD5C6", moyen: "#B0A899", sombre: "#7A7367", arete: "#615A4F" };
const CADRAN = "#1E3448";
const INSERT = "#1B2E42";
const LUME = "#D8DCC2";

/**
 * Section signature : en descendant, la montre se sépare en sept plans. C'est la
 * démonstration visuelle du travail d'assemblage — chaque plan est une pièce que
 * l'horloger pose à la main, légendée en monospace comme une nomenclature.
 *
 * Sous `prefers-reduced-motion`, la vue est affichée d'emblée entièrement
 * séparée : on perd l'effet, jamais l'information.
 */
export function ExplodedView() {
  const piste = useRef<HTMLDivElement>(null);
  const [progression, setProgression] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgression(1);
      return;
    }

    let trame = 0;
    const mesurer = () => {
      trame = 0;
      const rect = piste.current?.getBoundingClientRect();
      if (!rect) return;
      const course = rect.height - window.innerHeight;
      if (course <= 0) return;
      setProgression(Math.max(0, Math.min(1, -rect.top / course)));
    };
    const planifier = () => {
      if (!trame) trame = requestAnimationFrame(mesurer);
    };

    mesurer();
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    return () => {
      window.removeEventListener("scroll", planifier);
      window.removeEventListener("resize", planifier);
      if (trame) cancelAnimationFrame(trame);
    };
  }, []);

  const actif = Math.min(COUCHES_ECLATEES.length - 1, Math.floor(progression * COUCHES_ECLATEES.length));
  const decalage = (index: number) => {
    const milieu = (COUCHES_ECLATEES.length - 1) / 2;
    const repos = (index - milieu) * ECART_REPOS;
    const eclate = (index - milieu) * ECART_ECLATE;
    return repos + (eclate - repos) * progression;
  };

  return (
    <div id="vue-eclatee" ref={piste} className="relative bg-bg-alt" style={{ height: "300vh" }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-content" style={{ paddingInline: "var(--gutter)" }}>
          {/* Trois colonnes en grand écran : l'intitulé à gauche, la pile au
              centre, la nomenclature à droite. Le dessin récupère ainsi toute
              la hauteur d'écran disponible. */}
          <div className="grid items-center gap-8 lg:grid-cols-[16rem_minmax(0,1fr)_19rem] lg:gap-10">
            <header>
              <p className="type-mono text-fg-soft">Vue éclatée · Abysse 40</p>
              <h2 className="type-display-2 mt-3 max-w-[12ch]">Sept plans, montés un par un.</h2>
              <p className="type-caption mt-5 hidden text-fg-soft lg:block">
                Continuez à faire défiler : la montre se sépare.
              </p>
            </header>

            <div className="mx-auto" style={{ height: HAUTEUR_DESSIN }}>
              <svg
                viewBox="0 0 620 1020"
                className="h-full w-auto"
                role="img"
                aria-label="Vue éclatée de l'Abysse 40 : verre, lunette, cadran, aiguilles, mouvement, boîtier, fond"
              >
                <defs>
                  <linearGradient id="ecl-acier" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={ACIER.clair} />
                    <stop offset="0.5" stopColor={ACIER.moyen} />
                    <stop offset="1" stopColor={ACIER.sombre} />
                  </linearGradient>
                </defs>

                {/* Du fond vers le verre : on empile comme on assemble. */}
                <Plan y={decalage(6)}>
                  <Fond />
                </Plan>
                <Plan y={decalage(5)}>
                  <Boitier />
                </Plan>
                <Plan y={decalage(4)}>
                  <Mouvement />
                </Plan>
                <Plan y={decalage(3)}>
                  <Aiguilles />
                </Plan>
                <Plan y={decalage(2)}>
                  <Cadran />
                </Plan>
                <Plan y={decalage(1)}>
                  <Lunette />
                </Plan>
                <Plan y={decalage(0)}>
                  <Verre />
                </Plan>
              </svg>
            </div>

            {/* Grand écran : chaque légende reste à la hauteur de son plan. */}
            <ul className="relative hidden lg:block" style={{ height: HAUTEUR_DESSIN }}>
              {COUCHES_ECLATEES.map((couche, index) => {
                // Position figée sur celle du plan une fois la montre entièrement
                // séparée : les légendes ne se chevauchent jamais en cours de
                // route, et retombent pile en face de leur plan à l'arrivée.
                const milieu = (COUCHES_ECLATEES.length - 1) / 2;
                const y = ((CY + (index - milieu) * ECART_ECLATE) / 1020) * 100;
                const visible = progression > 0.05 + index * 0.02;
                return (
                  <li
                    key={couche.cle}
                    className="absolute inset-x-0 transition-opacity duration-300 ease-atelier"
                    style={{ top: `${y}%`, transform: "translateY(-60%)", opacity: visible ? 1 : 0 }}
                  >
                    <span className="mb-2 block h-px w-8 bg-accent-decor" />
                    <p className="type-mono text-fg">{couche.titre}</p>
                    <p className="type-caption mt-1 text-fg-soft">{couche.detail}</p>
                  </li>
                );
              })}
            </ul>

            {/* Petit écran : une seule légende, celle du plan en cours. */}
            <div className="lg:hidden" aria-live="polite" style={{ minHeight: "5rem" }}>
              {COUCHES_ECLATEES.map((couche, index) => (
                <div key={couche.cle} className={cn(index === actif ? "block" : "hidden")}>
                  <p className="type-mono text-fg">
                    {String(index + 1).padStart(2, "0")} · {couche.titre}
                  </p>
                  <p className="type-caption mt-1.5 text-fg-soft">{couche.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plan({ y, children }: { y: number; children: React.ReactNode }) {
  return <g transform={`translate(0 ${y.toFixed(1)})`}>{children}</g>;
}

/** Les points d'une ellipse vue en perspective. */
function surEllipse(angle: number, rx = RX, ry = RY) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + rx * Math.cos(rad), y: CY + ry * Math.sin(rad) };
}

function Verre() {
  return (
    <g>
      <ellipse cx={CX} cy={CY} rx={RX - 24} ry={RY - 8} fill="#EAF0EE" fillOpacity="0.34" />
      <ellipse
        cx={CX}
        cy={CY}
        rx={RX - 24}
        ry={RY - 8}
        fill="none"
        stroke={ACIER.arete}
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <path
        d={`M ${CX - 120} ${CY - 20} Q ${CX - 40} ${CY - 46} ${CX + 50} ${CY - 26}`}
        fill="none"
        stroke="#FBF8F3"
        strokeOpacity="0.85"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function Lunette() {
  return (
    <g>
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#ecl-acier)" />
      <ellipse cx={CX} cy={CY} rx={RX - 14} ry={RY - 5} fill={INSERT} />
      <ellipse cx={CX} cy={CY} rx={RX - 42} ry={RY - 14} fill="none" stroke={ACIER.arete} strokeWidth="2" />
      <ellipse cx={CX} cy={CY} rx={RX - 44} ry={RY - 15} fill="#EDE6DA" />
      {Array.from({ length: 24 }, (_, i) => {
        const a = surEllipse(i * 15, RX - 22, RY - 8);
        const b = surEllipse(i * 15, RX - 34, RY - 12);
        return (
          <line
            key={i}
            x1={a.x.toFixed(1)}
            y1={a.y.toFixed(1)}
            x2={b.x.toFixed(1)}
            y2={b.y.toFixed(1)}
            stroke="#C8D2DA"
            strokeOpacity="0.8"
            strokeWidth="2"
          />
        );
      })}
      <circle cx={CX} cy={CY - RY + 6} r="7" fill={LUME} stroke={ACIER.arete} strokeWidth="1.5" />
    </g>
  );
}

function Cadran() {
  return (
    <g>
      <ellipse cx={CX} cy={CY} rx={RX - 34} ry={RY - 11} fill={CADRAN} />
      <ellipse
        cx={CX}
        cy={CY}
        rx={RX - 34}
        ry={RY - 11}
        fill="none"
        stroke="#0F1E2C"
        strokeWidth="2"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const p = surEllipse(i * 30, RX - 56, RY - 19);
        return (
          <ellipse
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            rx="8"
            ry="3.5"
            fill={LUME}
            stroke="#8E8878"
            strokeWidth="1"
          />
        );
      })}
      <text
        x={CX}
        y={CY - 12}
        textAnchor="middle"
        fill="#C9D3DC"
        style={{ fontFamily: "var(--font-title)", fontSize: 17, letterSpacing: "0.2em" }}
      >
        CHRONOVA
      </text>
    </g>
  );
}

function Aiguilles() {
  const aplat = RY / RX;
  const hampe = (angle: number, longueur: number, largeur: number, couleur: string) => {
    const p = surEllipse(angle, longueur, longueur * aplat);
    const g = surEllipse(angle - 90, largeur, largeur * aplat);
    const dx = g.x - CX;
    const dy = g.y - CY;
    return (
      <path
        d={`M ${(CX + dx).toFixed(1)} ${(CY + dy).toFixed(1)} L ${p.x.toFixed(1)} ${(p.y - 5).toFixed(1)} L ${(CX - dx).toFixed(1)} ${(CY - dy).toFixed(1)} Z`}
        fill={couleur}
        stroke={ACIER.arete}
        strokeWidth="1.5"
      />
    );
  };

  return (
    <g>
      {hampe(305, 118, 15, ACIER.clair)}
      {hampe(60, 168, 12, ACIER.clair)}
      {hampe(192, 176, 5, "#7E5F37")}
      <ellipse cx={CX} cy={CY} rx="12" ry="5" fill={ACIER.moyen} stroke={ACIER.arete} strokeWidth="1.5" />
    </g>
  );
}

function Mouvement() {
  return (
    <g>
      <ellipse cx={CX} cy={CY} rx={RX - 46} ry={RY - 15} fill="#C8C1B2" />
      <ellipse cx={CX} cy={CY} rx={RX - 46} ry={RY - 15} fill="none" stroke={ACIER.arete} strokeWidth="2" />
      {/* Masse oscillante : la demi-lune qui signe un mouvement automatique. */}
      <path
        d={`M ${CX - (RX - 52)} ${CY - 4} a ${RX - 52} ${RY - 17} 0 0 1 ${(RX - 52) * 2} 0 Z`}
        fill="#B4AC9B"
        stroke={ACIER.arete}
        strokeWidth="1.5"
      />
      <path
        d={`M ${CX - (RX - 96)} ${CY - 4} a ${RX - 96} ${RY - 30} 0 0 1 ${(RX - 96) * 2} 0 Z`}
        fill="#C8C1B2"
        stroke={ACIER.arete}
        strokeOpacity="0.6"
        strokeWidth="1.5"
      />
      {/* Balancier et rubis. */}
      <ellipse cx={CX + 88} cy={CY + 16} rx="34" ry="12" fill="none" stroke="#8F887A" strokeWidth="4" />
      <ellipse cx={CX - 72} cy={CY + 18} rx="18" ry="7" fill="#C09755" />
      {[
        [CX - 128, CY + 6],
        [CX + 136, CY],
        [CX + 12, CY + 26],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="6" ry="3" fill="#8F887A" />
      ))}
    </g>
  );
}

function Boitier() {
  // Les quatre cornes sont posées sur l'ellipse, pas collées au bord du cadre :
  // c'est ce qui fait lire le plan comme une pièce vue de trois quarts.
  const cornes = [36, 144, 216, 324];
  return (
    <g>
      <path
        d={`M ${CX - RX} ${CY} a ${RX} ${RY} 0 0 0 ${RX * 2} 0 l 0 36 a ${RX} ${RY} 0 0 1 ${-RX * 2} 0 Z`}
        fill={ACIER.sombre}
      />
      {cornes.map((angle) => {
        const base = surEllipse(angle, RX - 8, RY - 3);
        const pointe = surEllipse(angle, RX + 54, RY + 18);
        const gauche = surEllipse(angle - 7, RX - 4, RY - 1);
        const droite = surEllipse(angle + 7, RX - 4, RY - 1);
        return (
          <path
            key={angle}
            d={`M ${gauche.x.toFixed(1)} ${gauche.y.toFixed(1)} L ${pointe.x.toFixed(1)} ${(pointe.y - 4).toFixed(1)} L ${droite.x.toFixed(1)} ${droite.y.toFixed(1)} L ${base.x.toFixed(1)} ${base.y.toFixed(1)} Z`}
            fill={ACIER.moyen}
            stroke={ACIER.arete}
            strokeWidth="2"
          />
        );
      })}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#ecl-acier)" />
      <ellipse cx={CX} cy={CY} rx={RX - 30} ry={RY - 10} fill="#EDE6DA" />
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke={ACIER.arete} strokeWidth="2" />
    </g>
  );
}

function Fond() {
  return (
    <g>
      <ellipse cx={CX} cy={CY} rx={RX - 18} ry={RY - 6} fill="url(#ecl-acier)" />
      <ellipse cx={CX} cy={CY} rx={RX - 18} ry={RY - 6} fill="none" stroke={ACIER.arete} strokeWidth="2" />
      <ellipse cx={CX} cy={CY} rx={RX - 56} ry={RY - 20} fill="none" stroke={ACIER.arete} strokeOpacity="0.5" strokeWidth="1.5" />
      <text
        x={CX}
        y={CY + 4}
        textAnchor="middle"
        fill={ACIER.arete}
        style={{ fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.18em" }}
      >
        ASSEMBLÉ À LA MAIN
      </text>
    </g>
  );
}
