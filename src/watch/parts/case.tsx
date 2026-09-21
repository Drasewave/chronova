import { INK, METALS, rampAt } from "../palette";
import { C, R_BEZEL_OUT, R_CASE, R_LUG_TIP as LUG_TIP } from "../geometry";
import type { CaseFinish, MetalTone } from "../types";
import { Ring } from "./conic";

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

/**
 * Chanfrein poli le long du flanc extérieur : une vraie facette, fermée, entre
 * l'arête de la corne et son plat brossé — pas un trait posé dessus.
 */
function lugBevel(sx: 1 | -1, sy: 1 | -1): string {
  const p = (x: number, d: number) => `${C + sx * x} ${C + sy * d}`;
  return [
    `M ${p(235, LUG_TIP - 26)}`,
    `C ${p(240, 350)} ${p(268, 250)} ${p(311, 165)}`,
    `L ${p(294, 172)}`,
    `C ${p(254, 256)} ${p(227, 352)} ${p(221, LUG_TIP - 24)}`,
    "Z",
  ].join(" ");
}

/** Arête vive entre le plat et le chanfrein. */
function lugRidge(sx: 1 | -1, sy: 1 | -1): string {
  const p = (x: number, d: number) => `${C + sx * x} ${C + sy * d}`;
  return `M ${p(221, LUG_TIP - 24)} C ${p(227, 352)} ${p(254, 256)} ${p(294, 172)}`;
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
  const matte = finish === "microbille";

  return (
    <g data-layer="cornes">
      {QUADRANTS.map(({ key, sx, sy }) => {
        const d = lugPath(sx, sy);
        // La lumière vient du haut-gauche : le chanfrein gauche renvoie la boîte
        // principale, le droit seulement la bande de débouchage.
        const lit = sx === -1;
        return (
          <g key={key}>
            <path d={d} fill={`url(#${uid}-lugs)`} />
            {finishPattern && <path d={d} fill={finishPattern} />}
            {/* La corne plonge vers le poignet : sa pointe s'assombrit. */}
            <path d={d} fill={`url(#${uid}-lug-fall-${sy === -1 ? "haut" : "bas"})`} />
            <path
              d={lugBevel(sx, sy)}
              fill={lit ? `url(#${uid}-lug-bevel)` : rampAt(ramp, matte ? 0.34 : 0.26)}
              opacity={matte ? 0.7 : 1}
            />
            <path
              d={lugRidge(sx, sy)}
              fill="none"
              stroke={lit ? ramp.dark : ramp.hi}
              strokeOpacity={lit ? 0.5 : matte ? 0.35 : 0.8}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Flanc intérieur, dans l'ombre du bracelet. */}
            <line
              x1={C + sx * (LUG_INNER + 2)}
              y1={C + sy * 296}
              x2={C + sx * (LUG_INNER + 2)}
              y2={C + sy * (LUG_TIP - 12)}
              stroke={INK}
              strokeOpacity="0.4"
              strokeWidth="4"
            />
            <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.6" strokeLinejoin="round" />
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

  return (
    <g data-layer="boitier">
      <Lugs uid={uid} metal={metal} finish={finish} />

      {/* Plat de carrure : seule la couronne qui dépasse de la lunette se voit. */}
      <circle cx="500" cy="500" r={R_CASE - 1} fill={ramp.mid} />
      <Ring id={`${uid}-clip-carrure`} disk={`${uid}-conic-case`} rOut={R_CASE} rIn={R_BEZEL_OUT - 8} />
      {/* Chanfrein poli du bord de carrure. */}
      <Ring
        id={`${uid}-clip-carrure-chanfrein`}
        disk={`${uid}-conic-poli`}
        rOut={R_CASE}
        rIn={R_CASE - 3.5}
        opacity={finish === "microbille" ? 0.45 : 0.95}
      />
      {/* La lunette porte son ombre sur le plat de carrure. */}
      <circle cx="502" cy="503" r={R_BEZEL_OUT + 1} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="4" />
      <circle cx="500" cy="500" r={R_CASE} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.6" />
    </g>
  );
}
