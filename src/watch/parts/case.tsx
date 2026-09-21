import { METALS } from "../palette";
import { C, R_CASE, R_LUG_TIP as LUG_TIP } from "../geometry";
import type { CaseFinish, MetalTone } from "../types";

/**
 * Cornes. Elles prolongent la carrure au lieu d'en rayonner : flanc extérieur
 * tangent au boîtier, flanc intérieur droit — les deux flancs intérieurs sont
 * parallèles, c'est l'entrecorne qui reçoit le bracelet. `sx`/`sy` placent la
 * corne dans son quadrant sans retourner l'éclairage, contrairement à un
 * `rotate` ou un `scale(-1)`.
 */
const LUG_INNER = 181;

function lugPath(sx: 1 | -1, sy: 1 | -1): string {
  const p = (x: number, d: number) => `${C + sx * x} ${C + sy * d}`;
  return [
    `M ${p(LUG_INNER, 290)}`,
    `L ${p(LUG_INNER, LUG_TIP - 16)}`,
    `Q ${p(LUG_INNER, LUG_TIP)} ${p(LUG_INNER + 15, LUG_TIP)}`,
    `L ${p(216, LUG_TIP - 3)}`,
    `Q ${p(233, LUG_TIP - 6)} ${p(235, LUG_TIP - 26)}`,
    `C ${p(240, 350)} ${p(268, 250)} ${p(311, 165)}`,
    `L ${p(250, 170)}`,
    "Z",
  ].join(" ");
}

/** Chanfrein poli le long du flanc extérieur. */
function lugBevel(sx: 1 | -1, sy: 1 | -1): string {
  const p = (x: number, d: number) => `${C + sx * x} ${C + sy * d}`;
  return `M ${p(225, LUG_TIP - 20)} C ${p(230, 352)} ${p(256, 262)} ${p(292, 188)}`;
}

const QUADRANTS: Array<{ key: string; sx: 1 | -1; sy: 1 | -1 }> = [
  { key: "hg", sx: -1, sy: -1 },
  { key: "hd", sx: 1, sy: -1 },
  { key: "bg", sx: -1, sy: 1 },
  { key: "bd", sx: 1, sy: 1 },
];

export function Lugs({ uid, metal, finish }: { uid: string; metal: MetalTone; finish: CaseFinish }) {
  const ramp = METALS[metal];
  const finishPattern =
    finish === "brosse" ? `url(#${uid}-brushed)` : finish === "microbille" ? `url(#${uid}-beaded)` : null;

  return (
    <g data-layer="cornes">
      {QUADRANTS.map(({ key, sx, sy }) => {
        const d = lugPath(sx, sy);
        // La lumière vient du haut-gauche : le chanfrein l'accroche à gauche et
        // en haut, il reste dans l'ombre sur la corne opposée.
        const lit = sx === -1 || sy === -1;
        return (
          <g key={key}>
            <path d={d} fill={`url(#${uid}-lugs)`} />
            {finishPattern && <path d={d} fill={finishPattern} />}
            {/* La corne plonge vers le poignet : sa pointe s'assombrit. */}
            <path d={d} fill={`url(#${uid}-lug-fall-${sy === -1 ? "haut" : "bas"})`} />
            <path
              d={lugBevel(sx, sy)}
              fill="none"
              stroke={lit ? ramp.light : ramp.dark}
              strokeOpacity={lit ? (finish === "microbille" ? 0.45 : 0.85) : 0.5}
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Flanc intérieur, dans l'ombre du bracelet. */}
            <line
              x1={C + sx * (LUG_INNER + 2)}
              y1={C + sy * 296}
              x2={C + sx * (LUG_INNER + 2)}
              y2={C + sy * (LUG_TIP - 12)}
              stroke={ramp.dark}
              strokeOpacity="0.55"
              strokeWidth="4"
            />
            <path d={d} fill="none" stroke={ramp.edge} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
}

export function Case({
  uid,
  metal,
  finish,
}: {
  uid: string;
  metal: MetalTone;
  finish: CaseFinish;
}) {
  const ramp = METALS[metal];
  const finishPattern =
    finish === "brosse" ? `url(#${uid}-brushed)` : finish === "microbille" ? `url(#${uid}-beaded)` : null;

  return (
    <g data-layer="boitier">
      <Lugs uid={uid} metal={metal} finish={finish} />

      <circle cx="500" cy="500" r={R_CASE} fill={`url(#${uid}-case)`} />
      {finishPattern && <circle cx="500" cy="500" r={R_CASE} fill={finishPattern} />}
      {finish === "poli" && (
        <circle
          cx="500"
          cy="500"
          r={R_CASE - 6}
          fill="none"
          stroke={ramp.light}
          strokeOpacity="0.55"
          strokeWidth="7"
          strokeDasharray="210 300"
          strokeDashoffset="120"
        />
      )}
      {/* Pénombre au pied du flanc, à l'opposé de la lumière rasante : la
          carrure garde du volume même en microbillé ou brossé, sans reflet. */}
      <circle
        cx="500"
        cy="500"
        r={R_CASE - 5}
        fill="none"
        stroke={ramp.dark}
        strokeOpacity="0.4"
        strokeWidth="9"
        strokeDasharray="230 460"
        strokeDashoffset="375"
      />
      <circle cx="500" cy="500" r={R_CASE} fill="none" stroke={ramp.edge} strokeWidth="2.5" />
    </g>
  );
}
