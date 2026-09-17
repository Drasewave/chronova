import { C, R_DIAL } from "../geometry";
import type { Crystal as CrystalKind } from "../types";

/**
 * Verre saphir. Le reflet est un simple dégradé translaté : aucune image, aucun
 * filtre coûteux, donc un suivi du pointeur à 60 images par seconde.
 * `sheen` va de -1 à 1 sur chaque axe ; 0,0 = montre de face.
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
  return (
    <g data-layer="verre" clipPath={`url(#${uid}-dial-clip)`}>
      {antiGlare && <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-ar)`} />}

      {/* Le saphir bombé courbe la lumière sur tout le pourtour. */}
      {kind === "bombe" && (
        <>
          <circle
            cx={C}
            cy={C}
            r={R_DIAL - 10}
            fill="none"
            stroke="#FBF8F3"
            strokeOpacity="0.16"
            strokeWidth="20"
          />
          <circle
            cx={C}
            cy={C}
            r={R_DIAL - 4}
            fill="none"
            stroke="#FBF8F3"
            strokeOpacity="0.3"
            strokeWidth="6"
            strokeDasharray="300 640"
            strokeDashoffset="500"
          />
        </>
      )}

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
          y={C - 150}
          width="1400"
          height="300"
          fill={`url(#${uid}-sheen)`}
          transform={`rotate(-26 ${C} ${C})`}
        />
      </g>
    </g>
  );
}
