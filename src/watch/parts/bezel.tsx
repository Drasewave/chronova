import { INK, METALS, LUME_EDGE, LUME_FILL, PAPER, mix, rampAt, tint } from "../palette";
import { R_BEZEL_IN, R_BEZEL_OUT, n, polar } from "../geometry";
import type { BezelStyle, CaseFinish, InsertMaterial, MetalTone } from "../types";
import { Ring, studioLum } from "./conic";

interface BezelProps {
  uid: string;
  style: BezelStyle;
  metal: MetalTone;
  finish: CaseFinish;
  insertColor?: string;
  insertColor2?: string;
  insertMaterial?: InsertMaterial;
  lume: boolean;
  detail: "full" | "compact";
}

/** Largeur du chanfrein intérieur, qui retombe vers le verre. */
const CHAMFER = 9;

export function Bezel({ uid, style, metal, finish, insertColor, insertColor2, insertMaterial, lume, detail }: BezelProps) {
  const ramp = METALS[metal];
  const rTop = R_BEZEL_IN + CHAMFER;

  return (
    <g data-layer="lunette">
      <circle cx="500" cy="500" r={R_BEZEL_OUT} fill={ramp.mid} />

      {style === "lisse" && (
        <>
          {/* Une lunette lisse suit la finition du boîtier, sauf en poli où elle
              devient un miroir annulaire. */}
          <Ring
            id={`${uid}-clip-lunette`}
            disk={`${uid}-conic-${finish === "poli" ? "poli" : "case"}`}
            rOut={R_BEZEL_OUT}
            rIn={rTop}
          />
          {/* Galbe : la lunette est bombée, ses deux bords tombent dans l'ombre. */}
          <circle cx="500" cy="500" r={R_BEZEL_OUT - 3} fill="none" stroke={INK} strokeOpacity="0.2" strokeWidth="6" />
          <circle cx="500" cy="500" r={rTop + 3} fill="none" stroke={INK} strokeOpacity="0.14" strokeWidth="6" />
        </>
      )}
      {style === "cannelee" && <Fluting uid={uid} metal={metal} detail={detail} />}
      {(style === "plongee" || style === "gmt") && (
        <DiveInsert
          uid={uid}
          metal={metal}
          color={insertColor ?? "#1B2B45"}
          dayColor={style === "gmt" ? insertColor2 : undefined}
          scale={style === "gmt" ? "24h" : "60min"}
          material={insertMaterial ?? "ceramique"}
          lume={lume}
          detail={detail}
        />
      )}

      {/* Chanfrein intérieur poli : tourné vers le centre, il renvoie le côté opposé. */}
      <Ring id={`${uid}-clip-chanfrein`} disk={`${uid}-conic-poli`} rOut={rTop} rIn={R_BEZEL_IN} rotate={180} />
      <circle cx="500" cy="500" r={rTop} fill="none" stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="500" cy="500" r={R_BEZEL_IN} fill="none" stroke={ramp.edge} strokeWidth="1.6" />
      <circle cx="500" cy="500" r={R_BEZEL_OUT} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.4" />
    </g>
  );
}

/**
 * Cannelures : chaque dent est un prisme à deux facettes. La couleur de chaque
 * facette vient de la direction vers laquelle elle regarde — c'est ce qui fait
 * scintiller une lunette cannelée différemment à chaque heure du cadran.
 */
function Fluting({ uid, metal, detail }: { uid: string; metal: MetalTone; detail: "full" | "compact" }) {
  const ramp = METALS[metal];
  const teeth = detail === "full" ? 72 : 48;
  // En vignette, l'alternance des facettes moire : on resserre leur écart.
  const [floor, span] = detail === "full" ? [0.3, 0.62] : [0.44, 0.4];
  const w = 360 / teeth;
  const rOut = R_BEZEL_OUT - 3;
  const rIn = R_BEZEL_IN + CHAMFER + 1;
  const pt = (r: number, a: number) => {
    const p = polar(r, a);
    return `${n(p.x)} ${n(p.y)}`;
  };

  return (
    <g>
      <Ring id={`${uid}-clip-cannelures`} disk={`${uid}-conic-poli`} rOut={R_BEZEL_OUT} rIn={rIn - 1} />
      {Array.from({ length: teeth }, (_, i) => {
        const a = w * i;
        return (
          <g key={i}>
            <path
              d={`M ${pt(rOut, a - w / 2)} L ${pt(rOut + 1, a)} L ${pt(rIn, a)} L ${pt(rIn, a - w / 2)} Z`}
              fill={rampAt(ramp, floor + span * studioLum(a - 44, "poli"))}
            />
            <path
              d={`M ${pt(rOut + 1, a)} L ${pt(rOut, a + w / 2)} L ${pt(rIn, a + w / 2)} L ${pt(rIn, a)} Z`}
              fill={rampAt(ramp, floor + span * studioLum(a + 44, "poli"))}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Insert gravé, triangle luminescent à midi. Deux graduations : soixante
 * minutes pour la plongée, vingt-quatre heures pour le GMT — dont la moitié
 * basse (6 h – 18 h, le jour) peut porter une seconde teinte.
 */
function DiveInsert({
  uid,
  metal,
  color,
  dayColor,
  scale,
  material,
  lume,
  detail,
}: {
  uid: string;
  metal: MetalTone;
  color: string;
  dayColor?: string;
  scale: "60min" | "24h";
  material: InsertMaterial;
  lume: boolean;
  detail: "full" | "compact";
}) {
  const ramp = METALS[metal];
  const rGrip = R_BEZEL_OUT - 10; // pourtour cranté
  const rInsertOut = rGrip - 1;
  const rInsertIn = R_BEZEL_IN + CHAMFER;
  const rMid = (rInsertOut + rInsertIn) / 2;
  const width = rInsertOut - rInsertIn;
  const ticks = detail === "full" ? 60 : 12;
  const step = 360 / ticks;
  // Gravure remplie : platine sur céramique, peinture claire sur aluminium.
  const engraved = material === "ceramique" ? mix(PAPER, color, 0.08) : tint(color, 0.78);
  const notches = detail === "full" ? 120 : 60;

  return (
    <g>
      {/* Pourtour cranté : le métal poli, entaillé. Chaque cran a son flanc
          sombre et son arête vive, modulée par le studio. */}
      <Ring id={`${uid}-clip-crans`} disk={`${uid}-conic-poli`} rOut={R_BEZEL_OUT} rIn={rGrip} />
      {Array.from({ length: notches }, (_, i) => {
        const angle = (360 / notches) * i;
        const a = polar(rGrip + 0.5, angle);
        const b = polar(R_BEZEL_OUT - 0.5, angle);
        const a2 = polar(rGrip + 0.5, angle + 0.9);
        const b2 = polar(R_BEZEL_OUT - 0.5, angle + 0.9);
        return (
          <g key={`cran-${i}`}>
            <line x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={INK} strokeOpacity="0.62" strokeWidth="2.6" />
            {detail === "full" && (
              <line
                x1={n(a2.x)}
                y1={n(a2.y)}
                x2={n(b2.x)}
                y2={n(b2.y)}
                stroke={ramp.hi}
                strokeOpacity={n(0.15 + 0.75 * studioLum(angle, "poli"))}
                strokeWidth="1.1"
              />
            )}
          </g>
        );
      })}

      <Ring id={`${uid}-clip-insert`} disk={`${uid}-conic-insert`} rOut={rInsertOut} rIn={rInsertIn} />
      {dayColor && (
        <>
          <clipPath id={`${uid}-clip-jour`}>
            <rect x="0" y="500" width="1000" height="500" />
          </clipPath>
          <g clipPath={`url(#${uid}-clip-jour)`}>
            <Ring id={`${uid}-clip-insert-jour`} disk={`${uid}-conic-insert-jour`} rOut={rInsertOut} rIn={rInsertIn} />
          </g>
        </>
      )}
      {/* L'insert est serti : un filet d'ombre de chaque côté. */}
      <circle cx="500" cy="500" r={rInsertOut} fill="none" stroke={INK} strokeOpacity="0.6" strokeWidth="1.6" />
      <circle cx="500" cy="500" r={rInsertIn} fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.4" />

      {scale === "24h" && (
        <Scale24 rMid={rMid} width={width} engraved={engraved} detail={detail} />
      )}

      {scale === "60min" && Array.from({ length: ticks }, (_, i) => {
        const angle = step * i;
        if (angle === 0) return null;

        // Les cinq repères chiffrés remplacent leur trait, comme sur un insert
        // gravé ; chaque chiffre suit la courbure de la lunette.
        if (detail === "full" && angle % 60 === 0) {
          const p = polar(rMid, angle);
          const upright = angle > 90 && angle < 270 ? angle + 180 : angle;
          return (
            <text
              key={i}
              x={n(p.x)}
              y={n(p.y)}
              dy="8.5"
              textAnchor="middle"
              fill={engraved}
              transform={`rotate(${upright} ${n(p.x)} ${n(p.y)})`}
              style={{ fontFamily: "var(--font-ui)", fontSize: 25, fontWeight: 600, letterSpacing: "0.01em" }}
            >
              {(angle / 6).toString()}
            </text>
          );
        }

        const major = angle % 30 === 0;
        // Minuterie détaillée sur le premier quart d'heure, comme sur une plongeuse.
        if (!major && !(angle % 6 === 0 && angle <= 90)) return null;
        const long = major ? width - 12 : 10;
        const a = polar(rInsertOut - 5, angle);
        const b = polar(rInsertOut - 5 - long, angle);
        return (
          <line
            key={i}
            x1={n(a.x)}
            y1={n(a.y)}
            x2={n(b.x)}
            y2={n(b.y)}
            stroke={engraved}
            strokeWidth={major ? 6 : 3}
          />
        );
      })}

      {/* Triangle de midi et sa perle luminescente, sertie de métal. */}
      <path
        d={`M ${500 - 19} ${500 - rInsertOut + 5} L ${500 + 19} ${500 - rInsertOut + 5} L 500 ${500 - rInsertIn - 4} Z`}
        fill={engraved}
      />
      <circle cx="500" cy={500 - rMid - 3} r="9.5" fill={ramp.mid} stroke={ramp.edge} strokeWidth="1" />
      <circle
        cx="500"
        cy={500 - rMid - 3}
        r="7"
        fill={lume ? LUME_FILL : ramp.light}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeWidth="1"
      />
      <circle cx="498" cy={500 - rMid - 5.5} r="2" fill="#FFFFFF" fillOpacity="0.7" />
    </g>
  );
}

/** Graduation 24 heures : les heures paires chiffrées, les impaires en plot. */
function Scale24({
  rMid,
  width,
  engraved,
  detail,
}: {
  rMid: number;
  width: number;
  engraved: string;
  detail: "full" | "compact";
}) {
  return (
    <g>
      {Array.from({ length: 24 }, (_, hour) => {
        if (hour === 0) return null;
        const angle = hour * 15;
        const p = polar(rMid, angle);
        if (hour % 2 === 1 || detail === "compact") {
          if (detail === "compact" && hour % 2 === 1) return null;
          return detail === "compact" ? (
            <circle key={hour} cx={n(p.x)} cy={n(p.y)} r="4.5" fill={engraved} />
          ) : (
            <circle key={hour} cx={n(p.x)} cy={n(p.y)} r="3.4" fill={engraved} />
          );
        }
        const upright = angle > 90 && angle < 270 ? angle + 180 : angle;
        return (
          <text
            key={hour}
            x={n(p.x)}
            y={n(p.y)}
            dy="8"
            textAnchor="middle"
            fill={engraved}
            transform={`rotate(${upright} ${n(p.x)} ${n(p.y)})`}
            style={{ fontFamily: "var(--font-ui)", fontSize: Math.min(24, width - 8), fontWeight: 600 }}
          >
            {hour}
          </text>
        );
      })}
    </g>
  );
}
