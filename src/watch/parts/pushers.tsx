import { METALS } from "../palette";
import { C, R_CASE } from "../geometry";
import type { MetalTone } from "../types";

const X0 = C + R_CASE - 22;
const X1 = C + R_CASE + 26;

/**
 * Poussoirs du chronographe : dessinés avant le boîtier, comme la couronne,
 * pour que leur pied disparaisse sous le flanc. Deux tubes courts, symétriques
 * de part et d'autre de la couronne (VK64 uniquement).
 */
export function Pushers({ uid, metal, mirror = false }: { uid: string; metal: MetalTone; mirror?: boolean }) {
  const ramp = METALS[metal];

  const pusher = (centerY: number) => (
    <g key={centerY}>
      <rect x={X0 - 10} y={centerY - 19} width="20" height="38" fill={ramp.dark} stroke={ramp.edge} strokeWidth="1.5" />
      <path
        d={`M ${X0} ${centerY - 22} L ${X1} ${centerY - 17} L ${X1} ${centerY + 17} L ${X0} ${centerY + 22} Z`}
        fill={`url(#${uid}-metal-${metal})`}
        stroke={ramp.edge}
        strokeWidth="2"
      />
      <line x1={X0 + 4} y1={centerY} x2={X1 - 4} y2={centerY} stroke={ramp.light} strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
    </g>
  );

  return (
    // De dos la montre est retournée : les poussoirs passent à gauche.
    <g data-layer="poussoirs" transform={mirror ? `translate(${2 * C} 0) scale(-1 1)` : undefined}>
      {pusher(C - 80)}
      {pusher(C + 80)}
    </g>
  );
}
