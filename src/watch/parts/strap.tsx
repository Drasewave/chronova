import { METALS, shade, tint } from "../palette";
import type { MetalTone, StrapKind } from "../types";
import { n } from "../geometry";

/** Le brin passe sous le boîtier et sort du cadre, comme sur une photo produit. */
const Y_AT_CASE = 250;
const Y_AT_EDGE = -70;
const HALF_AT_CASE = 176;
const HALF_AT_EDGE = 148;

const OUTLINE = [
  `M ${500 - HALF_AT_CASE} ${Y_AT_CASE}`,
  `L ${500 - HALF_AT_EDGE} ${Y_AT_EDGE}`,
  `L ${500 + HALF_AT_EDGE} ${Y_AT_EDGE}`,
  `L ${500 + HALF_AT_CASE} ${Y_AT_CASE}`,
  "Z",
].join(" ");

interface StrapProps {
  uid: string;
  kind: StrapKind;
  color: string;
  metal: MetalTone;
  detail: "full" | "compact";
}

export function Strap(props: StrapProps) {
  return (
    <g data-layer="bracelet">
      <Band {...props} half="haut" />
      <g transform="rotate(180 500 500)">
        <Band {...props} half="bas" />
      </g>
    </g>
  );
}

function Band({ uid, kind, color, metal, detail, half }: StrapProps & { half: string }) {
  const clipId = `${uid}-strap-${half}`;
  const isSteel = kind === "acier-3-maillons" || kind === "acier-jubile";
  const base = isSteel ? METALS[metal].mid : color;

  return (
    <g>
      <clipPath id={clipId}>
        <path d={OUTLINE} />
      </clipPath>

      <path d={OUTLINE} fill={isSteel ? `url(#${uid}-metal-${metal})` : base} />

      <g clipPath={`url(#${clipId})`}>
        {kind === "acier-3-maillons" && (
          <Links uid={uid} metal={metal} widths={[0.3, 0.4, 0.3]} rowHeight={40} />
        )}
        {kind === "acier-jubile" && (
          <Links uid={uid} metal={metal} widths={[0.27, 0.13, 0.2, 0.13, 0.27]} rowHeight={27} />
        )}
        {kind === "cuir" && <Leather color={color} detail={detail} />}
        {kind === "caoutchouc" && <Rubber color={color} detail={detail} />}
        {kind === "nato" && <Nato color={color} metal={metal} detail={detail} />}
      </g>

      {/* Ombre portée du boîtier sur le brin. */}
      <path d={OUTLINE} fill="none" stroke={shade(base, 0.45)} strokeOpacity="0.5" strokeWidth="2" />
      <rect
        x={500 - HALF_AT_CASE}
        y={Y_AT_CASE - 74}
        width={HALF_AT_CASE * 2}
        height={74}
        fill="#211E1B"
        fillOpacity="0.22"
        clipPath={`url(#${clipId})`}
      />
    </g>
  );
}

/** Rangées de maillons. Les colonnes sont proportionnelles à la largeur du brin,
    qui se resserre en s'éloignant du boîtier. */
function Links({
  uid,
  metal,
  widths,
  rowHeight,
}: {
  uid: string;
  metal: MetalTone;
  widths: number[];
  rowHeight: number;
}) {
  const gap = 4;
  const rows = Math.ceil((Y_AT_CASE - Y_AT_EDGE) / (rowHeight + gap)) + 1;

  return (
    <g>
      {Array.from({ length: rows }, (_, row) => {
        const yTop = Y_AT_CASE - 6 - row * (rowHeight + gap);
        const t = (Y_AT_CASE - yTop) / (Y_AT_CASE - Y_AT_EDGE);
        const half = HALF_AT_CASE + (HALF_AT_EDGE - HALF_AT_CASE) * t;
        let cursor = 500 - half;

        return (
          <g key={row}>
            {widths.map((w, col) => {
              const width = half * 2 * w;
              const x = cursor;
              cursor += width;
              // Sur un jubilé, les maillons centraux sont polis : ils accrochent
              // la lumière là où les maillons extérieurs restent brossés.
              const polished = widths.length === 5 && col > 0 && col < 4;
              return (
                <rect
                  key={col}
                  x={n(x + 1.5)}
                  y={n(yTop - rowHeight)}
                  width={n(width - 3)}
                  height={rowHeight}
                  rx={Math.min(5, rowHeight / 4)}
                  fill={polished ? METALS[metal].light : `url(#${uid}-metal-${metal})`}
                  stroke={METALS[metal].edge}
                  strokeOpacity="0.4"
                  strokeWidth="1.2"
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function Leather({ color, detail }: { color: string; detail: "full" | "compact" }) {
  return (
    <g>
      {/* Bombé du cuir : la lumière se pose au centre du brin. */}
      <path
        d={`M ${500 - 54} ${Y_AT_CASE} L ${500 - 46} ${Y_AT_EDGE} L ${500 + 46} ${Y_AT_EDGE} L ${500 + 54} ${Y_AT_CASE} Z`}
        fill={tint(color, 0.1)}
        opacity="0.55"
      />
      {detail === "full" && (
        <>
          <path
            d={`M ${500 - 140} ${Y_AT_CASE - 10} L ${500 - 120} ${Y_AT_EDGE}`}
            stroke={tint(color, 0.55)}
            strokeWidth="3"
            strokeDasharray="11 9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${500 + 140} ${Y_AT_CASE - 10} L ${500 + 120} ${Y_AT_EDGE}`}
            stroke={tint(color, 0.55)}
            strokeWidth="3"
            strokeDasharray="11 9"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
      <path d={OUTLINE} fill="none" stroke={shade(color, 0.4)} strokeWidth="3" />
    </g>
  );
}

function Rubber({ color, detail }: { color: string; detail: "full" | "compact" }) {
  const ribs = detail === "full" ? 7 : 4;
  return (
    <g>
      {Array.from({ length: ribs }, (_, i) => {
        const y = Y_AT_CASE - 30 - i * 44;
        return (
          <rect
            key={i}
            x={500 - HALF_AT_CASE}
            y={y}
            width={HALF_AT_CASE * 2}
            height="16"
            fill={shade(color, 0.22)}
            opacity="0.7"
            rx="8"
          />
        );
      })}
    </g>
  );
}

function Nato({
  color,
  metal,
  detail,
}: {
  color: string;
  metal: MetalTone;
  detail: "full" | "compact";
}) {
  return (
    <g>
      <rect
        x={500 - 58}
        y={Y_AT_EDGE}
        width="38"
        height={Y_AT_CASE - Y_AT_EDGE}
        fill={shade(color, 0.35)}
      />
      <rect
        x={500 + 20}
        y={Y_AT_EDGE}
        width="38"
        height={Y_AT_CASE - Y_AT_EDGE}
        fill={tint(color, 0.3)}
      />
      {detail === "full" && (
        <rect
          x={500 - HALF_AT_CASE}
          y={Y_AT_CASE - 150}
          width={HALF_AT_CASE * 2}
          height="34"
          fill={METALS[metal].mid}
          stroke={METALS[metal].edge}
          strokeWidth="2"
          rx="4"
        />
      )}
    </g>
  );
}
