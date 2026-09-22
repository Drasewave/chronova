import { INK, METALS, isLight, rampAt, shade, tint } from "../palette";
import { Ring, annulus } from "./conic";
import { C, R_DIAL, R_MINUTE_TRACK, n, polar } from "../geometry";
import type { DateWindow as DateWindowKind, DialTexture, MetalTone, Movement } from "../types";

/** Bord intérieur du réhaut imprimé d'une plongeuse, et du réhaut boussole. */
const R_CHAPTER_IN = 263;
const R_COMPASS_IN = 252;
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
  /** Échelle 24 h imprimée du GMT. Une lunette 24 h la rend inutile : on la retire. */
  gmtScale?: boolean;
  /** Étanchéité réelle du modèle, en mètres ; absente, la ligne de calibre reste. */
  waterResistM?: number;
  /** Métal du cerclage rapporté (cœur ouvert). */
  metal?: MetalTone;
  /**
   * Seconde courante, en degrés : sur un chronographe elle se lit au compteur
   * « SEC », pas au centre. Absente : compteur à zéro.
   */
  smallSecondsAngle?: number;
  /**
   * Nom resserré et descendu d'un cran : l'échelle 13–24 d'un cadran de terrain
   * occupe la place habituelle du nom, qui buterait contre « 23 » et « 13 ».
   */
  compactSignature?: boolean;
}

export function Dial({
  uid,
  color,
  texture,
  movement,
  showDate,
  detail,
  subdialColor,
  dateWindow = "date",
  rehaut = "poli",
  gmtScale = true,
  waterResistM,
  metal = "acier",
  smallSecondsAngle = 0,
  compactSignature = false,
}: DialProps) {
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
          <>
            <ellipse
              cx={C - 84}
              cy={C - 104}
              rx="250"
              ry="180"
              fill={`url(#${uid}-gloss)`}
              opacity="0.6"
              transform={`rotate(-24 ${C - 84} ${C - 104})`}
            />
            {/* L'émail a de l'épaisseur : sous sa surface vitrifiée, la fenêtre
                du studio se réfléchit une seconde fois, plus nette, près du bord. */}
            {detail === "full" && (
              <circle
                cx={C}
                cy={C}
                r={R_DIAL - 22}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.22"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${n(2 * Math.PI * (R_DIAL - 22) * 0.14)} ${n(2 * Math.PI * (R_DIAL - 22))}`}
                transform={`rotate(-160 ${C} ${C})`}
              />
            )}
          </>
        )}
        {texture === "mat" && detail === "full" && <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial-grain)`} />}
      </g>

      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-dial-vignette)`} />
      <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-rehaut-cast)`} />

      {/* Réhaut : la bague polie, en pente, entre le cadran et le verre. Tournée
          vers le centre, elle renvoie le côté opposé du studio, assombri. */}
      <Ring id={`${uid}-clip-rehaut`} disk={`${uid}-conic-poli`} rOut={R_DIAL} rIn={R_DIAL - 10} rotate={180} />
      <circle cx={C} cy={C} r={R_DIAL - 5} fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="10" />
      <circle cx={C} cy={C} r={R_DIAL - 10} fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="1.2" />

      {rehaut === "poli" ? (
        <MinuteTrack color={printed} detail={detail} fine={movement === "VK64"} />
      ) : (
        <PrintedRehaut uid={uid} color={color} printed={printed} kind={rehaut} detail={detail} />
      )}
      {rehaut === "boussole" && <MinuteTrack color={printed} detail={detail} radius={R_TRACK_BOUSSOLE} />}
      {movement === "NH34" && gmtScale && <GmtRing color={printed} detail={detail} />}
      {movement === "NH38" && <OpenHeart uid={uid} color={color} metal={metal} detail={detail} />}
      {movement === "VK64" && <ChronoSubdials color={subdialColor ?? "#EFE7D6"} detail={detail} secondsAngle={smallSecondsAngle} />}
      {hasDate && (
        <g filter={`url(#${uid}-contact-shadow)`}>
          <DateWindow uid={uid} color={color} kind={dateWindow} />
        </g>
      )}

      {/* Signature : le nom, puis la ligne technique, comme une tampographie. */}
      <text
        x={C}
        y={compactSignature ? C - 110 : C - 128}
        textAnchor="middle"
        fill={printed}
        style={{ fontFamily: "var(--font-title)", fontSize: compactSignature ? 27 : 33, fontWeight: 500, letterSpacing: "0.24em" }}
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
      {/* Seconde ligne : l'étanchéité de la fiche du modèle quand le rendu la
          connaît, comme sur une plongeuse ; sinon le calibre. */}
      <text
        x={C}
        y={C + 174}
        textAnchor="middle"
        fill={printed}
        fillOpacity={waterResistM ? 0.78 : 0.6}
        style={{ fontFamily: "var(--font-ui)", fontSize: waterResistM ? 14.5 : 13, fontWeight: waterResistM ? 500 : 400, letterSpacing: waterResistM ? "0.22em" : "0.3em" }}
      >
        {waterResistM ? `${waterResistM} m` : movement}
      </text>
    </g>
  );
}

function MinuteTrack({
  color,
  detail,
  radius = R_MINUTE_TRACK,
  fine = false,
}: {
  color: string;
  detail: "full" | "compact";
  radius?: number;
  /** Chronographe : chaque seconde est recoupée, la trotteuse s'arrête entre deux traits. */
  fine?: boolean;
}) {
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
      {/* Chemin de fer : le second rail, côté centre, entre lequel courent les traits. */}
      {detail === "full" && (
        <circle cx={C} cy={C} r={radius + 4} fill="none" stroke={color} strokeOpacity="0.22" strokeWidth="1" />
      )}
      {fine &&
        detail === "full" &&
        Array.from({ length: 180 }, (_, i) => {
          if (i % 3 === 0) return null;
          const a = polar(radius + 11, i * 2);
          const b = polar(radius + 7, i * 2);
          return <line key={`f${i}`} x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={color} strokeOpacity="0.45" strokeWidth="1" />;
        })}
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

/** Spirale d'Archimède, pour le spiral du balancier. */
function spirale(cx: number, cy: number, r0: number, r1: number, tours: number): string {
  const pas = 96;
  return Array.from({ length: pas + 1 }, (_, i) => {
    const t = i / pas;
    const a = t * tours * 2 * Math.PI;
    const r = r0 + (r1 - r0) * t;
    return `${i ? "L" : "M"} ${n(cx + r * Math.cos(a))} ${n(cy + r * Math.sin(a))}`;
  }).join(" ");
}

/**
 * Cœur ouvert du NH38 : une lucarne à 9 h, cerclée d'un jonc poli rapporté,
 * au fond de laquelle on voit le balancier, son spiral et le pont qui le tient.
 * La platine est perlée, comme sous le cadran ; le pont traverse l'ouverture en
 * biais, tenu par une vis bleuie, le rubis du contre-pivot en son centre.
 */
function OpenHeart({ uid, color, metal, detail }: { uid: string; color: string; metal: MetalTone; detail: "full" | "compact" }) {
  const cx = C - 146;
  const cy = C;
  const r = 60;
  const ramp = METALS[metal];
  const acier = METALS.acier;
  const laiton = METALS.dore;
  const full = detail === "full";
  const clip = `${uid}-clip-lucarne`;
  // La lucarne occupe un bon quart du cadran : on la dessine à l'échelle du
  // balancier, puis on l'agrandit d'un bloc autour de son centre.
  const k = 1.24;
  return (
    <g data-layer="coeur-ouvert" transform={`translate(${14 + cx * (1 - k)} ${cy * (1 - k)}) scale(${k})`}>
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r} fill={shade(acier.dark, 0.35)} />
      <g clipPath={`url(#${clip})`}>
        {/* Platine perlée : des pastilles qui se chevauchent. */}
        {full &&
          Array.from({ length: 30 }, (_, i) => {
            const px = cx - r + 12 + (i % 6) * 22 + (Math.floor(i / 6) % 2) * 11;
            const py = cy - r + 10 + Math.floor(i / 6) * 25;
            return <circle key={i} cx={px} cy={py} r="13" fill="none" stroke={acier.light} strokeOpacity="0.2" strokeWidth="1.2" />;
          })}
        {/* L'ouverture est profonde : son bord éclairé porte une ombre au fond. */}
        <circle cx={cx + 3} cy={cy + 5} r={r + 2} fill="none" stroke={INK} strokeOpacity="0.55" strokeWidth="16" />

        {/* Balancier : serge dorée, deux bras, vu sous le pont. */}
        <circle cx={cx + 2} cy={cy + 3} r="40" fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="8" />
        <circle cx={cx} cy={cy} r="40" fill="none" stroke={laiton.mid} strokeWidth="7" />
        <circle cx={cx} cy={cy} r="43" fill="none" stroke={laiton.hi} strokeOpacity="0.7" strokeWidth="1" strokeDasharray="60 210" transform={`rotate(200 ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r="36.5" fill="none" stroke={laiton.edge} strokeOpacity="0.55" strokeWidth="1" />
        <line x1={cx - 37} y1={cy} x2={cx + 37} y2={cy} stroke={laiton.mid} strokeWidth="6" transform={`rotate(24 ${cx} ${cy})`} />
        <line x1={cx - 37} y1={cy - 1.4} x2={cx + 37} y2={cy - 1.4} stroke={laiton.hi} strokeOpacity="0.6" strokeWidth="1" transform={`rotate(24 ${cx} ${cy})`} />
        {/* Spiral : bleui, serré autour de la virole. */}
        <path d={spirale(cx, cy, 6, 27, full ? 6 : 3)} fill="none" stroke={METALS.bleui.light} strokeOpacity="0.9" strokeWidth={full ? 1.1 : 1.8} />

        {/* Pont de balancier : il traverse la lucarne en biais. */}
        <g transform={`rotate(-38 ${cx} ${cy})`}>
          <path d={`M ${cx - r - 6} ${cy - 13} L ${cx + 8} ${cy - 11} Q ${cx + 20} ${cy} ${cx + 8} ${cy + 11} L ${cx - r - 6} ${cy + 13} Z`} fill={INK} fillOpacity="0.4" transform="translate(3 5)" />
          <path d={`M ${cx - r - 6} ${cy - 13} L ${cx + 8} ${cy - 11} Q ${cx + 20} ${cy} ${cx + 8} ${cy + 11} L ${cx - r - 6} ${cy + 13} Z`} fill={rampAt(acier, 0.62)} stroke={acier.edge} strokeOpacity="0.7" strokeWidth="1" />
          {full && <line x1={cx - r} y1={cy - 10.5} x2={cx + 7} y2={cy - 9} stroke={acier.hi} strokeOpacity="0.85" strokeWidth="1.4" />}
          {/* Vis bleuie, fente comprise. */}
          <circle cx={cx - 38} cy={cy} r="7" fill={METALS.bleui.mid} stroke={METALS.bleui.edge} strokeWidth="1" />
          <line x1={cx - 43} y1={cy} x2={cx - 33} y2={cy} stroke={METALS.bleui.edge} strokeWidth="1.8" transform={`rotate(58 ${cx - 38} ${cy})`} />
          <circle cx={cx - 40} cy={cy - 2.4} r="1.6" fill={METALS.bleui.hi} fillOpacity="0.8" />
        </g>
        {/* Contre-pivot : chaton doré, rubis, et le ressort antichoc en lyre. */}
        <circle cx={cx} cy={cy} r="10" fill={laiton.light} stroke={laiton.edge} strokeOpacity="0.7" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="5.6" fill="#B3204C" />
        <circle cx={cx - 1.6} cy={cy - 1.8} r="1.6" fill="#FFC9D8" />
        {full && <path d={`M ${cx - 8} ${cy + 3} Q ${cx} ${cy - 12} ${cx + 8} ${cy + 3}`} fill="none" stroke={laiton.edge} strokeOpacity="0.7" strokeWidth="1.2" />}
      </g>

      {/* Jonc rapporté, poli : il borde l'ouverture comme un cadre de guichet. */}
      <g transform={`translate(${cx - C} ${cy - C})`}>
        <Ring id={`${uid}-clip-jonc-lucarne`} disk={`${uid}-conic-poli`} rOut={r + 8} rIn={r} />
      </g>
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.2" />
      {/* La glace qui ferme l'ouverture n'existe pas : seul le verre de la montre la couvre. */}
      <circle cx={cx} cy={cy} r={r} fill={isLight(color) ? "none" : `url(#${uid}-ar)`} />
    </g>
  );
}

/**
 * Compteurs du VK64 : deux totalisateurs de part et d'autre du centre — 60
 * secondes à 9 h, 30 minutes à 3 h — dans l'axe des poussoirs. Chaque
 * compteur est une cuvette azurée (sillons concentriques) légèrement en creux,
 * cerclée d'un filet : c'est ce contraste franc qui fait le « panda ».
 *
 * Le serveur pose la petite seconde sur la seconde de catalogue et le
 * totalisateur à zéro. Dans le navigateur, `horloge-vivante.tsx` les reprend
 * (`data-aiguille`) avec la même convention : sur un méca-quartz la
 * seconde courante vit dans le compteur « SEC », qui bat une fois par seconde ;
 * le totalisateur « MIN » appartient au chronographe, arrêté et remis à zéro,
 * et retourne donc à midi comme la grande trotteuse centrale.
 */
function ChronoSubdials({ color, detail, secondsAngle }: { color: string; detail: "full" | "compact"; secondsAngle: number }) {
  const light = isLight(color);
  const ink = light ? shade(color, 0.7) : tint(color, 0.75);
  const offset = 128;
  const radius = 78;
  const full = detail === "full";

  const subdial = (cx: number, angleDeg: number, label: string, chiffres: string[], role: "petite-seconde" | "compteur-minutes") => (
    <g key={cx} transform={`translate(${cx} ${C})`}>
      {/* Cuvette : l'arête haute-gauche est dans l'ombre, la basse-droite éclairée. */}
      <circle r={radius + 2.5} fill={INK} fillOpacity="0.55" />
      <circle r={radius} fill={color} />
      {full &&
        Array.from({ length: 12 }, (_, i) => (
          <circle key={`az${i}`} r={8 + i * 5.6} fill="none" stroke={light ? INK : "#FFFFFF"} strokeOpacity={light ? 0.11 : 0.1} strokeWidth="1.2" />
        ))}
      <circle r={radius - 1} fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="3" transform="translate(1.2 1.8)" />
      {/* Le bord opposé de la cuvette fait face à la lumière : un fin éclat en bas à droite. */}
      {full && (
        <path
          d={`M ${n((radius - 2) * Math.sin(1.5))} ${n(-(radius - 2) * Math.cos(1.5))} A ${radius - 2} ${radius - 2} 0 0 1 ${n((radius - 2) * Math.sin(3.2))} ${n(-(radius - 2) * Math.cos(3.2))}`}
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
      <circle r={radius} fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="1.6" />
      {Array.from({ length: full ? 60 : 12 }, (_, i) => {
        const pas = full ? 6 : 30;
        const major = (i * pas) % 30 === 0;
        const quart = (i * pas) % 90 === 0;
        const a = polar(radius - 6, i * pas);
        const b = polar(radius - (quart ? 17 : major ? 14 : 10), i * pas);
        return (
          <line
            key={i}
            x1={n(a.x - C)}
            y1={n(a.y - C)}
            x2={n(b.x - C)}
            y2={n(b.y - C)}
            stroke={ink}
            strokeOpacity={major ? 0.85 : 0.5}
            strokeWidth={major ? 2.4 : 1.1}
          />
        );
      })}
      {full &&
        chiffres.map((chiffre, i) => {
          const p = polar(radius - 30, (i + 1) * 90);
          return (
            <text key={i} x={n(p.x - C)} y={n(p.y - C + 6)} textAnchor="middle" fill={ink} fillOpacity="0.9" style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 17 }}>
              {chiffre}
            </text>
          );
        })}
      <path data-aiguille={role} d={`M -2.6 12 L -0.8 ${-(radius - 16)} L 0.8 ${-(radius - 16)} L 2.6 12 Z`} fill={ink} transform={`rotate(${angleDeg})`} />
      <circle r="5" fill={ink} />
      <circle r="1.6" fill={color} />
      {full && (
        <text y={radius * 0.46} textAnchor="middle" fill={ink} fillOpacity="0.55" style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 9.5, letterSpacing: "0.12em" }}>
          {label}
        </text>
      )}
    </g>
  );

  return (
    <g data-layer="compteurs">
      {subdial(C - offset, secondsAngle, "SEC", ["15", "30", "45", "60"], "petite-seconde")}
      {/* Chronographe remis à zéro : le totalisateur des minutes est à midi, comme la trotteuse centrale. */}
      {subdial(C + offset, 0, "MIN", ["", "15", "", "30"], "compteur-minutes")}
    </g>
  );
}

function DateWindow({ uid, color, kind }: { uid: string; color: string; kind: DateWindowKind }) {
  // Jour et date : le guichet s'élargit vers le centre, le jour à gauche du
  // quantième. Deux disques superposés tournent dessous, d'où le filet qui les
  // sépare. « LUN 11 » est la pose de catalogue ; une fois la page montée,
  // l'horloge vivante y écrit le vrai jour et le vrai quantième (`data-guichet`).
  const jour = kind === "jour-date";
  const w = jour ? 136 : 68;
  const x = C + 232 - w;
  const y = C - 25;
  const light = isLight(color);
  const disque = light ? "#F7F5EF" : "#15171A";
  const encre = light ? "#15171A" : "#F1F2F4";
  const police = { fontFamily: "var(--font-ui)", fontWeight: 600 };
  return (
    // `id` stable : la loupe (`crystal.tsx`) reprend ce groupe par `<use>`, grossi
    // deux fois et demie — même disque, même quantième, mis à jour ensemble.
    <g id={`${uid}-guichet`} data-layer="guichet-date">
      {/* Cadre appliqué, poli, puis le disque de quantième en retrait. */}
      <rect x={x} y={y} width={w} height="50" rx="3" fill={`url(#${uid}-case)`} stroke={INK} strokeOpacity="0.6" strokeWidth="0.9" />
      {/* Arête polie du cadre, côté lumière. */}
      <line x1={x + 3} y1={y + 1.4} x2={x + w - 3} y2={y + 1.4} stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round" />
      <rect x={x + 5} y={y + 5} width={w - 10} height="40" rx="1.5" fill={disque} />
      {/* Le cadre porte son ombre sur le disque, du côté de la lumière. */}
      <path d={`M ${x + 5} ${y + 45} L ${x + 5} ${y + 5} L ${x + w - 5} ${y + 5}`} fill="none" stroke={INK} strokeOpacity={light ? 0.3 : 0.7} strokeWidth="3" />
      {jour && (
        <>
          <line x1={x + 78} y1={y + 6} x2={x + 78} y2={y + 44} stroke={encre} strokeOpacity="0.35" strokeWidth="1.2" />
          <text data-guichet="jour" x={x + 42} y={y + 35} textAnchor="middle" fill={encre} style={{ ...police, fontSize: 26, letterSpacing: "0.02em" }}>
            LUN
          </text>
        </>
      )}
      <text data-guichet="quantieme" x={x + w - 34} y={y + 36} textAnchor="middle" fill={encre} style={{ ...police, fontSize: 30 }}>
        11
      </text>
    </g>
  );
}
