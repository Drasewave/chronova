import { INK, isLight, shade, tint } from "../palette";
import { Ring } from "./conic";
import { C, R_DIAL, R_MINUTE_TRACK, n, polar } from "../geometry";
import type { DialTexture, Movement } from "../types";

interface DialProps {
  uid: string;
  color: string;
  texture: DialTexture;
  movement: Movement;
  showDate: boolean;
  detail: "full" | "compact";
  subdialColor?: string;
}

export function Dial({ uid, color, texture, movement, showDate, detail, subdialColor }: DialProps) {
  const light = isLight(color);
  const printed = light ? shade(color, 0.78) : tint(color, 0.82);
  const hasDate = showDate && movement !== "NH38" && movement !== "VK64";

  return (
    <g data-layer="cadran">
      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial)`} />

      <g clipPath={`url(#${uid}-dial-clip)`}>
        {texture === "soleille" && (
          <>
            <use href={`#${uid}-conic-dial`} />
            {/* La tombée de lumière du studio reste lisible sous le soleillage. */}
            <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial)`} opacity="0.18" />
          </>
        )}
        {texture === "emaille" && (
          <ellipse
            cx={C - 84}
            cy={C - 104}
            rx="250"
            ry="180"
            fill={`url(#${uid}-gloss)`}
            opacity="0.6"
            transform={`rotate(-24 ${C - 84} ${C - 104})`}
          />
        )}
      </g>

      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial-vignette)`} />
      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-rehaut-cast)`} />

      {/* Réhaut : la bague polie, en pente, entre le cadran et le verre. Tournée
          vers le centre, elle renvoie le côté opposé du studio, assombri. */}
      <Ring id={`${uid}-clip-rehaut`} disk={`${uid}-conic-poli`} rOut={R_DIAL} rIn={R_DIAL - 10} rotate={180} />
      <circle cx={C} cy={C} r={R_DIAL - 5} fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="10" />
      <circle cx={C} cy={C} r={R_DIAL - 10} fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="1.2" />

      <MinuteTrack color={printed} detail={detail} />
      {movement === "NH34" && <GmtRing color={printed} detail={detail} />}
      {movement === "NH38" && <OpenHeart uid={uid} color={color} printed={printed} />}
      {movement === "VK64" && <ChronoSubdials color={subdialColor ?? "#EFE7D6"} printed={printed} />}
      {hasDate && (
        <g filter={`url(#${uid}-contact-shadow)`}>
          <DateWindow uid={uid} color={color} />
        </g>
      )}

      {/* Signature : le nom, puis la ligne technique, comme une tampographie. */}
      <text
        x={C}
        y={C - 128}
        textAnchor="middle"
        fill={printed}
        style={{ fontFamily: "var(--font-title)", fontSize: 33, fontWeight: 500, letterSpacing: "0.24em" }}
      >
        CHRONOVA
      </text>
      <text
        x={C}
        y={C + 148}
        textAnchor="middle"
        fill={printed}
        fillOpacity="0.82"
        style={{ fontFamily: "var(--font-ui)", fontSize: 15, fontWeight: 500, letterSpacing: "0.3em" }}
      >
        {movement === "VK64" ? "CHRONOGRAPHE" : "AUTOMATIQUE"}
      </text>
      <text
        x={C}
        y={C + 174}
        textAnchor="middle"
        fill={printed}
        fillOpacity="0.6"
        style={{ fontFamily: "var(--font-ui)", fontSize: 13, letterSpacing: "0.3em" }}
      >
        {movement}
      </text>
    </g>
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
              style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 16, letterSpacing: "0.04em" }}
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

/**
 * Compteurs du VK64 : deux totalisateurs de part et d'autre du centre — 60
 * secondes à 9 h, 30 minutes à 3 h — dans l'axe des poussoirs. Aiguilles fixes,
 * décoratives : ce n'est pas un vrai module chronographe qui décompte.
 */
function ChronoSubdials({ color, printed }: { color: string; printed: string }) {
  const light = isLight(color);
  const ink = light ? shade(color, 0.7) : tint(color, 0.75);
  const offset = 128;
  const radius = 76;

  const subdial = (cx: number, angleDeg: number, label: string) => (
    <g key={cx} transform={`translate(${cx} ${C})`}>
      <circle r={radius} fill={color} stroke={ink} strokeOpacity="0.55" strokeWidth="2" />
      <circle r={radius - 10} fill="none" stroke={ink} strokeOpacity="0.35" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = polar(radius - 8, i * 30);
        const b = polar(radius - (i % 3 === 0 ? 17 : 12), i * 30);
        return (
          <line
            key={i}
            x1={n(a.x - C)}
            y1={n(a.y - C)}
            x2={n(b.x - C)}
            y2={n(b.y - C)}
            stroke={ink}
            strokeOpacity={i % 3 === 0 ? 0.75 : 0.45}
            strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={-(radius - 22)}
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${angleDeg})`}
      />
      <circle r="4" fill={ink} />
      <text y={radius + 26} textAnchor="middle" fill={ink} fillOpacity="0.7" style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 13, letterSpacing: "0.06em" }}>
        {label}
      </text>
    </g>
  );

  return (
    <g data-layer="compteurs">
      {subdial(C - offset, 55, "60 SEC")}
      {subdial(C + offset, 205, "30 MIN")}
    </g>
  );
}

function DateWindow({ uid, color }: { uid: string; color: string }) {
  const x = C + 164;
  const y = C - 25;
  const light = isLight(color);
  return (
    <g data-layer="guichet-date">
      {/* Cadre appliqué, poli, puis le disque de quantième en retrait. */}
      <rect x={x} y={y} width="68" height="50" rx="3" fill={`url(#${uid}-case)`} stroke={INK} strokeOpacity="0.6" strokeWidth="0.9" />
      <rect x={x + 5} y={y + 5} width="58" height="40" rx="1.5" fill={light ? "#F7F5EF" : "#15171A"} />
      {/* Le cadre porte son ombre sur le disque, du côté de la lumière. */}
      <path d={`M ${x + 5} ${y + 45} L ${x + 5} ${y + 5} L ${x + 63} ${y + 5}`} fill="none" stroke={INK} strokeOpacity={light ? 0.3 : 0.7} strokeWidth="3" />
      <text
        x={x + 34}
        y={y + 36}
        textAnchor="middle"
        fill={light ? "#15171A" : "#F1F2F4"}
        style={{ fontFamily: "var(--font-ui)", fontSize: 30, fontWeight: 600 }}
      >
        11
      </text>
    </g>
  );
}
