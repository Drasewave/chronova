import { isLight, shade, tint } from "../palette";
import { C, R_DIAL, R_MINUTE_TRACK, n, polar } from "../geometry";
import type { DialTexture, Movement } from "../types";

interface DialProps {
  uid: string;
  color: string;
  texture: DialTexture;
  movement: Movement;
  showDate: boolean;
  detail: "full" | "compact";
}

export function Dial({ uid, color, texture, movement, showDate, detail }: DialProps) {
  const light = isLight(color);
  const printed = light ? shade(color, 0.78) : tint(color, 0.82);
  const hasDate = showDate && movement !== "NH38";

  return (
    <g data-layer="cadran">
      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial)`} />

      <g clipPath={`url(#${uid}-dial-clip)`}>
        {texture === "soleille" && <Sunburst color={color} detail={detail} />}
        {texture === "emaille" && <Enamel color={color} />}
      </g>

      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial-vignette)`} />

      <MinuteTrack color={printed} detail={detail} />
      {movement === "NH34" && <GmtRing color={printed} detail={detail} />}
      {movement === "NH38" && <OpenHeart uid={uid} color={color} printed={printed} />}
      {hasDate && <DateWindow color={color} printed={printed} />}

      {/* Signature. Le nom en serif, la ligne technique en monospace : la même
          hiérarchie que sur le site. */}
      <text
        x={C}
        y={C - 128}
        textAnchor="middle"
        fill={printed}
        style={{ fontFamily: "var(--font-title)", fontSize: 34, letterSpacing: "0.2em" }}
      >
        CHRONOVA
      </text>
      <text
        x={C}
        y={C + 148}
        textAnchor="middle"
        fill={printed}
        fillOpacity="0.82"
        style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.24em" }}
      >
        AUTOMATIQUE
      </text>
      <text
        x={C}
        y={C + 174}
        textAnchor="middle"
        fill={printed}
        fillOpacity="0.6"
        style={{ fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.22em" }}
      >
        {movement}
      </text>
    </g>
  );
}

/** Soleillé : des rayons très fins depuis le centre, jamais un dégradé lisse. */
function Sunburst({ color, detail }: { color: string; detail: "full" | "compact" }) {
  const rays = detail === "full" ? 90 : 36;
  const step = 360 / rays;
  return (
    <g opacity="0.5">
      {Array.from({ length: rays }, (_, i) => {
        const a = polar(R_DIAL + 10, step * i);
        const b = polar(R_DIAL + 10, step * i + step * 0.5);
        return (
          <path
            key={i}
            d={`M ${C} ${C} L ${n(a.x)} ${n(a.y)} L ${n(b.x)} ${n(b.y)} Z`}
            fill={i % 2 === 0 ? tint(color, 0.3) : shade(color, 0.2)}
            opacity="0.55"
          />
        );
      })}
    </g>
  );
}

/** Émail : une nappe de lumière large et douce, en haut à gauche. */
function Enamel({ color }: { color: string }) {
  return (
    <ellipse
      cx={C - 74}
      cy={C - 96}
      rx="230"
      ry="176"
      fill={tint(color, 0.5)}
      opacity="0.34"
      transform={`rotate(-22 ${C - 74} ${C - 96})`}
    />
  );
}

function MinuteTrack({ color, detail }: { color: string; detail: "full" | "compact" }) {
  const count = detail === "full" ? 60 : 12;
  const step = 360 / count;
  return (
    <g data-layer="minuterie">
      <circle
        cx={C}
        cy={C}
        r={R_MINUTE_TRACK + 12}
        fill="none"
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      {Array.from({ length: count }, (_, i) => {
        const angle = step * i;
        const major = angle % 30 === 0;
        const a = polar(R_MINUTE_TRACK + 11, angle);
        const b = polar(R_MINUTE_TRACK + (major ? 0 : 4), angle);
        return (
          <line
            key={i}
            x1={n(a.x)}
            y1={n(a.y)}
            x2={n(b.x)}
            y2={n(b.y)}
            stroke={color}
            strokeOpacity={major ? 0.85 : 0.55}
            strokeWidth={major ? 3.5 : 2}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** Échelle 24 h du NH34, imprimée sur le réhaut entre les index et la minuterie. */
function GmtRing({ color, detail }: { color: string; detail: "full" | "compact" }) {
  const rOuter = R_MINUTE_TRACK - 4;
  const rInner = R_MINUTE_TRACK - 30;
  const rText = (rOuter + rInner) / 2;
  const marks = detail === "full" ? 24 : 12;
  const step = 360 / marks;
  const labels = new Map([
    [0, "24"],
    [90, "6"],
    [180, "12"],
    [270, "18"],
  ]);

  return (
    <g data-layer="echelle-24h">
      <circle cx={C} cy={C} r={rInner} fill="none" stroke={color} strokeOpacity="0.22" strokeWidth="1.5" />
      {Array.from({ length: marks }, (_, i) => {
        const angle = step * i;
        const label = labels.get(angle);
        if (label) {
          const p = polar(rText, angle);
          return (
            <text
              key={i}
              x={n(p.x)}
              y={n(p.y + 6)}
              textAnchor="middle"
              fill={color}
              fillOpacity="0.8"
              style={{ fontFamily: "var(--font-mono)", fontSize: 16, letterSpacing: "0.04em" }}
            >
              {label}
            </text>
          );
        }
        const a = polar(rOuter, angle);
        const b = polar(rOuter - (angle % 90 === 0 ? 16 : 9), angle);
        return (
          <line
            key={i}
            x1={n(a.x)}
            y1={n(a.y)}
            x2={n(b.x)}
            y2={n(b.y)}
            stroke={color}
            strokeOpacity="0.55"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

/** Cœur ouvert du NH38 : on voit le balancier travailler. */
function OpenHeart({ uid, color, printed }: { uid: string; color: string; printed: string }) {
  const cx = C - 148;
  const cy = C;
  return (
    <g data-layer="coeur-ouvert">
      <circle cx={cx} cy={cy} r="62" fill={shade(color, 0.6)} />
      <circle cx={cx} cy={cy} r="62" fill="none" stroke={printed} strokeOpacity="0.5" strokeWidth="3" />
      {/* Balancier stylisé : anneau, bras, plateau. */}
      <circle cx={cx} cy={cy} r="40" fill="none" stroke="#B9B3A8" strokeOpacity="0.8" strokeWidth="6" />
      <line x1={cx - 40} y1={cy} x2={cx + 40} y2={cy} stroke="#D2CCC1" strokeOpacity="0.75" strokeWidth="4" />
      <line
        x1={cx}
        y1={cy - 40}
        x2={cx}
        y2={cy + 40}
        stroke="#D2CCC1"
        strokeOpacity="0.45"
        strokeWidth="3"
        transform={`rotate(34 ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r="9" fill="#C09755" />
      <circle cx={cx} cy={cy} r="62" fill={`url(#${uid}-ar)`} />
    </g>
  );
}

function DateWindow({ color, printed }: { color: string; printed: string }) {
  const x = C + 166;
  const y = C - 23;
  const light = isLight(color);
  return (
    <g data-layer="guichet-date">
      <rect x={x} y={y} width="64" height="46" rx="2" fill={light ? "#FBF8F3" : "#2A2622"} />
      <rect
        x={x}
        y={y}
        width="64"
        height="46"
        rx="2"
        fill="none"
        stroke={printed}
        strokeOpacity="0.55"
        strokeWidth="2.5"
      />
      <text
        x={x + 32}
        y={y + 33}
        textAnchor="middle"
        fill={light ? "#34302A" : "#E9E2D6"}
        style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 500 }}
      >
        11
      </text>
    </g>
  );
}
