import { INK, isLight, shade, tint } from "../palette";
import { Ring, annulus } from "./conic";
import { C, R_DIAL, R_MINUTE_TRACK, n, polar } from "../geometry";
import type { DateWindow as DateWindowKind, DialTexture, Movement } from "../types";

/** Bord intérieur du réhaut imprimé d'une plongeuse, et du réhaut boussole. */
export const R_CHAPTER_IN = 263;
export const R_COMPASS_IN = 252;
/** Minuterie repoussée vers le centre quand le réhaut boussole prend sa place. */
const R_TRACK_BOUSSOLE = 236;

interface DialProps {
  uid: string;
  color: string;
  texture: DialTexture;
  movement: Movement;
  showDate: boolean;
  detail: "full" | "compact";
  subdialColor?: string;
  dateWindow?: DateWindowKind;
  /**
   * Réhaut : `minuterie` reporte la minuterie sur la bague inclinée, comme sur
   * une plongeuse ; `boussole` y imprime les points cardinaux.
   */
  rehaut?: "poli" | "minuterie" | "boussole";
}

export function Dial({ uid, color, texture, movement, showDate, detail, subdialColor, dateWindow = "date", rehaut = "poli" }: DialProps) {
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
        {texture === "soleil-profond" && (
          <>
            <use href={`#${uid}-conic-dial`} />
            {/* Fumé : la laque s'épaissit vers le bord, la teinte s'y noie. */}
            <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial-fume)`} />
            {/* Sous sa laque transparente, le cadran brille comme un émail. */}
            <ellipse
              cx={C - 84}
              cy={C - 104}
              rx="250"
              ry="180"
              fill={`url(#${uid}-gloss)`}
              opacity="0.3"
              transform={`rotate(-24 ${C - 84} ${C - 104})`}
            />
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

      {rehaut === "poli" ? (
        <MinuteTrack color={printed} detail={detail} />
      ) : (
        <PrintedRehaut uid={uid} color={color} printed={printed} kind={rehaut} detail={detail} />
      )}
      {rehaut === "boussole" && <MinuteTrack color={printed} detail={detail} radius={R_TRACK_BOUSSOLE} />}
      {movement === "NH34" && <GmtRing color={printed} detail={detail} />}
      {movement === "NH38" && <OpenHeart uid={uid} color={color} printed={printed} />}
      {movement === "VK64" && <ChronoSubdials color={subdialColor ?? "#EFE7D6"} printed={printed} />}
      {hasDate && (
        <g filter={`url(#${uid}-contact-shadow)`}>
          <DateWindow uid={uid} color={color} kind={dateWindow} />
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

function MinuteTrack({ color, detail, radius = R_MINUTE_TRACK }: { color: string; detail: "full" | "compact"; radius?: number }) {
  const count = detail === "full" ? 60 : 12;
  const step = 360 / count;
  return (
    <g data-layer="minuterie">
      <circle
        cx={C}
        cy={C}
        r={radius + 12}
        fill="none"
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      {Array.from({ length: count }, (_, i) => {
        const angle = step * i;
        const major = angle % 30 === 0;
        const a = polar(radius + 11, angle);
        const b = polar(radius + (major ? 0 : 4), angle);
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

/**
 * Réhaut imprimé. Sur une plongeuse japonaise la minuterie ne vit pas sur le
 * cadran mais sur la bague inclinée qui l'entoure : le cadran reste libre pour
 * de gros index, et la pente ramène les graduations vers l'œil. Sur une montre
 * de montagne, la même bague tourne (seconde couronne) et porte une rose des
 * vents : pointée sur le soleil avec l'aiguille des heures, elle donne le sud.
 * La pente regarde le centre : elle est sombre du côté de la lumière, claire à
 * l'opposé — l'inverse d'un flanc de boîtier.
 */
function PrintedRehaut({
  uid,
  color,
  printed,
  kind,
  detail,
}: {
  uid: string;
  color: string;
  printed: string;
  kind: "minuterie" | "boussole";
  detail: "full" | "compact";
}) {
  const rOut = R_DIAL - 4;
  const rIn = kind === "boussole" ? R_COMPASS_IN : R_CHAPTER_IN;
  const rMid = (rOut + rIn) / 2;
  const full = detail === "full";
  // La rose des vents doit rester lisible : sa bague est à peine plus sombre
  // que le cadran, là où celle d'une plongeuse peut s'enfoncer dans l'ombre.
  const base = kind === "boussole" ? (isLight(color) ? shade(color, 0.04) : shade(color, 0.1)) : isLight(color) ? shade(color, 0.1) : shade(color, 0.22);
  const cardinaux = ["N", "E", "S", "O"];

  return (
    <g data-layer={kind === "boussole" ? "rehaut-boussole" : "rehaut-minuterie"}>
      <path d={annulus(rOut, rIn)} fillRule="evenodd" fill={base} />
      <path d={annulus(rOut, rIn)} fillRule="evenodd" fill={`url(#${uid}-rehaut-pente)`} opacity={kind === "boussole" ? 0.6 : 1} />
      {/* La bague surplombe le cadran : elle y porte une ombre, en bas à droite de son bord éclairé. */}
      <circle cx={C + 1.5} cy={C + 2.5} r={rIn - 3} fill="none" stroke={INK} strokeOpacity="0.34" strokeWidth="6" />
      <circle cx={C} cy={C} r={rIn} fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="1.2" />
      <circle cx={C} cy={C} r={rOut} fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.2" />

      {kind === "minuterie" &&
        Array.from({ length: full ? 60 : 12 }, (_, i) => {
          const angle = (360 / (full ? 60 : 12)) * i;
          const major = angle % 30 === 0;
          const a = polar(rOut - 3.5, angle);
          const b = polar(major ? rIn + 3.5 : rMid - 1, angle);
          return (
            <line
              key={i}
              x1={n(a.x)}
              y1={n(a.y)}
              x2={n(b.x)}
              y2={n(b.y)}
              stroke={printed}
              strokeOpacity={major ? 0.95 : 0.7}
              strokeWidth={major ? 4.2 : 2}
            />
          );
        })}

      {kind === "boussole" && (
        <>
          {Array.from({ length: full ? 72 : 12 }, (_, i) => {
            const angle = (360 / (full ? 72 : 12)) * i;
            if (angle % 90 === 0) return null;
            const inter = angle % 45 === 0; // NE, SE, SO, NO
            const trente = angle % 30 === 0;
            const a = polar(rOut - 4, angle);
            const b = polar(inter ? rIn + 5 : trente ? rMid - 3 : rMid + 4, angle);
            return (
              <line
                key={i}
                x1={n(a.x)}
                y1={n(a.y)}
                x2={n(b.x)}
                y2={n(b.y)}
                stroke={printed}
                strokeOpacity={inter ? 1 : trente ? 0.9 : 0.7}
                strokeWidth={inter ? 3.6 : trente ? 2.6 : 1.7}
              />
            );
          })}
          {cardinaux.map((lettre, i) => {
            const angle = i * 90;
            const p = polar(rMid, angle);
            // Chaque lettre se lit depuis le centre, comme sur une rose des vents.
            return (
              <text
                key={lettre}
                x={n(p.x)}
                y={n(p.y)}
                dy="8.5"
                textAnchor="middle"
                fill={lettre === "N" ? "#E2543A" : printed}
                transform={`rotate(${angle} ${n(p.x)} ${n(p.y)})`}
                style={{ fontFamily: "var(--font-ui)", fontSize: 24, fontWeight: 700 }}
              >
                {lettre}
              </text>
            );
          })}
        </>
      )}
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

function DateWindow({ uid, color, kind }: { uid: string; color: string; kind: DateWindowKind }) {
  // Jour et date : le guichet s'élargit vers le centre, le jour à gauche du
  // quantième. Deux disques superposés tournent dessous, d'où le filet qui les
  // sépare.
  const jour = kind === "jour-date";
  const w = jour ? 136 : 68;
  const x = C + 232 - w;
  const y = C - 25;
  const light = isLight(color);
  const disque = light ? "#F7F5EF" : "#15171A";
  const encre = light ? "#15171A" : "#F1F2F4";
  const police = { fontFamily: "var(--font-ui)", fontWeight: 600 };
  return (
    <g data-layer="guichet-date">
      {/* Cadre appliqué, poli, puis le disque de quantième en retrait. */}
      <rect x={x} y={y} width={w} height="50" rx="3" fill={`url(#${uid}-case)`} stroke={INK} strokeOpacity="0.6" strokeWidth="0.9" />
      <rect x={x + 5} y={y + 5} width={w - 10} height="40" rx="1.5" fill={disque} />
      {/* Le cadre porte son ombre sur le disque, du côté de la lumière. */}
      <path d={`M ${x + 5} ${y + 45} L ${x + 5} ${y + 5} L ${x + w - 5} ${y + 5}`} fill="none" stroke={INK} strokeOpacity={light ? 0.3 : 0.7} strokeWidth="3" />
      {jour && (
        <>
          <line x1={x + 78} y1={y + 6} x2={x + 78} y2={y + 44} stroke={encre} strokeOpacity="0.35" strokeWidth="1.2" />
          <text x={x + 42} y={y + 35} textAnchor="middle" fill={encre} style={{ ...police, fontSize: 26, letterSpacing: "0.02em" }}>
            LUN
          </text>
        </>
      )}
      <text x={x + w - 34} y={y + 36} textAnchor="middle" fill={encre} style={{ ...police, fontSize: 30 }}>
        11
      </text>
    </g>
  );
}
