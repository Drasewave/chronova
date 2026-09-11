import { LUME_EDGE, LUME_FILL, METALS, isLight, shade, tint } from "../palette";
import { C, R_INDEX_IN, R_INDEX_OUT, n, polar } from "../geometry";
import type { IndexStyle, MetalTone } from "../types";

interface IndicesProps {
  style: IndexStyle;
  /** Les index appliqués suivent le métal du boîtier, jamais celui des aiguilles. */
  metal: MetalTone;
  dialColor: string;
  lume: boolean;
  /** Un cadran GMT raccourcit ses index pour loger l'échelle 24 h. */
  outerRadius?: number;
  innerRadius?: number;
  /** Position horaire supprimée, remplacée par le guichet de date. */
  skipHour?: number;
}

export function Indices({
  style,
  metal,
  dialColor,
  lume,
  outerRadius = R_INDEX_OUT,
  innerRadius = R_INDEX_IN,
  skipHour,
}: IndicesProps) {
  return style === "batons" ? (
    <Batons metal={metal} lume={lume} outer={outerRadius} inner={innerRadius} skipHour={skipHour} />
  ) : (
    <Arabes
      metal={metal}
      dialColor={dialColor}
      lume={lume}
      outer={outerRadius}
      inner={innerRadius}
      skipHour={skipHour}
    />
  );
}

/** Index bâtons appliqués : cadre métal, remplissage luminescent. */
function Batons({
  metal,
  lume,
  outer,
  inner,
  skipHour,
}: {
  metal: MetalTone;
  lume: boolean;
  outer: number;
  inner: number;
  skipHour?: number;
}) {
  const ramp = METALS[metal];
  const height = outer - inner;

  const baton = (offsetX: number, width: number) => (
    <g>
      <rect
        x={offsetX - width / 2}
        y={-outer}
        width={width}
        height={height}
        rx="2"
        fill={ramp.mid}
        stroke={ramp.edge}
        strokeWidth="2"
      />
      <rect
        x={offsetX - width / 2 + 4}
        y={-outer + 4}
        width={width - 8}
        height={height - 8}
        rx="1"
        fill={lume ? LUME_FILL : ramp.light}
        stroke={lume ? LUME_EDGE : "none"}
        strokeWidth="1"
      />
    </g>
  );

  return (
    <g data-layer="index" transform={`translate(${C} ${C})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (hour === skipHour) return null;
        return (
          <g key={i} transform={`rotate(${i * 30})`}>
            {i === 0 ? (
              <>
                {baton(-15, 22)}
                {baton(15, 22)}
              </>
            ) : (
              baton(0, i % 3 === 0 ? 30 : 22)
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Chiffres arabes : lecture immédiate, c'est le parti pris des montres de terrain. */
function Arabes({
  metal,
  dialColor,
  lume,
  outer,
  inner,
  skipHour,
}: {
  metal: MetalTone;
  dialColor: string;
  lume: boolean;
  outer: number;
  inner: number;
  skipHour?: number;
}) {
  const light = isLight(dialColor);
  const ink = lume ? LUME_FILL : light ? shade(dialColor, 0.82) : tint(dialColor, 0.86);
  const ramp = METALS[metal];

  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        const p = polar(inner + 28, i * 30);
        const dot = polar(outer + 4, i * 30);
        return (
          <g key={i}>
            {hour !== skipHour && (
              <text
                x={n(p.x)}
                y={n(p.y + 16)}
                textAnchor="middle"
                fill={ink}
                stroke={lume ? LUME_EDGE : "none"}
                strokeWidth="1"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: hour === 12 ? 52 : 46,
                  fontWeight: 500,
                }}
              >
                {hour}
              </text>
            )}
            <circle
              cx={n(dot.x)}
              cy={n(dot.y)}
              r="7"
              fill={lume ? LUME_FILL : ramp.mid}
              stroke={lume ? LUME_EDGE : ramp.edge}
              strokeWidth="1.5"
            />
          </g>
        );
      })}
    </g>
  );
}
