import { INK, METALS } from "../palette";
import { C, R_CASE, n } from "../geometry";
import type { CrownStyle, MetalTone } from "../types";

const X0 = C + R_CASE - 14;
const X1 = C + R_CASE + 44;
const R = 40;

/**
 * Place une pièce de flanc à son heure. La couronne est dessinée à 3 h puis
 * tournée de 30° par heure ; de dos, la montre est retournée autour de l'axe
 * 12 h – 6 h : le miroir horizontal met la couronne de 3 h à gauche, celle de
 * 4 h en bas à gauche, sans inverser le haut et le bas de son éclairage.
 */
export function flankTransform(at: 2 | 3 | 4, mirror: boolean): string | undefined {
  const parts: string[] = [];
  if (mirror) parts.push(`translate(${2 * C} 0) scale(-1 1)`);
  if (at !== 3) parts.push(`rotate(${(at - 3) * 30} ${C} ${C})`);
  return parts.length ? parts.join(" ") : undefined;
}

/**
 * Couronne, dessinée avant le boîtier : son pied disparaît sous le flanc. C'est
 * un cylindre couché : l'ombrage et l'écartement des cannelures suivent sa
 * courbure, serrés vers les bords, larges au sommet.
 */
export function Crown({
  uid,
  style,
  metal,
  at = 3,
  offset = 0,
  size = 1,
  mirror = false,
}: {
  uid: string;
  style: CrownStyle;
  metal: MetalTone;
  /** Position horaire. 4 h : la couronne déportée des plongeuses japonaises. */
  at?: 2 | 3 | 4;
  /** Recul ou avancée le long du rayon : le flanc d'un coussin est plus loin du centre. */
  offset?: number;
  /** Une seconde couronne (réhaut tournant) est plus menue que celle de remontage. */
  size?: number;
  /** Vue de dos. */
  mirror?: boolean;
}) {
  const ramp = METALS[metal];
  const grooves = [-72, -56, -41, -27, -13, 0, 13, 27, 41, 56, 72];
  const r = R * size;
  const x0 = X0 + offset;
  const x1 = x0 + (X1 - X0) * size;
  return (
    <g data-layer="couronne" transform={flankTransform(at, mirror)}>
      {/* Tube. */}
      <rect x={x0 - 16} y={C - r * 0.6} width="26" height={r * 1.2} fill={`url(#${uid}-metal-${metal})`} />
      <rect x={x0 - 16} y={C - r * 0.6} width="26" height={r * 1.2} fill={INK} fillOpacity="0.35" />
      {/* Corps, légèrement conique. */}
      <path
        d={`M ${x0} ${C - r} L ${x1 - 5} ${C - r + 5} Q ${x1} ${C - r + 6} ${x1} ${C - r + 11} L ${x1} ${C + r - 11} Q ${x1} ${C + r - 6} ${x1 - 5} ${C + r - 5} L ${x0} ${C + r} Z`}
        fill={`url(#${uid}-metal-${metal})`}
        stroke={ramp.edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Cannelures de préhension : une gorge sombre, son arête claire. */}
      {grooves.map((deg) => {
        const y = n(C + (r - 3) * Math.sin((deg * Math.PI) / 180));
        const lit = Math.cos(((deg + 38) * Math.PI) / 180);
        return (
          <g key={deg}>
            <line x1={x0 + 3} y1={y} x2={x1 - 9} y2={y} stroke={INK} strokeOpacity="0.55" strokeWidth={n(2.4 * size)} />
            <line
              x1={x0 + 3}
              y1={y + 1.8}
              x2={x1 - 9}
              y2={y + 1.8}
              stroke={ramp.hi}
              strokeOpacity={n(Math.max(0.08, lit * 0.7))}
              strokeWidth="1"
            />
          </g>
        );
      })}
      {/* Tête de couronne : une face polie, vue par la tranche. */}
      <rect x={x1 - 8} y={C - r + 9} width="8" height={r * 2 - 18} rx="3" fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="0.8" />
      {style === "signee" && (
        <line x1={x1 - 4} y1={C - 9} x2={x1 - 4} y2={C + 9} stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {/* La carrure porte son ombre sur le pied de couronne. */}
      <rect x={x0 - 2} y={C - r} width="12" height={r * 2} fill={INK} fillOpacity="0.28" />
    </g>
  );
}

/** Protège-couronne : dessinés après le boîtier, ils enveloppent la couronne. */
export function CrownGuards({
  uid,
  metal,
  at = 3,
  mirror = false,
}: {
  uid: string;
  metal: MetalTone;
  at?: 3 | 4;
  mirror?: boolean;
}) {
  const ramp = METALS[metal];
  const d = `M ${C + R_CASE - 56} ${C - 66} Q ${C + R_CASE + 6} ${C - 60} ${X0 + 4} ${C - 30}
            L ${X0 + 4} ${C + 30} Q ${C + R_CASE + 6} ${C + 60} ${C + R_CASE - 56} ${C + 66} Z`;
  return (
    <g data-layer="protege-couronne" transform={flankTransform(at, mirror)}>
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
