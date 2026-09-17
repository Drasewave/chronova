import { METALS } from "../palette";
import { C, R_CASE } from "../geometry";
import type { CrownStyle, MetalTone } from "../types";

const X0 = C + R_CASE - 14;
const X1 = C + R_CASE + 44;

/** Couronne, dessinée avant le boîtier : son pied disparaît sous le flanc. */
export function Crown({ uid, style, metal }: { uid: string; style: CrownStyle; metal: MetalTone }) {
  const ramp = METALS[metal];
  return (
    <g data-layer="couronne">
      {/* Tube. */}
      <rect x={X0 - 16} y={C - 26} width="26" height="52" fill={ramp.dark} stroke={ramp.edge} strokeWidth="1.5" />
      {/* Corps, légèrement conique. */}
      <path
        d={`M ${X0} ${C - 40} L ${X1} ${C - 33} L ${X1} ${C + 33} L ${X0} ${C + 40} Z`}
        fill={`url(#${uid}-metal-${metal})`}
        stroke={ramp.edge}
        strokeWidth="2"
      />
      {/* Cannelures de préhension. */}
      {Array.from({ length: 7 }, (_, i) => {
        const y = C - 28 + i * 9.4;
        return (
          <line
            key={i}
            x1={X0 + 3}
            y1={y}
            x2={X1 - 3}
            y2={y}
            stroke={i % 2 === 0 ? ramp.dark : ramp.light}
            strokeOpacity="0.8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
      {style === "signee" && (
        <text
          x={X1 - 12}
          y={C + 9}
          textAnchor="middle"
          fill={ramp.dark}
          style={{ fontFamily: "var(--font-title)", fontSize: 24 }}
        >
          C
        </text>
      )}
    </g>
  );
}

/** Protège-couronne : dessinés après le boîtier, ils enveloppent la couronne. */
export function CrownGuards({ uid, metal }: { uid: string; metal: MetalTone }) {
  const ramp = METALS[metal];
  return (
    <g data-layer="protege-couronne">
      <path
        d={`M ${C + R_CASE - 56} ${C - 62} Q ${C + R_CASE + 4} ${C - 58} ${X0 + 2} ${C - 30}
            L ${X0 + 2} ${C + 30} Q ${C + R_CASE + 4} ${C + 58} ${C + R_CASE - 56} ${C + 62} Z`}
        fill={`url(#${uid}-case)`}
        stroke={ramp.edge}
        strokeWidth="2"
      />
    </g>
  );
}
