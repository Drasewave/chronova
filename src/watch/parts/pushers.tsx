import { INK, METALS } from "../palette";
import { C, R_CASE } from "../geometry";
import type { MetalTone } from "../types";

const X0 = C + R_CASE - 8;

/**
 * Poussoirs du chronographe, à piston : une bague vissée dans la carrure, une
 * tige étroite, puis une tête plus large qu'on enfonce du pouce. Ils sont
 * dessinés avant le boîtier, comme la couronne, pour que leur pied disparaisse
 * sous le flanc, et posés sur leur rayon à 2 h et à 4 h : le départ en haut, la
 * remise à zéro en bas (VK64 uniquement).
 */
export function Pushers({ uid, metal, mirror = false }: { uid: string; metal: MetalTone; mirror?: boolean }) {
  const ramp = METALS[metal];
  const fill = `url(#${uid}-metal-${metal})`;

  const pusher = (angle: number) => (
    <g key={angle} transform={`rotate(${angle} ${C} ${C})`}>
      {/* Bague : moletée, sombre dans ses gorges. */}
      <rect x={X0 - 4} y={C - 24} width="26" height="48" rx="2" fill={fill} stroke={ramp.edge} strokeWidth="1.3" />
      {[-16, -8, 0, 8, 16].map((dy) => (
        <line key={dy} x1={X0 + 8} y1={C + dy} x2={X0 + 21} y2={C + dy} stroke={INK} strokeOpacity="0.45" strokeWidth="1.6" />
      ))}
      {/* Tige du piston, dans l'ombre de la tête. */}
      <rect x={X0 + 22} y={C - 12} width="14" height="24" fill={fill} stroke={ramp.edge} strokeWidth="1" />
      <rect x={X0 + 22} y={C - 12} width="14" height="24" fill={INK} fillOpacity="0.35" />
      {/* Tête : un champignon poli, chanfreiné. */}
      <path
        d={`M ${X0 + 35} ${C - 22} L ${X0 + 52} ${C - 22} Q ${X0 + 60} ${C - 21} ${X0 + 60} ${C - 13} L ${X0 + 60} ${C + 13} Q ${X0 + 60} ${C + 21} ${X0 + 52} ${C + 22} L ${X0 + 35} ${C + 22} Z`}
        fill={fill}
        stroke={ramp.edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line x1={X0 + 39} y1={C - 11} x2={X0 + 55} y2={C - 11} stroke={ramp.hi} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
      <rect x={X0 + 54} y={C - 16} width="6" height="32" rx="2" fill={INK} fillOpacity="0.18" />
      {/* La carrure porte son ombre sur le pied de la bague. */}
      <rect x={X0 - 4} y={C - 24} width="12" height="48" fill={INK} fillOpacity="0.3" />
    </g>
  );

  return (
    // De dos la montre est retournée : les poussoirs passent à gauche.
    <g data-layer="poussoirs" transform={mirror ? `translate(${2 * C} 0) scale(-1 1)` : undefined}>
      {pusher(-27)}
      {pusher(27)}
    </g>
  );
}
