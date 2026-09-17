import { METALS, LUME_EDGE, LUME_FILL, shade, tint } from "../palette";
import { R_BEZEL_IN, R_BEZEL_OUT, n, polar } from "../geometry";
import type { BezelStyle, InsertMaterial, MetalTone } from "../types";

interface BezelProps {
  uid: string;
  style: BezelStyle;
  metal: MetalTone;
  insertColor?: string;
  insertMaterial?: InsertMaterial;
  lume: boolean;
  detail: "full" | "compact";
}

export function Bezel({ uid, style, metal, insertColor, insertMaterial, lume, detail }: BezelProps) {
  const ramp = METALS[metal];

  return (
    <g data-layer="lunette">
      <circle cx="500" cy="500" r={R_BEZEL_OUT} fill={`url(#${uid}-metal-${metal})`} />

      {style === "cannelee" && <Fluting metal={metal} detail={detail} />}
      {style === "plongee" && (
        <DiveInsert
          color={insertColor ?? "#2C3A47"}
          material={insertMaterial ?? "ceramique"}
          lume={lume}
          detail={detail}
        />
      )}
      {style === "lisse" && (
        <circle
          cx="500"
          cy="500"
          r={(R_BEZEL_OUT + R_BEZEL_IN) / 2}
          fill="none"
          stroke={ramp.light}
          strokeOpacity="0.5"
          strokeWidth="4"
        />
      )}

      {/* Chanfrein intérieur : la lunette retombe sur le cadran. */}
      <circle cx="500" cy="500" r={R_BEZEL_IN + 4} fill="none" stroke={ramp.dark} strokeWidth="7" />
      <circle cx="500" cy="500" r={R_BEZEL_IN} fill="none" stroke={ramp.edge} strokeWidth="2" />
      <circle cx="500" cy="500" r={R_BEZEL_OUT} fill="none" stroke={ramp.edge} strokeWidth="2" />
    </g>
  );
}

/** Cannelures : 72 crans, un trait clair et un trait sombre par cran. */
function Fluting({ metal, detail }: { metal: MetalTone; detail: "full" | "compact" }) {
  const ramp = METALS[metal];
  const teeth = detail === "full" ? 72 : 40;
  return (
    <g>
      {Array.from({ length: teeth }, (_, i) => {
        const angle = (360 / teeth) * i;
        const a = polar(R_BEZEL_IN + 6, angle);
        const b = polar(R_BEZEL_OUT - 4, angle);
        return (
          <line
            key={i}
            x1={n(a.x)}
            y1={n(a.y)}
            x2={n(b.x)}
            y2={n(b.y)}
            stroke={i % 2 === 0 ? ramp.light : ramp.dark}
            strokeOpacity="0.75"
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** Insert de plongée : 120 clics, graduation, perle luminescente à midi. */
function DiveInsert({
  color,
  material,
  lume,
  detail,
}: {
  color: string;
  material: InsertMaterial;
  lume: boolean;
  detail: "full" | "compact";
}) {
  const rMid = (R_BEZEL_OUT + R_BEZEL_IN) / 2 + 2;
  const width = R_BEZEL_OUT - R_BEZEL_IN - 14;
  const ticks = detail === "full" ? 60 : 24;
  const step = 360 / ticks;
  const engraved = material === "ceramique" ? tint(color, 0.72) : tint(color, 0.6);

  return (
    <g>
      <circle cx="500" cy="500" r={rMid} fill="none" stroke={color} strokeWidth={width} />
      {/* La céramique renvoie une bande de lumière, l'aluminium reste mat. */}
      {material === "ceramique" && (
        <circle
          cx="500"
          cy="500"
          r={rMid}
          fill="none"
          stroke={tint(color, 0.42)}
          strokeOpacity="0.5"
          strokeWidth={width}
          strokeDasharray="160 640"
          strokeDashoffset="80"
        />
      )}

      {Array.from({ length: ticks }, (_, i) => {
        const angle = step * i;
        if (angle === 0) return null;

        // Les cinq repères chiffrés remplacent leur trait, comme sur un insert gravé.
        if (detail === "full" && angle % 60 === 0) {
          const p = polar(rMid, angle);
          return (
            <text
              key={i}
              x={n(p.x)}
              y={n(p.y + 7)}
              textAnchor="middle"
              fill={engraved}
              style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: "0.02em" }}
            >
              {(angle / 6).toString()}
            </text>
          );
        }

        const major = angle % 30 === 0;
        const long = major ? 18 : angle % 6 === 0 && angle <= 90 ? 13 : 9;
        const a = polar(rMid + width / 2 - 4, angle);
        const b = polar(rMid + width / 2 - 4 - long, angle);
        return (
          <line
            key={i}
            x1={n(a.x)}
            y1={n(a.y)}
            x2={n(b.x)}
            y2={n(b.y)}
            stroke={engraved}
            strokeWidth={major ? 5 : 3}
            strokeLinecap="round"
          />
        );
      })}

      {/* Perle de midi, encerclée de métal. */}
      <circle cx="500" cy={500 - rMid} r="15" fill={shade(color, 0.4)} />
      <circle
        cx="500"
        cy={500 - rMid}
        r="10"
        fill={lume ? LUME_FILL : "#D5CFC4"}
        stroke={lume ? LUME_EDGE : "#8E887E"}
        strokeWidth="2"
      />
    </g>
  );
}
