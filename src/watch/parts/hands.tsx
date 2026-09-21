import { LUME_EDGE, LUME_FILL, METALS, rampAt } from "../palette";
import { C, handAngles } from "../geometry";
import type { HandShape, MetalTone, Movement } from "../types";
import { studioLum } from "./conic";

interface HandsProps {
  uid: string;
  shape: HandShape;
  metal: MetalTone;
  lume: boolean;
  movement: Movement;
  time: { hours: number; minutes: number; seconds: number };
  detail?: "full" | "compact";
}

const HOUR_LEN = 182;
const MIN_LEN = 248;
const SEC_LEN = 262;
const GMT_LEN = 214;

/**
 * Aiguilles. Chacune est pliée en deux facettes le long de son axe ; la couleur
 * de chaque facette dépend de l'angle réel de l'aiguille dans le studio, d'où
 * un dégradé à rupture franche propre à chaque aiguille. Les ombres portées
 * sont appliquées hors rotation, pour tomber toutes du même côté, et
 * s'allongent avec la hauteur de l'aiguille sur le canon.
 */
export function Hands({ uid, shape, metal, lume, movement, time, detail = "full" }: HandsProps) {
  const angles = handAngles(time);
  const ramp = METALS[metal];
  const low = `url(#${uid}-hand-shadow)`;
  const high = detail === "full" ? `url(#${uid}-hand-shadow-haut)` : undefined;

  return (
    <g data-layer="aiguilles" transform={`translate(${C} ${C})`}>
      <defs>
        <FacetGradient id={`${uid}-hand-heure`} metal={metal} angle={angles.hour} />
        <FacetGradient id={`${uid}-hand-minute`} metal={metal} angle={angles.minute} />
        <FacetGradient id={`${uid}-hand-seconde`} metal={metal} angle={angles.second} />
        <FacetGradient id={`${uid}-hand-gmt`} metal={metal} angle={angles.gmt} />
      </defs>

      <g filter={low}>
        {movement === "NH34" && (
          <g transform={`rotate(${angles.gmt})`}>
            <GmtHand fill={`url(#${uid}-hand-gmt)`} metal={metal} lume={lume} />
          </g>
        )}
        <g transform={`rotate(${angles.hour})`}>
          <Hand fill={`url(#${uid}-hand-heure)`} shape={shape} role="heure" length={HOUR_LEN} width={36} metal={metal} lume={lume} />
        </g>
        {!high && (
          <>
            <g transform={`rotate(${angles.minute})`}>
              <Hand fill={`url(#${uid}-hand-minute)`} shape={shape} role="minute" length={MIN_LEN} width={26} metal={metal} lume={lume} />
            </g>
            <g transform={`rotate(${angles.second})`}>
              <SecondHand fill={`url(#${uid}-hand-seconde)`} metal={metal} lume={lume} />
            </g>
          </>
        )}
      </g>

      {high && (
        <g filter={high}>
          <g transform={`rotate(${angles.minute})`}>
            <Hand fill={`url(#${uid}-hand-minute)`} shape={shape} role="minute" length={MIN_LEN} width={26} metal={metal} lume={lume} />
          </g>
          <g transform={`rotate(${angles.second})`}>
            <SecondHand fill={`url(#${uid}-hand-seconde)`} metal={metal} lume={lume} />
          </g>
        </g>
      )}

      {/* Canon : un bouchon poli, bombé, qui couvre la base des aiguilles. */}
      <g data-layer="axe">
        <circle r="15" fill={ramp.mid} stroke={ramp.edge} strokeWidth="1.2" />
        <circle r="14" fill={`url(#${uid}-metal-${metal})`} />
        <circle r="8.5" fill={ramp.light} stroke={ramp.dark} strokeOpacity="0.6" strokeWidth="1" />
        <circle cx="-3" cy="-3.5" r="3" fill="#FFFFFF" fillOpacity="0.85" />
      </g>
    </g>
  );
}

/** Dégradé à rupture franche sur l'axe : facette gauche, facette droite. */
function FacetGradient({ id, metal, angle }: { id: string; metal: MetalTone; angle: number }) {
  const ramp = METALS[metal];
  const left = rampAt(ramp, 0.3 + 0.7 * studioLum(angle - 90, "poli"));
  const right = rampAt(ramp, 0.3 + 0.7 * studioLum(angle + 90, "poli"));
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.5" stopColor={left} />
      <stop offset="0.5" stopColor={right} />
    </linearGradient>
  );
}

function Hand({
  fill,
  shape,
  role,
  length,
  width,
  metal,
  lume,
}: {
  fill: string;
  shape: HandShape;
  role: "heure" | "minute";
  length: number;
  width: number;
  metal: MetalTone;
  lume: boolean;
}) {
  const ramp = METALS[metal];
  const lumeFill = lume ? LUME_FILL : ramp.light;
  const edge = { stroke: ramp.edge, strokeOpacity: 0.8, strokeWidth: 1.1, strokeLinejoin: "round" as const };

  if (shape === "crayon") {
    return (
      <g>
        <rect x={-width / 2} y={-length} width={width} height={length + 28} rx={width / 2} fill={fill} {...edge} />
        {lume ? (
          <rect
            x={-width / 2 + 5.5}
            y={-length + 10}
            width={width - 11}
            height={length - 44}
            rx={(width - 11) / 2}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="0.9"
          />
        ) : (
          <line x1="0" y1={-length + 12} x2="0" y2={-16} stroke={ramp.edge} strokeOpacity="0.45" strokeWidth="1" />
        )}
      </g>
    );
  }

  // Un jeu « Mercedes » ne porte le cercle que sur l'aiguille des heures ;
  // la minute reste un glaive. Deux cercles empilés seraient illisibles.
  if (shape === "mercedes" && role === "heure") {
    const ringY = -length * 0.66;
    const ringR = length * 0.17;
    return (
      <g>
        <path
          d={`M ${-width / 2} 28 L ${-width / 2.6} ${ringY + ringR * 0.4} L ${width / 2.6} ${ringY + ringR * 0.4} L ${width / 2} 28 Z`}
          fill={fill}
          {...edge}
        />
        {lume && (
          <path
            d={`M ${-width / 2 + 6} -12 L ${-width / 2.6 + 5} ${ringY + ringR + 4} L ${width / 2.6 - 5} ${ringY + ringR + 4} L ${width / 2 - 6} -12 Z`}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="0.9"
          />
        )}
        <path
          d={`M ${-width / 4.4} ${ringY - ringR * 0.6} L 0 ${-length} L ${width / 4.4} ${ringY - ringR * 0.6} Z`}
          fill={fill}
          {...edge}
        />
        <circle cy={ringY} r={ringR + 3} fill={fill} {...edge} />
        <circle cy={ringY} r={ringR - 2} fill={lumeFill} stroke={lume ? LUME_EDGE : ramp.dark} strokeWidth="0.9" />
        {[90, 210, 330].map((a) => (
          <line
            key={a}
            x1="0"
            y1={ringY}
            x2={(ringR - 1) * Math.cos((a * Math.PI) / 180)}
            y2={ringY + (ringR - 1) * Math.sin((a * Math.PI) / 180)}
            stroke={ramp.mid}
            strokeWidth="4"
          />
        ))}
        {[90, 210, 330].map((a) => (
          <line
            key={`f${a}`}
            x1="0"
            y1={ringY}
            x2={(ringR - 1) * Math.cos((a * Math.PI) / 180)}
            y2={ringY + (ringR - 1) * Math.sin((a * Math.PI) / 180)}
            stroke={ramp.hi}
            strokeOpacity="0.7"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  }

  // Glaive : deux arêtes vives qui se rejoignent en pointe.
  const shoulder = -length * 0.24;
  return (
    <g>
      <path d={`M 0 30 L ${-width / 2} ${shoulder} L 0 ${-length} L ${width / 2} ${shoulder} Z`} fill={fill} {...edge} />
      {lume ? (
        <path
          d={`M 0 8 L ${-width / 2 + 7.5} ${shoulder} L 0 ${-length + 26} L ${width / 2 - 7.5} ${shoulder} Z`}
          fill={LUME_FILL}
          stroke={LUME_EDGE}
          strokeWidth="0.9"
        />
      ) : (
        <line x1="0" y1="26" x2="0" y2={-length + 4} stroke={ramp.edge} strokeOpacity="0.4" strokeWidth="0.9" />
      )}
    </g>
  );
}

function SecondHand({ fill, metal, lume }: { fill: string; metal: MetalTone; lume: boolean }) {
  const ramp = METALS[metal];
  return (
    <g>
      <rect x="-2.2" y={-SEC_LEN} width="4.4" height={SEC_LEN + 66} rx="2.2" fill={fill} stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="0.6" />
      <circle cy={-SEC_LEN + 54} r="12.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1" />
      <circle cy={-SEC_LEN + 54} r="8.5" fill={lume ? LUME_FILL : ramp.light} stroke={lume ? LUME_EDGE : ramp.dark} strokeWidth="0.9" />
      {/* Contrepoids. */}
      <rect x="-5.5" y="30" width="11" height="40" rx="5.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.9" />
    </g>
  );
}

/** Aiguille GMT : une flèche, pour ne pas la confondre avec l'heure locale. */
function GmtHand({ fill, metal, lume }: { fill: string; metal: MetalTone; lume: boolean }) {
  const ramp = METALS[metal];
  return (
    <g>
      <rect x="-3.5" y={-GMT_LEN + 44} width="7" height={GMT_LEN + 4} rx="3.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.8" />
      <path
        d={`M 0 ${-GMT_LEN} L -21 ${-GMT_LEN + 50} L 21 ${-GMT_LEN + 50} Z`}
        fill={fill}
        stroke={ramp.edge}
        strokeOpacity="0.85"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d={`M 0 ${-GMT_LEN + 15} L -12 ${-GMT_LEN + 44} L 12 ${-GMT_LEN + 44} Z`}
        fill={lume ? LUME_FILL : ramp.light}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeWidth="0.9"
      />
    </g>
  );
}
