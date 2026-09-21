import { LUME_EDGE, LUME_FILL, METALS, isLight, rampAt, shade, tint, type MetalRamp } from "../palette";
import { C, R_INDEX_IN, R_INDEX_OUT, n, polar } from "../geometry";
import type { IndexStyle, MetalTone } from "../types";
import { studioLum } from "./conic";

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
  if (style === "plongee") {
    return <Plongee metal={metal} lume={lume} outer={outerRadius} inner={innerRadius} skipHour={skipHour} />;
  }
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

/** Une facette polie inclinée à 45° : jamais tout à fait noire, elle voit aussi le plafond. */
function facet(ramp: MetalRamp, normal: number): string {
  return rampAt(ramp, 0.24 + 0.76 * studioLum(normal, "poli"));
}

/**
 * Index bâtons appliqués : un bloc de métal biseauté sur ses quatre côtés, le
 * luminova coulé dans sa cuvette. Chaque biseau prend la couleur de ce qu'il
 * regarde — l'index de 10 h et celui de 4 h ne brillent donc pas pareil.
 */
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
  const b = 4.2;

  const baton = (angle: number, offsetX: number, width: number) => {
    const x0 = offsetX - width / 2;
    const x1 = offsetX + width / 2;
    const y0 = -outer;
    const y1 = -inner;
    return (
      <g>
        <path d={`M ${x0} ${y0} L ${x0 + b} ${y0 + b} L ${x0 + b} ${y1 - b} L ${x0} ${y1} Z`} fill={facet(ramp, angle - 90)} />
        <path d={`M ${x1} ${y0} L ${x1 - b} ${y0 + b} L ${x1 - b} ${y1 - b} L ${x1} ${y1} Z`} fill={facet(ramp, angle + 90)} />
        <path d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1 - b} ${y0 + b} L ${x0 + b} ${y0 + b} Z`} fill={facet(ramp, angle)} />
        <path d={`M ${x0} ${y1} L ${x1} ${y1} L ${x1 - b} ${y1 - b} L ${x0 + b} ${y1 - b} Z`} fill={facet(ramp, angle + 180)} />
        <rect
          x={x0 + b}
          y={y0 + b}
          width={width - b * 2}
          height={y1 - y0 - b * 2}
          fill={lume ? LUME_FILL : rampAt(ramp, 0.7)}
          stroke={lume ? LUME_EDGE : ramp.dark}
          strokeOpacity="0.7"
          strokeWidth="0.8"
        />
        <rect x={x0} y={y0} width={width} height={y1 - y0} fill="none" stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="0.9" />
      </g>
    );
  };

  return (
    <g data-layer="index" transform={`translate(${C} ${C})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (hour === skipHour) return null;
        const angle = i * 30;
        return (
          <g key={i} transform={`rotate(${angle})`}>
            {i === 0 ? (
              <>
                {baton(angle, -15, 23)}
                {baton(angle, 15, 23)}
              </>
            ) : (
              baton(angle, 0, i % 3 === 0 ? 31 : 23)
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Index de plongeuse : trois formes pour s'orienter dans le noir sans lire un
 * chiffre. Le dessin suit les plongeuses japonaises : un trapèze à midi, de
 * longs ovales à 6 h et 9 h (et à 3 h s'il n'y a pas de guichet), de gros ronds
 * ailleurs — des plots généreux, presque jointifs avec la minuterie, parce que
 * la surface de luminova fait la lisibilité. Chaque plot est une cuvette de
 * métal poli remplie de luminova.
 */
function Plongee({
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
  const fill = lume ? LUME_FILL : rampAt(ramp, 0.72);
  const stroke = lume ? LUME_EDGE : ramp.dark;
  // Un cadran GMT ou boussole resserre ses index : on garde alors des plots sages.
  const large = outer >= 250;
  const mid = (outer + inner) / 2 - (large ? 2 : 0);
  const r = (outer - inner) / 2 + (large ? 5 : 1);
  const b = 4.4; // largeur du sertissage
  const cadre = { stroke: ramp.edge, strokeOpacity: 0.75, strokeWidth: 0.9, strokeLinejoin: "round" as const };

  return (
    <g data-layer="index" transform={`translate(${C} ${C})`}>
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (hour === skipHour) return null;
        const angle = i * 30;
        // Le sertissage est éclairé d'un côté, dans l'ombre de l'autre : un
        // dégradé ne tournerait pas avec l'index, deux demi-anneaux si.
        const lit = facet(ramp, angle - 60);
        const shaded = facet(ramp, angle + 120);

        if (i === 0) {
          // Trapèze, grande base vers l'extérieur : il pointe le centre.
          const y0 = -outer - (large ? 4 : 2);
          const y1 = -inner + (large ? 6 : 2);
          const a = large ? 31 : 25; // demi-grande base
          const c = large ? 13 : 10; // demi-petite base
          const pente = (a - c) / (y1 - y0);
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <path d={`M ${-a} ${y0} L ${a} ${y0} L ${c} ${y1} L ${-c} ${y1} Z`} fill={shaded} {...cadre} />
              <path d={`M ${-a} ${y0} L ${-c} ${y1} L ${n(-c + b)} ${n(y1 - b)} L ${n(-a + b + pente * b)} ${n(y0 + b)} Z`} fill={lit} />
              <path
                d={`M ${n(-a + b + pente * b + 1)} ${n(y0 + b)} L ${n(a - b - pente * b - 1)} ${n(y0 + b)} L ${n(c - b + 1)} ${n(y1 - b)} L ${n(-c + b - 1)} ${n(y1 - b)} Z`}
                fill={fill}
                stroke={stroke}
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
            </g>
          );
        }

        if (i % 3 === 0) {
          // Ovale allongé : un bâton aux bouts ronds, plus long à 6 h et 9 h.
          const w = large ? 30 : 25;
          const y0 = -outer - (large ? 3 : 0);
          const y1 = -inner + (large ? (i === 3 ? 2 : 9) : 0);
          const h = w / 2;
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <rect x={-h} y={y0} width={w} height={y1 - y0} rx={h} fill={shaded} {...cadre} />
              <path d={`M 0 ${y0} A ${h} ${h} 0 0 0 ${-h} ${y0 + h} L ${-h} ${y1 - h} A ${h} ${h} 0 0 0 0 ${y1} Z`} fill={lit} />
              <rect x={-h + b} y={y0 + b} width={w - b * 2} height={y1 - y0 - b * 2} rx={h - b} fill={fill} stroke={stroke} strokeWidth="0.8" />
            </g>
          );
        }

        return (
          <g key={i} transform={`rotate(${angle})`}>
            <circle cy={-mid} r={r} fill={shaded} {...cadre} />
            <path d={`M ${-r} ${-mid} A ${r} ${r} 0 0 1 0 ${-mid - r} L 0 ${-mid} Z`} fill={lit} />
            <circle cy={-mid} r={r - b} fill={fill} stroke={stroke} strokeWidth="0.8" />
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
  // Échelle 24 h ou réhaut boussole : la couronne d'index se resserre. Les
  // chiffres rapetissent et rentrent, pour que leur plot ne morde ni sur eux ni
  // sur la minuterie.
  const serre = outer < 250;
  const rChiffre = inner + (serre ? 17 : 26);
  const corps = serre ? 40 : 48;
  const rPlot = serre ? 6 : 7.5;

  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        const p = polar(rChiffre, i * 30);
        const dot = polar(outer + (serre ? 3 : 4), i * 30);
        return (
          <g key={i}>
            {hour !== skipHour && (
              <text
                x={n(p.x)}
                y={n(p.y + corps * 0.355)}
                textAnchor="middle"
                fill={ink}
                stroke={lume ? LUME_EDGE : "none"}
                strokeWidth="0.9"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: hour === 12 ? corps + 6 : corps,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                }}
              >
                {hour}
              </text>
            )}
            {/* Plot luminescent serti, au droit de chaque heure. */}
            <circle cx={n(dot.x)} cy={n(dot.y)} r={rPlot} fill={facet(ramp, i * 30 + 140)} stroke={ramp.edge} strokeWidth="0.8" />
            <circle
              cx={n(dot.x)}
              cy={n(dot.y)}
              r={rPlot - 2.5}
              fill={lume ? LUME_FILL : ramp.light}
              stroke={lume ? LUME_EDGE : ramp.dark}
              strokeWidth="0.8"
            />
          </g>
        );
      })}
    </g>
  );
}
