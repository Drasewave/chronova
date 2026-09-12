import { METALS, shade, tint } from "../palette";
import { C, R_CASE, n, polar } from "../geometry";
import type { WatchRender } from "../types";

/**
 * Vue de dos.
 *
 * Fond plein : acier vissé, six encoches de clé, gravure au centre — l'aperçu
 * est direct, c'est là que le texte saisi dans le configurateur apparaît.
 * Fond transparent : saphir, et le mouvement travaille dessous. Le dessin change
 * avec le calibre (le NH34 porte une roue de plus, le NH38 un balancier décalé).
 */
export function BackView({ uid, render }: { uid: string; render: WatchRender }) {
  const ramp = METALS[render.caseMetal];
  const rFond = R_CASE - 26;

  return (
    <g data-view="dos">
      <circle cx={C} cy={C} r={R_CASE} fill={`url(#${uid}-case)`} stroke={ramp.edge} strokeWidth="2.5" />
      {render.caseFinish === "brosse" && <circle cx={C} cy={C} r={R_CASE} fill={`url(#${uid}-brushed)`} />}

      {/* Encoches de la clé à fond. */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = polar(rFond + 12, i * 60 + 30);
        return <circle key={i} cx={n(p.x)} cy={n(p.y)} r="13" fill={ramp.dark} stroke={ramp.edge} strokeWidth="1.5" />;
      })}

      <circle cx={C} cy={C} r={rFond} fill={ramp.mid} stroke={ramp.edge} strokeWidth="2" />

      {render.caseback === "transparent" ? (
        <>
          <Movement uid={uid} render={render} radius={rFond - 26} />
          <text
            x={C}
            y={C - rFond + 44}
            textAnchor="middle"
            fill={shade(ramp.mid, 0.5)}
            style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.18em" }}
          >
            {render.movement} · 24 RUBIS
          </text>
        </>
      ) : (
        <SolidBack uid={uid} render={render} radius={rFond - 10} />
      )}

      {/* Gravure : au centre sur un fond plein, sur le pourtour sur un saphir. */}
      {render.engraving && render.caseback === "plein" && (
        <text
          x={C}
          y={C + 128}
          textAnchor="middle"
          fill={shade(ramp.mid, 0.55)}
          style={{ fontFamily: "var(--font-title)", fontSize: 34, letterSpacing: "0.04em" }}
        >
          {render.engraving}
        </text>
      )}
      {render.engraving && render.caseback === "transparent" && (
        <text
          x={C}
          y={C + rFond - 56}
          textAnchor="middle"
          fill={shade(ramp.mid, 0.55)}
          style={{ fontFamily: "var(--font-mono)", fontSize: 17, letterSpacing: "0.12em" }}
        >
          {render.engraving}
        </text>
      )}
    </g>
  );
}

function SolidBack({ uid, render, radius }: { uid: string; render: WatchRender; radius: number }) {
  const ramp = METALS[render.caseMetal];
  return (
    <g>
      <circle cx={C} cy={C} r={radius} fill={`url(#${uid}-case)`} />
      <circle cx={C} cy={C} r={radius - 30} fill="none" stroke={ramp.dark} strokeOpacity="0.5" strokeWidth="1.5" />
      <text
        x={C}
        y={C - 64}
        textAnchor="middle"
        fill={shade(ramp.mid, 0.5)}
        style={{ fontFamily: "var(--font-title)", fontSize: 36, letterSpacing: "0.24em" }}
      >
        CHRONOVA
      </text>
      <text
        x={C}
        y={C - 22}
        textAnchor="middle"
        fill={shade(ramp.mid, 0.42)}
        style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.2em" }}
      >
        ASSEMBLÉ À LA MAIN
      </text>
      <text
        x={C}
        y={C + 12}
        textAnchor="middle"
        fill={shade(ramp.mid, 0.42)}
        style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.2em" }}
      >
        ACIER 316L · {render.movement}
      </text>
      <text
        x={C}
        y={C + 46}
        textAnchor="middle"
        fill={shade(ramp.mid, 0.42)}
        style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.2em" }}
      >
        {render.caseSize} MM
      </text>
    </g>
  );
}

function Movement({ uid, render, radius }: { uid: string; render: WatchRender; radius: number }) {
  const platine = "#C9C2B3";
  const pont = "#B6AE9C";
  const arete = "#7A7367";
  const balancierX = C - 96;
  const balancierY = C + 104;

  return (
    <g>
      {/* Saphir et anneau de fond. */}
      <circle cx={C} cy={C} r={radius + 22} fill="#8E999C" />
      <circle cx={C} cy={C} r={radius + 10} fill={platine} stroke={arete} strokeWidth="2" />

      {/* Perlage : les cercles concentriques du décor de platine. */}
      {[radius - 12, radius - 52, radius - 92].map((r) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke={tint(platine, 0.4)} strokeOpacity="0.5" strokeWidth="6" strokeDasharray="3 9" />
      ))}

      {/* Ponts, avec leurs arêtes adoucies. */}
      <path
        d={`M ${C - 168} ${C - 24} C ${C - 120} ${C - 96} ${C + 30} ${C - 104} ${C + 112} ${C - 46}
            C ${C + 168} ${C - 6} ${C + 150} ${C + 76} ${C + 78} ${C + 96}
            C ${C - 10} ${C + 120} ${C - 130} ${C + 60} ${C - 168} ${C - 24} Z`}
        fill={pont}
        stroke={arete}
        strokeWidth="2.5"
      />
      <path
        d={`M ${C - 150} ${C - 22} C ${C - 106} ${C - 84} ${C + 26} ${C - 90} ${C + 100} ${C - 38}`}
        fill="none"
        stroke={tint(pont, 0.55)}
        strokeOpacity="0.8"
        strokeWidth="3"
      />

      {/* Balancier : la pièce qui bat, volontairement laissée dégagée. */}
      <path
        d={`M ${balancierX - 96} ${balancierY - 34} C ${balancierX - 30} ${balancierY - 80} ${balancierX + 62} ${balancierY - 56} ${balancierX + 74} ${balancierY + 10} Z`}
        fill={pont}
        stroke={arete}
        strokeWidth="2.5"
      />
      <circle cx={balancierX} cy={balancierY} r="62" fill="none" stroke="#95907F" strokeWidth="9" />
      <circle cx={balancierX} cy={balancierY} r="62" fill="none" stroke={tint(pont, 0.5)} strokeWidth="2.5" />
      {[0, 120, 240].map((angle) => (
        <line
          key={angle}
          x1={balancierX}
          y1={balancierY}
          x2={balancierX + 62 * Math.cos((angle * Math.PI) / 180)}
          y2={balancierY + 62 * Math.sin((angle * Math.PI) / 180)}
          stroke="#A9A392"
          strokeWidth="6"
        />
      ))}
      <circle cx={balancierX} cy={balancierY} r="13" fill="#C09755" stroke={arete} strokeWidth="1.5" />

      {/* Rubis en chatons, et vis à fente. */}
      {(
        [
          [C - 34, C - 56],
          [C + 58, C - 30],
          [C + 108, C + 34],
          [C - 122, C + 6],
          ...(render.movement === "NH34" ? ([[C + 24, C + 62]] as [number, number][]) : []),
          ...(render.movement === "NH38" ? ([[C - 66, C - 84]] as [number, number][]) : []),
        ] satisfies [number, number][]
      ).map(([x, y]) => (
        <g key={`r-${x}-${y}`}>
          <circle cx={x} cy={y} r="14" fill="#C09755" stroke={arete} strokeWidth="1.5" />
          <circle cx={x} cy={y} r="8" fill="#A8484B" />
        </g>
      ))}
      {(
        [
          [C - 176, C + 56],
          [C + 150, C - 92],
          [C + 54, C + 140],
        ] satisfies [number, number][]
      ).map(([x, y]) => (
        <g key={`v-${x}-${y}`}>
          <circle cx={x} cy={y} r="14" fill="#D6D0C5" stroke={arete} strokeWidth="1.5" />
          <line x1={x - 9} y1={y} x2={x + 9} y2={y} stroke={arete} strokeWidth="3.5" />
        </g>
      ))}

      {/* Masse oscillante : elle passe par-dessus, comme au poignet. */}
      <g transform={`rotate(-34 ${C} ${C})`}>
        {(() => {
          const r = radius - 10;
          const rInterieur = r - 52;
          return (
            <>
              <path
                d={`M ${C - r} ${C} a ${r} ${r} 0 0 1 ${r * 2} 0 Z`}
                fill={`url(#${uid}-metal-acier)`}
                stroke={arete}
                strokeWidth="2.5"
              />
              {/* Segment lourd du pourtour : c'est lui qui fait tourner la masse. */}
              <path
                d={`M ${C - r} ${C} a ${r} ${r} 0 0 1 ${r * 2} 0 L ${C + rInterieur} ${C} a ${rInterieur} ${rInterieur} 0 0 0 ${-rInterieur * 2} 0 Z`}
                fill="#8C8472"
                stroke={arete}
                strokeWidth="2.5"
              />
              <path
                d={`M ${C - rInterieur} ${C} a ${rInterieur} ${rInterieur} 0 0 1 ${rInterieur * 2} 0`}
                fill="none"
                stroke={tint(pont, 0.55)}
                strokeOpacity="0.85"
                strokeWidth="3"
              />
              <path
                d={`M ${C - r + 26} ${C - 10} a ${r - 26} ${r - 26} 0 0 1 ${(r - 26) * 2} 0`}
                fill="none"
                stroke={tint(pont, 0.6)}
                strokeOpacity="0.6"
                strokeWidth="4"
                strokeDasharray="2 10"
              />
            </>
          );
        })()}
      </g>
      <circle cx={C} cy={C} r="20" fill="#B0A899" stroke={arete} strokeWidth="2" />
      <circle cx={C} cy={C} r="8" fill="#8E887A" />

    </g>
  );
}
