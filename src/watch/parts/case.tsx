import { METALS } from "../palette";
import { LUG_ANGLES, R_CASE } from "../geometry";
import type { CaseFinish, MetalTone } from "../types";

/** Cornes : une seule forme, pivotée quatre fois autour du centre. */
const LUG_PATH = [
  "M -52 -296",
  "C -54 -344 -52 -394 -44 -426",
  "C -40 -446 -27 -457 -10 -457",
  "L 10 -457",
  "C 27 -457 40 -446 44 -426",
  "C 52 -394 54 -344 52 -296",
  "Z",
].join(" ");

export function Case({
  uid,
  metal,
  finish,
}: {
  uid: string;
  metal: MetalTone;
  finish: CaseFinish;
}) {
  const ramp = METALS[metal];
  const finishPattern =
    finish === "brosse" ? `url(#${uid}-brushed)` : finish === "microbille" ? `url(#${uid}-beaded)` : null;

  return (
    <g data-layer="boitier">
      <g transform="translate(500 500)">
        {LUG_ANGLES.map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path d={LUG_PATH} fill={`url(#${uid}-case)`} stroke={ramp.edge} strokeWidth="2" />
            {finishPattern && <path d={LUG_PATH} fill={finishPattern} />}
            {/* Arête polie sur le dessus de la corne. */}
            <path
              d="M -30 -300 C -32 -370 -28 -410 -20 -440"
              fill="none"
              stroke={ramp.light}
              strokeOpacity="0.7"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      <circle cx="500" cy="500" r={R_CASE} fill={`url(#${uid}-case)`} />
      {finishPattern && <circle cx="500" cy="500" r={R_CASE} fill={finishPattern} />}
      {finish === "poli" && (
        <circle
          cx="500"
          cy="500"
          r={R_CASE - 6}
          fill="none"
          stroke={ramp.light}
          strokeOpacity="0.55"
          strokeWidth="7"
          strokeDasharray="210 300"
          strokeDashoffset="120"
        />
      )}
      <circle cx="500" cy="500" r={R_CASE} fill="none" stroke={ramp.edge} strokeWidth="2.5" />
    </g>
  );
}
