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
  /**
   * Rayon de l'ouverture du verre. Une lunette à insert est plus large qu'une
   * lunette lisse : son ouverture se resserre (voir `dialScale`).
   */
  rIn?: number;
}

/** Largeur du chanfrein intérieur, qui retombe vers le verre. */
const CHAMFER = 9;

export function Bezel({ uid, style, metal, finish, insertColor, insertColor2, insertMaterial, lume, detail, rIn = R_BEZEL_IN }: BezelProps) {
  const ramp = METALS[metal];
  const rTop = rIn + CHAMFER;

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
          secondColor={insertColor2}
          scale={style === "gmt" ? "24h" : "60min"}
          material={insertMaterial ?? "ceramique"}
          lume={lume}
          detail={detail}
          rIn={rIn}
        />
      )}
      {style === "tachymetre" && <TachymeterInsert uid={uid} metal={metal} color={insertColor ?? "#17191C"} detail={detail} rIn={rIn} />}

      {/* Chanfrein intérieur poli : tourné vers le centre, il renvoie le côté opposé. */}
      <Ring id={`${uid}-clip-chanfrein`} disk={`${uid}-conic-poli`} rOut={rTop} rIn={rIn} rotate={180} />
      <circle cx="500" cy="500" r={rTop} fill="none" stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="500" cy="500" r={rIn} fill="none" stroke={ramp.edge} strokeWidth="1.6" />
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

/** Secteur de couronne entre deux angles (0° = midi, sens horaire), pour découper un insert. */
function sectorPath(a0: number, a1: number, r = 480): string {
  const p0 = polar(r, a0);
  const p1 = polar(r, a1);
  return `M 500 500 L ${n(p0.x)} ${n(p0.y)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${n(p1.x)} ${n(p1.y)} Z`;
}

/**
 * Une gravure remplie de peinture : le creux porte une ombre du côté de la
 * lumière. En vignette on s'en passe, le chiffre seul suffit.
 */
function Engraved({
  x,
  y,
  angle,
  size,
  fill,
  detail,
  children,
  spacing = "0.01em",
  weight = 600,
}: {
  x: number;
  y: number;
  angle: number;
  size: number;
  fill: string;
  detail: "full" | "compact";
  children: string;
  spacing?: string;
  weight?: number;
}) {
  const style = { fontFamily: "var(--font-ui)", fontSize: size, fontWeight: weight, letterSpacing: spacing };
  const t = `rotate(${n(angle)} ${n(x)} ${n(y)})`;
  return (
    <>
      {detail === "full" && (
        <text x={n(x - 1)} y={n(y - 1.3)} dy={n(size * 0.35)} textAnchor="middle" fill={INK} fillOpacity="0.6" transform={t} style={style}>
          {children}
        </text>
      )}
      <text x={n(x)} y={n(y)} dy={n(size * 0.35)} textAnchor="middle" fill={fill} transform={t} style={style}>
        {children}
      </text>
    </>
  );
}

/**
 * Insert gravé, triangle luminescent à midi. Deux graduations : soixante
 * minutes pour la plongée, vingt-quatre heures pour le GMT. Une seconde teinte
 * est possible : sur le GMT la moitié basse (6 h – 18 h, le jour), sur la
 * plongeuse le secteur des vingt premières minutes — la durée des paliers,
 * qu'on repère ainsi sans lire un chiffre.
 */
function DiveInsert({
  uid,
  metal,
  color,
  secondColor,
  scale,
  material,
  lume,
  detail,
  rIn,
}: {
  uid: string;
  metal: MetalTone;
  color: string;
  secondColor?: string;
  scale: "60min" | "24h";
  material: InsertMaterial;
  lume: boolean;
  detail: "full" | "compact";
  rIn: number;
}) {
  const ramp = METALS[metal];
  const rGrip = R_BEZEL_OUT - 13; // pourtour cranté, large : on le saisit avec des gants
  const rInsertOut = rGrip - 1;
  const rInsertIn = rIn + CHAMFER;
  const rMid = (rInsertOut + rInsertIn) / 2;
  const width = rInsertOut - rInsertIn;
  const full = detail === "full";
  // Gravure remplie : platine sur céramique, peinture claire sur aluminium.
  // Sur un insert bicolore, la même peinture doit rester lisible sur les deux teintes.
  const engraved = material === "ceramique" ? mix(PAPER, color, 0.08) : tint(color, secondColor ? 0.92 : 0.82);
  const teeth = full ? 60 : 30;
  const w = 360 / teeth;
  const pt = (r: number, a: number) => {
    const p = polar(r, a);
    return `${n(p.x)} ${n(p.y)}`;
  };
  const corps = Math.min(36, width * 0.62);

  return (
    <g>
      {/* Crantage « pièce de monnaie » : de larges dents carrées séparées par
          des gorges franches, et non un moletage fin. Chaque dent a un plat et
          deux flancs ; chacun prend la couleur de ce qu'il regarde, si bien que
          le pourtour scintille dent par dent. Les gorges mordent la silhouette :
          c'est ce qui se lit encore en vignette. */}
      <Ring id={`${uid}-clip-crans`} disk={`${uid}-conic-poli`} rOut={R_BEZEL_OUT} rIn={rGrip} />
      {Array.from({ length: teeth }, (_, i) => {
        const a = w * i;
        const rA = rGrip + 0.5;
        const rB = R_BEZEL_OUT - 0.3;
        const g = a + w / 2; // axe de la gorge
        return (
          <g key={`cran-${i}`}>
            <path
              d={`M ${pt(rA, a - w * 0.3)} L ${pt(rB, a - w * 0.3)} L ${pt(rB, a + w * 0.3)} L ${pt(rA, a + w * 0.3)} Z`}
              fill={rampAt(ramp, 0.3 + 0.66 * studioLum(a, "poli"))}
            />
            {full && (
              <>
                <path
                  d={`M ${pt(rA, a - w * 0.41)} L ${pt(rB - 2.5, a - w * 0.41)} L ${pt(rB, a - w * 0.3)} L ${pt(rA, a - w * 0.3)} Z`}
                  fill={rampAt(ramp, 0.12 + 0.7 * studioLum(a - 58, "poli"))}
                />
                <path
                  d={`M ${pt(rA, a + w * 0.3)} L ${pt(rB, a + w * 0.3)} L ${pt(rB - 2.5, a + w * 0.41)} L ${pt(rA, a + w * 0.41)} Z`}
                  fill={rampAt(ramp, 0.12 + 0.7 * studioLum(a + 58, "poli"))}
                />
              </>
            )}
            {/* Gorge : fond dans l'ombre, et l'entaille qu'elle fait dans la silhouette. */}
            <path
              d={`M ${pt(rA, g - w * 0.09)} L ${pt(R_BEZEL_OUT + 1.2, g - w * 0.12)} L ${pt(R_BEZEL_OUT + 1.2, g + w * 0.12)} L ${pt(rA, g + w * 0.09)} Z`}
              fill={INK}
              fillOpacity={full ? 0.72 : 0.6}
            />
          </g>
        );
      })}
      {/* Gorge tournée entre le crantage et l'insert. */}
      <circle cx="500" cy="500" r={rGrip + 0.8} fill="none" stroke={ramp.hi} strokeOpacity="0.5" strokeWidth="0.9" />

      <Ring id={`${uid}-clip-insert`} disk={`${uid}-conic-insert`} rOut={rInsertOut} rIn={rInsertIn} />
      {secondColor && (
        <>
          <clipPath id={`${uid}-clip-jour`}>
            {scale === "24h" ? <rect x="0" y="500" width="1000" height="500" /> : <path d={sectorPath(0, 120)} />}
          </clipPath>
          <g clipPath={`url(#${uid}-clip-jour)`}>
            <Ring id={`${uid}-clip-insert-jour`} disk={`${uid}-conic-insert-jour`} rOut={rInsertOut} rIn={rInsertIn} />
          </g>
        </>
      )}
      {/* L'insert est légèrement bombé : ses deux bords tombent. */}
      {full && (
        <>
          <circle cx="500" cy="500" r={rInsertOut - 3} fill="none" stroke={INK} strokeOpacity="0.16" strokeWidth="6" />
          <circle cx="500" cy="500" r={rInsertIn + 3} fill="none" stroke={INK} strokeOpacity="0.2" strokeWidth="6" />
        </>
      )}
      {/* L'insert est serti : un filet d'ombre de chaque côté. */}
      <circle cx="500" cy="500" r={rInsertOut} fill="none" stroke={INK} strokeOpacity="0.6" strokeWidth="1.6" />
      <circle cx="500" cy="500" r={rInsertIn} fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.4" />

      {full && material === "ceramique" && <InsertSheen rMid={rMid} width={width} />}

      {scale === "24h" && <Scale24 rMid={rMid} width={width} engraved={engraved} detail={detail} />}

      {scale === "60min" &&
        Array.from({ length: 60 }, (_, i) => {
          const angle = i * 6;
          if (angle === 0) return null;
          const dizaine = angle % 60 === 0;
          const cinq = angle % 30 === 0;
          if (!full && !cinq) return null;

          // Les cinq repères chiffrés remplacent leur trait, comme sur un insert
          // gravé ; chaque chiffre suit la courbure de la lunette.
          if (dizaine && full) {
            const p = polar(rMid, angle);
            const upright = angle > 90 && angle < 270 ? angle + 180 : angle;
            return (
              <Engraved key={i} x={p.x} y={p.y} angle={upright} size={corps} fill={engraved} detail={detail}>
                {(angle / 6).toString()}
              </Engraved>
            );
          }
          // Minuterie détaillée sur les vingt premières minutes : la plage des paliers.
          if (!cinq && angle > 120) return null;
          const a = polar(rInsertOut - (cinq ? 8 : 5), angle);
          const b = polar(cinq ? rInsertIn + 8 : rInsertOut - 5 - width * 0.3, angle);
          return (
            <line
              key={i}
              x1={n(a.x)}
              y1={n(a.y)}
              x2={n(b.x)}
              y2={n(b.y)}
              stroke={engraved}
              strokeWidth={cinq ? n(width * 0.17) : n(width * 0.075)}
            />
          );
        })}

      {/* Triangle de midi et sa perle luminescente, sertie de métal. */}
      <path
        d={`M ${n(500 - width * 0.42)} ${500 - rInsertOut + 5} L ${n(500 + width * 0.42)} ${500 - rInsertOut + 5} L 500 ${500 - rInsertIn - 4} Z`}
        fill={engraved}
      />
      <circle cx="500" cy={500 - rMid - 4} r={n(width * 0.2)} fill={ramp.mid} stroke={ramp.edge} strokeWidth="1" />
      <circle
        cx="500"
        cy={500 - rMid - 4}
        r={n(width * 0.2 - 2.6)}
        fill={lume ? LUME_FILL : ramp.light}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeWidth="1"
      />
      <circle cx={n(500 - width * 0.06)} cy={n(500 - rMid - 4 - width * 0.07)} r={n(width * 0.05)} fill="#FFFFFF" fillOpacity="0.7" />
    </g>
  );
}

/**
 * Reflet en bande d'un insert céramique : la surface est un vernis dur, elle
 * renvoie la fenêtre de la boîte à lumière en un arc large et doux, doublé d'un
 * fil plus vif sur son bord. Dessiné sous la gravure : la peinture (ou le
 * platine) est dans le creux, le reflet sur la surface — l'un ne voile pas
 * l'autre, mais le reflet passe par-dessus le fond.
 */
function InsertSheen({ rMid, width }: { rMid: number; width: number }) {
  const circ = 2 * Math.PI * rMid;
  return (
    <>
      {/* Nappe large et très douce : on la devine plus qu'on ne la voit. */}
      <circle cx="500" cy="500" r={rMid} fill="none" stroke="#FFFFFF" strokeOpacity="0.055" strokeWidth={n(width * 0.8)} strokeLinecap="round" strokeDasharray={`${n(circ * 0.3)} ${n(circ)}`} transform="rotate(-190 500 500)" />
      {/* Le fil vif : l'arête de la fenêtre du studio, qui suit la courbure du vernis. */}
      <circle cx="500" cy="500" r={n(rMid - width * 0.3)} fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round" strokeDasharray={`${n(circ * 0.1)} ${n(circ)}`} transform="rotate(-158 500 500)" />
    </>
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
  const corps = Math.min(33, width * 0.58);
  return (
    <g>
      {Array.from({ length: 24 }, (_, hour) => {
        if (hour === 0) return null;
        const angle = hour * 15;
        const p = polar(rMid, angle);
        if (hour % 2 === 1 || detail === "compact") {
          if (detail === "compact" && hour % 2 === 1) return null;
          return <circle key={hour} cx={n(p.x)} cy={n(p.y)} r={detail === "compact" ? 5.5 : n(width * 0.085)} fill={engraved} />;
        }
        const upright = angle > 90 && angle < 270 ? angle + 180 : angle;
        return (
          <Engraved key={hour} x={p.x} y={p.y} angle={upright} size={corps} fill={engraved} detail={detail}>
            {hour.toString()}
          </Engraved>
        );
      })}
    </g>
  );
}

/** Vitesses gravées : `v` km/h pour un kilomètre parcouru en 3600 / v secondes. */
const VITESSES = [500, 400, 300, 250, 200, 180, 160, 150, 140, 130, 120, 110, 100, 90, 85, 80, 75, 70, 65, 60];

/**
 * Lunette tachymétrique : fixe, sans crantage, un insert noir gravé d'une
 * échelle de vitesse. On lance le chronographe à une borne, on l'arrête à la
 * suivante : la trotteuse pointe la vitesse moyenne. L'échelle est donc
 * hyperbolique — serrée vers 500, large vers 60 — et c'est ce rythme irrégulier
 * qui fait reconnaître un chronographe de sport de loin.
 */
function TachymeterInsert({
  uid,
  metal,
  color,
  detail,
  rIn,
}: {
  uid: string;
  metal: MetalTone;
  color: string;
  detail: "full" | "compact";
  rIn: number;
}) {
  const ramp = METALS[metal];
  const full = detail === "full";
  const rRim = R_BEZEL_OUT - 9; // simple jonc poli : on ne tourne pas cette lunette
  const rInsertOut = rRim - 1;
  const rInsertIn = rIn + CHAMFER;
  const width = rInsertOut - rInsertIn;
  const rText = rInsertIn + width * 0.42;
  const engraved = tint(color, 0.86);
  const arcId = `${uid}-arc-tachy`;
  const a0 = polar(rText - 6.5, 5);
  const a1 = polar(rText - 6.5, 37);

  return (
    <g>
      <Ring id={`${uid}-clip-jonc`} disk={`${uid}-conic-poli`} rOut={R_BEZEL_OUT} rIn={rRim} />
      <circle cx="500" cy="500" r={rRim + 0.8} fill="none" stroke={ramp.hi} strokeOpacity="0.5" strokeWidth="0.9" />
      <Ring id={`${uid}-clip-insert`} disk={`${uid}-conic-insert`} rOut={rInsertOut} rIn={rInsertIn} />
      {full && (
        <>
          <circle cx="500" cy="500" r={rInsertOut - 3} fill="none" stroke={INK} strokeOpacity="0.16" strokeWidth="6" />
          <circle cx="500" cy="500" r={rInsertIn + 3} fill="none" stroke={INK} strokeOpacity="0.2" strokeWidth="6" />
        </>
      )}
      <circle cx="500" cy="500" r={rInsertOut} fill="none" stroke={INK} strokeOpacity="0.6" strokeWidth="1.6" />
      <circle cx="500" cy="500" r={rInsertIn} fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.4" />
      {full && <InsertSheen rMid={(rInsertOut + rInsertIn) / 2} width={width} />}

      {/* Repères : un trait au bord extérieur pour chaque vitesse gravée, et en
          plein détail les subdivisions intermédiaires. */}
      {VITESSES.map((v) => {
        const angle = (3600 / v) * 6;
        const a = polar(rInsertOut - 3, angle);
        const b = polar(rInsertOut - 3 - width * 0.2, angle);
        return <line key={v} x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={engraved} strokeWidth={full ? 3 : 4} />;
      })}
      {full &&
        [450, 350, 275, 225, 190, 170, 155, 145, 135, 125, 115, 105, 95, 62.5, 67.5, 72.5, 77.5, 82.5, 87.5].map((v) => {
          const angle = (3600 / v) * 6;
          const a = polar(rInsertOut - 3, angle);
          const b = polar(rInsertOut - 3 - width * 0.11, angle);
          return <line key={v} x1={n(a.x)} y1={n(a.y)} x2={n(b.x)} y2={n(b.y)} stroke={engraved} strokeOpacity="0.85" strokeWidth="1.6" />;
        })}

      {VITESSES.map((v) => {
        if (!full && ![400, 200, 120, 90, 70, 60].includes(v)) return null;
        const angle = ((3600 / v) * 6) % 360;
        const p = polar(rText - (full ? 0 : 2), angle);
        const upright = angle > 90 && angle < 270 ? angle + 180 : angle;
        return (
          <Engraved key={v} x={p.x} y={p.y} angle={upright} size={full ? n(width * 0.4) : n(width * 0.52)} fill={engraved} detail={detail} spacing="-0.01em">
            {v.toString()}
          </Engraved>
        );
      })}

      {full && (
        <>
          <path id={arcId} d={`M ${n(a0.x)} ${n(a0.y)} A ${n(rText - 6.5)} ${n(rText - 6.5)} 0 0 1 ${n(a1.x)} ${n(a1.y)}`} fill="none" />
          <text fill={engraved} style={{ fontFamily: "var(--font-ui)", fontSize: n(width * 0.33), fontWeight: 600, letterSpacing: "0.09em" }}>
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              TACHYMETRE
            </textPath>
          </text>
        </>
      )}
    </g>
  );
}
