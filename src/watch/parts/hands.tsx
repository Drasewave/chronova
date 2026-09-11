import { LUME_EDGE, LUME_FILL, METALS } from "../palette";
import { C, handAngles } from "../geometry";
import type { HandShape, MetalTone, Movement } from "../types";

interface HandsProps {
  uid: string;
  shape: HandShape;
  metal: MetalTone;
  lume: boolean;
  movement: Movement;
  time: { hours: number; minutes: number; seconds: number };
}

const HOUR_LEN = 182;
const MIN_LEN = 248;
const SEC_LEN = 262;
const GMT_LEN = 214;

export function Hands({ uid, shape, metal, lume, movement, time }: HandsProps) {
  const angles = handAngles(time);
  const ramp = METALS[metal];

  return (
    <g data-layer="aiguilles" transform={`translate(${C} ${C})`}>
      {movement === "NH34" && (
        <g transform={`rotate(${angles.gmt})`}>
          <GmtHand metal={metal} lume={lume} />
        </g>
      )}

      <g transform={`rotate(${angles.hour})`}>
        <Hand uid={uid} shape={shape} role="heure" length={HOUR_LEN} width={36} metal={metal} lume={lume} />
      </g>
      <g transform={`rotate(${angles.minute})`}>
        <Hand uid={uid} shape={shape} role="minute" length={MIN_LEN} width={26} metal={metal} lume={lume} />
      </g>
      <g transform={`rotate(${angles.second})`}>
        <SecondHand metal={metal} lume={lume} />
      </g>

      {/* Axe central : il couvre la base des trois aiguilles. */}
      <g data-layer="axe">
        <circle r="15" fill={ramp.mid} stroke={ramp.edge} strokeWidth="2" />
        <circle r="6" fill={ramp.light} />
      </g>
    </g>
  );
}

function Hand({
  uid,
  shape,
  role,
  length,
  width,
  metal,
  lume,
}: {
  uid: string;
  shape: HandShape;
  role: "heure" | "minute";
  length: number;
  width: number;
  metal: MetalTone;
  lume: boolean;
}) {
  const ramp = METALS[metal];
  const fill = `url(#${uid}-metal-${metal})`;
  const lumeFill = lume ? LUME_FILL : ramp.light;

  if (shape === "crayon") {
    return (
      <g>
        <rect
          x={-width / 2}
          y={-length}
          width={width}
          height={length + 28}
          rx={width / 2}
          fill={fill}
          stroke={ramp.edge}
          strokeWidth="2"
        />
        {lume ? (
          <rect
            x={-width / 2 + 6}
            y={-length + 10}
            width={width - 12}
            height={length - 40}
            rx={(width - 12) / 2}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="1"
          />
        ) : (
          <line
            x1="0"
            y1={-length + 14}
            x2="0"
            y2={-16}
            stroke={ramp.light}
            strokeOpacity="0.85"
            strokeWidth="2.5"
          />
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
          stroke={ramp.edge}
          strokeWidth="2"
        />
        <path
          d={`M ${-width / 5} ${ringY - ringR * 0.5} L 0 ${-length} L ${width / 5} ${ringY - ringR * 0.5} Z`}
          fill={fill}
          stroke={ramp.edge}
          strokeWidth="2"
        />
        <circle cy={ringY} r={ringR} fill={lumeFill} stroke={ramp.edge} strokeWidth="3" />
        {[90, 210, 330].map((a) => (
          <line
            key={a}
            x1="0"
            y1={ringY}
            x2={ringR * Math.cos((a * Math.PI) / 180)}
            y2={ringY + ringR * Math.sin((a * Math.PI) / 180)}
            stroke={ramp.edge}
            strokeWidth="3.5"
          />
        ))}
      </g>
    );
  }

  // Glaive : deux arêtes vives qui se rejoignent en pointe.
  const shoulder = -length * 0.24;
  return (
    <g>
      <path
        d={`M 0 30 L ${-width / 2} ${shoulder} L 0 ${-length} L ${width / 2} ${shoulder} Z`}
        fill={fill}
        stroke={ramp.edge}
        strokeWidth="2"
      />
      {lume ? (
        <path
          d={`M 0 14 L ${-width / 2 + 7} ${shoulder} L 0 ${-length + 22} L ${width / 2 - 7} ${shoulder} Z`}
          fill={LUME_FILL}
          stroke={LUME_EDGE}
          strokeWidth="1"
        />
      ) : (
        <line
          x1="0"
          y1={shoulder}
          x2="0"
          y2={-length + 18}
          stroke={ramp.light}
          strokeOpacity="0.85"
          strokeWidth="2.5"
        />
      )}
    </g>
  );
}

function SecondHand({ metal, lume }: { metal: MetalTone; lume: boolean }) {
  const ramp = METALS[metal];
  return (
    <g>
      <rect x="-2.5" y={-SEC_LEN} width="5" height={SEC_LEN + 70} rx="2.5" fill={ramp.dark} />
      <circle cy={-SEC_LEN + 54} r="12" fill={lume ? LUME_FILL : ramp.mid} stroke={ramp.dark} strokeWidth="2.5" />
      <circle cy="52" r="15" fill={ramp.mid} stroke={ramp.edge} strokeWidth="2" />
    </g>
  );
}

/** Aiguille GMT : une flèche évidée, pour ne pas masquer l'heure locale. */
function GmtHand({ metal, lume }: { metal: MetalTone; lume: boolean }) {
  const ramp = METALS[metal];
  return (
    <g>
      <rect
        x="-4"
        y={-GMT_LEN + 44}
        width="8"
        height={GMT_LEN + 4}
        rx="4"
        fill={ramp.mid}
        stroke={ramp.edge}
        strokeWidth="1.5"
      />
      <path
        d={`M 0 ${-GMT_LEN} L -20 ${-GMT_LEN + 48} L 20 ${-GMT_LEN + 48} Z`}
        fill={lume ? LUME_FILL : ramp.light}
        stroke={ramp.edge}
        strokeWidth="2.5"
      />
    </g>
  );
}
