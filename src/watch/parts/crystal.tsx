import { PAPER } from "../palette";
import { C, R_DIAL } from "../geometry";
import type { Crystal as CrystalKind } from "../types";

/**
 * Verre saphir. Un saphir traité ne voile pas le cadran : il ne se trahit que
 * par son chant, un liseré de lumière sur le pourtour, et par le reflet discret
 * d'une boîte à lumière. Le reflet est un simple dégradé translaté : aucune
 * image, aucun filtre coûteux, donc un suivi du pointeur à 60 images par
 * seconde. `sheen` va de -1 à 1 sur chaque axe ; 0,0 = montre de face.
 */
export function Crystal({
  uid,
  kind,
  antiGlare,
  sheen = { x: 0, y: 0 },
}: {
  uid: string;
  kind: CrystalKind;
  antiGlare: boolean;
  sheen?: { x: number; y: number };
}) {
  const circ = 2 * Math.PI * (R_DIAL - 3);
  return (
    <g data-layer="verre" clipPath={`url(#${uid}-dial-clip)`}>
      {antiGlare && <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-ar)`} />}

      {/* Le saphir bombé courbe la lumière sur tout le pourtour. */}
      {kind === "bombe" && (
        <circle cx={C} cy={C} r={R_DIAL - 9} fill="none" stroke={PAPER} strokeOpacity="0.1" strokeWidth="18" />
      )}

      {/* Chant du verre : un arc vif face à la boîte principale, un arc faible
          à l'opposé. `rotate` place le début du tiret ; 0° = 3 h. */}
      <circle
        cx={C}
        cy={C}
        r={R_DIAL - 3}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={kind === "bombe" ? 0.8 : 0.6}
        strokeWidth={kind === "bombe" ? 4 : 2.4}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.17} ${circ}`}
        transform={`rotate(-167 ${C} ${C})`}
      />
      <circle
        cx={C}
        cy={C}
        r={R_DIAL - 3}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.09} ${circ}`}
        transform={`rotate(28 ${C} ${C})`}
      />

      {/* Point chaud fixe : le spot studio, discret, qui ne dépend pas du
          survol — c'est le reflet qui bouge par-dessus. */}
      <ellipse
        cx={C - 150}
        cy={C - 176}
        rx="70"
        ry="26"
        fill={`url(#${uid}-hotspot)`}
        opacity={antiGlare ? 0.22 : 0.4}
        transform={`rotate(-40 ${C - 150} ${C - 176})`}
      />

      <g
        data-sheen
        style={{
          transform: `translate(${sheen.x * 120}px, ${sheen.y * 120}px)`,
          transformOrigin: "500px 500px",
          transition: "transform 120ms linear",
        }}
      >
        <rect
          x={C - 700}
          y={C - 330}
          width="1400"
          height="300"
          fill={`url(#${uid}-sheen)`}
          transform={`rotate(-32 ${C} ${C})`}
        />
      </g>
    </g>
  );
}
