import { INK, METALS } from "../palette";
import { C, R_CASE, n } from "../geometry";
import type { CrownStyle, MetalTone } from "../types";

const X0 = C + R_CASE - 14;
const X1 = C + R_CASE + 44;
const R = 40;

/**
 * Couronne, dessinée avant le boîtier : son pied disparaît sous le flanc. C'est
 * un cylindre couché : l'ombrage et l'écartement des cannelures suivent sa
 * courbure, serrés vers les bords, larges au sommet.
 */
export function Crown({ uid, style, metal }: { uid: string; style: CrownStyle; metal: MetalTone }) {
  const ramp = METALS[metal];
  const grooves = [-72, -56, -41, -27, -13, 0, 13, 27, 41, 56, 72];
  return (
    <g data-layer="couronne">
      {/* Tube. */}
      <rect x={X0 - 16} y={C - 24} width="26" height="48" fill={`url(#${uid}-metal-${metal})`} />
      <rect x={X0 - 16} y={C - 24} width="26" height="48" fill={INK} fillOpacity="0.35" />
      {/* Corps, légèrement conique. */}
      <path
        d={`M ${X0} ${C - R} L ${X1 - 5} ${C - R + 5} Q ${X1} ${C - R + 6} ${X1} ${C - R + 11} L ${X1} ${C + R - 11} Q ${X1} ${C + R - 6} ${X1 - 5} ${C + R - 5} L ${X0} ${C + R} Z`}
        fill={`url(#${uid}-metal-${metal})`}
        stroke={ramp.edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Cannelures de préhension : une gorge sombre, son arête claire. */}
      {grooves.map((deg) => {
        const y = n(C + (R - 3) * Math.sin((deg * Math.PI) / 180));
        const lit = Math.cos(((deg + 38) * Math.PI) / 180);
        return (
          <g key={deg}>
            <line x1={X0 + 3} y1={y} x2={X1 - 9} y2={y} stroke={INK} strokeOpacity="0.55" strokeWidth="2.4" />
            <line
              x1={X0 + 3}
              y1={y + 1.8}
              x2={X1 - 9}
              y2={y + 1.8}
              stroke={ramp.hi}
              strokeOpacity={n(Math.max(0.08, lit * 0.7))}
              strokeWidth="1"
            />
          </g>
        );
      })}
      {/* Tête de couronne : une face polie, vue par la tranche. */}
      <rect x={X1 - 8} y={C - R + 9} width="8" height={R * 2 - 18} rx="3" fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="0.8" />
      {style === "signee" && (
        <line x1={X1 - 4} y1={C - 9} x2={X1 - 4} y2={C + 9} stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {/* La carrure porte son ombre sur le pied de couronne. */}
      <rect x={X0 - 2} y={C - R} width="12" height={R * 2} fill={INK} fillOpacity="0.28" />
    </g>
  );
}

/** Protège-couronne : dessinés après le boîtier, ils enveloppent la couronne. */
export function CrownGuards({ uid, metal }: { uid: string; metal: MetalTone }) {
  const ramp = METALS[metal];
  const d = `M ${C + R_CASE - 56} ${C - 66} Q ${C + R_CASE + 6} ${C - 60} ${X0 + 4} ${C - 30}
            L ${X0 + 4} ${C + 30} Q ${C + R_CASE + 6} ${C + 60} ${C + R_CASE - 56} ${C + 66} Z`;
  return (
    <g data-layer="protege-couronne">
      <path d={d} fill={`url(#${uid}-case)`} stroke={ramp.edge} strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d={`M ${C + R_CASE - 8} ${C - 60} Q ${C + R_CASE + 4} ${C - 56} ${X0 + 1} ${C - 31}`}
        fill="none"
        stroke={ramp.hi}
        strokeOpacity="0.8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}
