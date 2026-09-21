import type { MetalTone, StrapKind } from "../types";
import { Fragment } from "react";
import { INK, METALS, PAPER, shade, tint } from "../palette";
import { C, R_LUG_TIP as LUG_TIP, n } from "../geometry";

/**
 * Toute la géométrie du brin s'exprime en `d`, la distance au centre le long de
 * l'axe 12 h – 6 h. Les deux brins partagent donc le même dessin sans `rotate`
 * ni `scale(-1)` : un retournement inverserait aussi la lumière, et les maillons
 * du bas seraient éclairés par en dessous.
 */
type Dir = -1 | 1;

/** Demi-largeur à l'entrecorne : un bracelet de 20 mm sur un boîtier de 40. */
const HALF = 176;
/** Le brin s'affine en s'éloignant des cornes, puis sort du cadre. */
const HALF_AT_EDGE = 164;
const D_EDGE = 660;
/** Un bracelet acier ou un NATO passe sous la carrure. */
const D_UNDER_CASE = 284;
/** Axe de la barrette, et bout du brin roulé autour d'elle. */
const D_BAR = 386;
const D_LOOP = 366;
/** La pièce de bout affleure la pointe des cornes. */
const D_END_LINK = LUG_TIP + 8;


interface StrapProps {
  uid: string;
  kind: StrapKind;
  color: string;
  metal: MetalTone;
  detail: "full" | "compact";
  /** Distance du centre au bord du cadre, dans le repère de la montre. */
  frame: number;
}

type BandProps = StrapProps & { dir: Dir; half: "haut" | "bas" };

const y = (dir: Dir, d: number) => n(C + dir * d);

function halfAt(d: number): number {
  if (d <= LUG_TIP) return HALF;
  return HALF + ((HALF_AT_EDGE - HALF) * (d - LUG_TIP)) / (D_EDGE - LUG_TIP);
}

/** Bande transversale entre deux distances, quel que soit le brin. */
function span(dir: Dir, d0: number, d1: number) {
  return { y: Math.min(y(dir, d0), y(dir, d1)), height: n(Math.abs(d1 - d0)) };
}

function outline(dir: Dir, dStart: number, r: number): string {
  const L = C - HALF;
  const R = C + HALF;
  return [
    `M ${L + r} ${y(dir, dStart)}`,
    `Q ${L} ${y(dir, dStart)} ${L} ${y(dir, dStart + r)}`,
    `L ${L} ${y(dir, LUG_TIP)}`,
    `L ${C - HALF_AT_EDGE} ${y(dir, D_EDGE)}`,
    `L ${C + HALF_AT_EDGE} ${y(dir, D_EDGE)}`,
    `L ${R} ${y(dir, LUG_TIP)}`,
    `L ${R} ${y(dir, dStart + r)}`,
    `Q ${R} ${y(dir, dStart)} ${R - r} ${y(dir, dStart)}`,
    "Z",
  ].join(" ");
}

export function Strap(props: StrapProps) {
  return (
    // Le brin ne bute pas contre le bord du cadre : il s'y éteint.
    <g data-layer="bracelet" mask={`url(#${props.uid}-strap-fade)`}>
      <StrapDefs {...props} />
      <Band {...props} dir={-1} half="haut" />
      <Band {...props} dir={1} half="bas" />
    </g>
  );
}

/** Dégradé le long du brin : 0 côté boîtier, 1 vers l'extérieur. */
function AxisGradient({
  id,
  dir,
  stops,
}: {
  id: string;
  dir: Dir;
  stops: Array<[offset: number, color: string, opacity: number]>;
}) {
  return (
    <linearGradient id={id} x1="0" x2="0" y1={dir === -1 ? 1 : 0} y2={dir === -1 ? 0 : 1}>
      {stops.map(([offset, color, opacity]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </linearGradient>
  );
}

function StrapDefs({ uid, kind, metal, detail, frame }: StrapProps) {
  const isSteel = kind === "acier-3-maillons" || kind === "acier-jubile";
  return (
    <defs>
      {(["haut", "bas"] as const).map((half) => {
        const dir: Dir = half === "haut" ? -1 : 1;
        return (
          <Fragment key={half}>
            <clipPath id={`${uid}-strap-${half}`}>
              <path d={outline(dir, isSteel || kind === "nato" ? D_UNDER_CASE : D_LOOP, isSteel || kind === "nato" ? 0 : 12)} />
            </clipPath>
            {/* Le brin roulé autour de la barrette : un cylindre couché. */}
            <AxisGradient
              id={`${uid}-strap-roll-${half}`}
              dir={dir}
              stops={[
                [0, INK, 0.5],
                [0.42, PAPER, 0.2],
                [0.7, PAPER, 0],
                [1, INK, 0.28],
              ]}
            />
            {/* Ce qui passe sous la carrure plonge dans son ombre. */}
            <AxisGradient
              id={`${uid}-strap-under-${half}`}
              dir={dir}
              stops={[
                [0, INK, 0.62],
                [0.5, INK, 0.3],
                [1, INK, 0],
              ]}
            />
            {/* Pièce de bout : creusée contre le boîtier, bombée vers la pointe. */}
            <AxisGradient
              id={`${uid}-strap-endlink-${half}`}
              dir={dir}
              stops={[
                [0, INK, 0.58],
                [0.4, INK, 0.12],
                [0.72, PAPER, 0.16],
                [1, INK, 0.2],
              ]}
            />
          </Fragment>
        );
      })}

      <linearGradient id={`${uid}-strap-fade-ramp`} gradientUnits="userSpaceOnUse" x1="0" y1={C - frame} x2="0" y2={C + frame}>
        <stop offset="0" stopColor="#000" />
        <stop offset="0.055" stopColor="#fff" />
        <stop offset="0.945" stopColor="#fff" />
        <stop offset="1" stopColor="#000" />
      </linearGradient>
      <mask id={`${uid}-strap-fade`} maskUnits="userSpaceOnUse" x="0" y={C - frame} width="1000" height={frame * 2}>
        <rect x="0" y={C - frame} width="1000" height={frame * 2} fill={`url(#${uid}-strap-fade-ramp)`} />
      </mask>

      {/* Galbe transversal : la matière est plus épaisse au centre du brin. */}
      <linearGradient id={`${uid}-strap-dome`} gradientUnits="userSpaceOnUse" x1={C - HALF} y1="0" x2={C + HALF} y2="0">
        <stop offset="0" stopColor={INK} stopOpacity="0.34" />
        <stop offset="0.16" stopColor={INK} stopOpacity="0" />
        <stop offset="0.42" stopColor={PAPER} stopOpacity="0.14" />
        <stop offset="0.8" stopColor={INK} stopOpacity="0" />
        <stop offset="1" stopColor={INK} stopOpacity="0.44" />
      </linearGradient>

      {/* Acier du bracelet : un seul dégradé sur toute la largeur. Un dégradé
          par maillon ferait scintiller chaque pièce comme un damier. */}
      <linearGradient id={`${uid}-strap-steel`} gradientUnits="userSpaceOnUse" x1={C - HALF} y1="0" x2={C + HALF} y2="0">
        <stop offset="0" stopColor={METALS[metal].mid} />
        <stop offset="0.3" stopColor={METALS[metal].light} />
        <stop offset="0.62" stopColor={METALS[metal].mid} />
        <stop offset="1" stopColor={METALS[metal].dark} />
      </linearGradient>

      {/* Maillon bombé, éclairé par le haut de l'image sur les deux brins. */}
      <linearGradient id={`${uid}-link-round`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={INK} stopOpacity="0.28" />
        <stop offset="0.1" stopColor={PAPER} stopOpacity="0.75" />
        <stop offset="0.3" stopColor={PAPER} stopOpacity="0.08" />
        <stop offset="0.7" stopColor={INK} stopOpacity="0.06" />
        <stop offset="1" stopColor={INK} stopOpacity="0.58" />
      </linearGradient>
      {/* Maillon poli : le même galbe, avec un reflet franc. */}
      <linearGradient id={`${uid}-link-polished`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={INK} stopOpacity="0.2" />
        <stop offset="0.2" stopColor={PAPER} stopOpacity="0.85" />
        <stop offset="0.4" stopColor={PAPER} stopOpacity="0.1" />
        <stop offset="1" stopColor={INK} stopOpacity="0.55" />
      </linearGradient>

      {detail === "full" && (
        <>
          {/* Brossage des maillons, dans le sens du bracelet. */}
          <pattern id={`${uid}-strap-brush`} width="5" height="9" patternUnits="userSpaceOnUse">
            <line x1="1" y1="0" x2="1" y2="9" stroke={PAPER} strokeOpacity="0.2" strokeWidth="1" />
            <line x1="3.5" y1="0" x2="3.5" y2="9" stroke={INK} strokeOpacity="0.1" strokeWidth="1" />
          </pattern>
          {/* Armure du nylon : des côtes serrées en travers du brin. */}
          <pattern id={`${uid}-strap-weave`} width="8" height="6" patternUnits="userSpaceOnUse">
            <rect width="8" height="3" fill={INK} fillOpacity="0.13" />
            <rect y="3" width="8" height="1" fill={PAPER} fillOpacity="0.12" />
            <line x1="4" y1="0" x2="4" y2="6" stroke={INK} strokeOpacity="0.07" strokeWidth="1" />
          </pattern>
          {/* Bord adouci du reflet d'un cuir glacé. */}
          <filter id={`${uid}-pf-flou-brin`} x="-50%" y="-5%" width="200%" height="110%">
            <feGaussianBlur stdDeviation="3 0" />
          </filter>
          {/* Grain du cuir. */}
          <filter id={`${uid}-strap-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55 0.7" numOctaves="2" seed="7" result="bruit" />
            <feColorMatrix
              in="bruit"
              type="matrix"
              values="0 0 0 0 0.13  0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 1.5 -0.62"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </>
      )}
    </defs>
  );
}

function Band(props: BandProps) {
  const { uid, kind, color, metal, dir, half } = props;
  const clip = `url(#${uid}-strap-${half})`;
  const isSteel = kind === "acier-3-maillons" || kind === "acier-jubile";
  const passesUnder = isSteel || kind === "nato";

  return (
    <g>
      {/* Un brin droit laisse un croissant vide contre la carrure : on y voit
          l'ombre de la montre, pas le fond nu. */}
      {!passesUnder && (
        <>
          <rect x={C - HALF - 5} width={HALF * 2 + 10} {...span(dir, 290, D_LOOP + 8)} fill={INK} fillOpacity="0.46" />
          <rect
            x={C - HALF - 5}
            width={HALF * 2 + 10}
            {...span(dir, 290, D_LOOP + 8)}
            fill={`url(#${uid}-strap-under-${half})`}
          />
        </>
      )}

      {/* Épaulements de la barrette, entre le brin et la corne. */}
      <rect x={C - HALF - 8} width={HALF * 2 + 16} {...span(dir, D_BAR - 7, D_BAR + 7)} fill={METALS[metal].dark} />

      <g clipPath={clip}>
        {kind === "acier-3-maillons" && <SteelBracelet {...props} pitch={80} columns={[0.29, 0.42, 0.29]} />}
        {kind === "acier-jubile" && (
          <SteelBracelet {...props} pitch={58} columns={[0.26, 0.16, 0.16, 0.16, 0.26]} />
        )}
        {kind === "cuir" && <Leather {...props} />}
        {kind === "cuir-glace" && <Leather {...props} glace />}
        {kind === "caoutchouc" && <Rubber {...props} />}
        {kind === "nato" && <Nato {...props} />}

        {/* Ombre des cornes sur le brin : plus large à gauche, d'où vient la lumière. */}
        <rect x={C - HALF} width="13" {...span(dir, D_UNDER_CASE, LUG_TIP)} fill={INK} fillOpacity="0.3" />
        <rect x={C + HALF - 6} width="6" {...span(dir, D_UNDER_CASE, LUG_TIP)} fill={INK} fillOpacity="0.18" />
      </g>

      {!isSteel && (
        <path
          d={outline(dir, passesUnder ? D_UNDER_CASE : D_LOOP, passesUnder ? 0 : 12)}
          fill="none"
          stroke={shade(color, 0.5)}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

/* ───────────────────────────────── Acier ───────────────────────────────── */

function SteelBracelet({
  uid,
  metal,
  detail,
  dir,
  half,
  pitch,
  columns,
}: BandProps & { pitch: number; columns: number[] }) {
  const ramp = METALS[metal];
  const jubilee = columns.length === 5;
  const gap = 4;
  const metalFill = `url(#${uid}-strap-steel)`;
  const brush = detail === "full" ? `url(#${uid}-strap-brush)` : null;

  // Bornes des colonnes, en fraction de la largeur.
  const edges = columns.reduce<number[]>((acc, w) => [...acc, (acc[acc.length - 1] ?? 0) + w], [0]);
  const edge = (i: number) => edges[i] ?? 1;
  const isCentre = (col: number) => col > 0 && col < columns.length - 1;
  // Les maillons centraux sont décalés d'un demi-pas : c'est ce quinconce qui
  // articule le bracelet.
  const dCentre = D_END_LINK + pitch / 2;

  const xAt = (d: number, fraction: number) => C - halfAt(d) + halfAt(d) * 2 * fraction;

  // Jubilé : les trois rangs centraux sont des grains courts et bombés, deux par
  // maillon de rive. C'est ce rythme serré de petits galets polis entre deux
  // rives brossées qui fait reconnaître le bracelet.
  const grain = pitch / 2;
  const link = (key: string, col: number, d0: number, length = pitch) => {
    const d1 = d0 + length - (jubilee ? 3 : gap);
    const mid = (d0 + d1) / 2;
    const x = xAt(mid, edge(col)) + 1.5;
    const width = xAt(mid, edge(col + 1)) - 1.5 - x;
    const polished = jubilee && isCentre(col);
    const box = { x: n(x), width: n(width), rx: polished ? 11 : jubilee ? 10 : 6, ...span(dir, d0, d1) };
    return (
      <g key={key}>
        <rect {...box} fill={polished ? ramp.mid : metalFill} />
        {brush && !polished && <rect {...box} fill={brush} />}
        <rect {...box} fill={`url(#${uid}-link-${polished ? "polished" : "round"})`} />
        {/* Grain poli : un éclat ponctuel en haut à gauche, comme sur une perle. */}
        {polished && detail === "full" && (
          <ellipse cx={n(x + width * 0.34)} cy={n(box.y + box.height * 0.3)} rx={n(width * 0.2)} ry="2.6" fill={PAPER} fillOpacity="0.85" />
        )}
        <rect {...box} fill="none" stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.2" />
      </g>
    );
  };

  const rows = Math.ceil((D_EDGE - D_END_LINK) / pitch) + 1;

  return (
    <g>
      {/* Le vide entre les maillons : on voit l'ombre de l'articulation. */}
      <rect x={C - HALF} width={HALF * 2} {...span(dir, D_UNDER_CASE, D_EDGE)} fill={shade(ramp.dark, 0.55)} />

      {Array.from({ length: rows }, (_, row) =>
        columns.map((_, col) =>
          jubilee && isCentre(col) ? (
            <Fragment key={`${row}-${col}`}>
              {link(`${row}-${col}-a`, col, dCentre + gap + row * pitch, grain)}
              {link(`${row}-${col}-b`, col, dCentre + grain + gap + row * pitch, grain)}
            </Fragment>
          ) : (
            link(`${row}-${col}`, col, (isCentre(col) ? dCentre : D_END_LINK) + gap + row * pitch)
          ),
        ),
      )}

      {/* Pièce de bout : pleine, ajustée à la courbe de la carrure, elle comble
          l'entrecorne. Sa partie centrale avance d'un demi-maillon. */}
      {columns.map((_, col) => {
        const dTip = isCentre(col) ? dCentre : D_END_LINK;
        const x = xAt(LUG_TIP, edge(col)) + (col === 0 ? 0 : 1);
        const width = xAt(LUG_TIP, edge(col + 1)) - (col === columns.length - 1 ? 0 : 1) - x;
        const box = { x: n(x), width: n(width), ...span(dir, D_UNDER_CASE, dTip) };
        const polished = jubilee && isCentre(col);
        return (
          <g key={col}>
            <rect {...box} fill={polished ? ramp.light : metalFill} />
            {brush && !polished && <rect {...box} fill={brush} />}
            <rect {...box} fill={`url(#${uid}-strap-endlink-${half})`} />
            <rect {...box} fill="none" stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="1.2" />
          </g>
        );
      })}

      {/* Flancs polis du bracelet. */}
      <line
        x1={C - HALF + 2.5}
        y1={y(dir, D_UNDER_CASE)}
        x2={C - HALF_AT_EDGE + 2.5}
        y2={y(dir, D_EDGE)}
        stroke={ramp.light}
        strokeOpacity="0.7"
        strokeWidth="2.5"
      />
    </g>
  );
}

/* ───────────────────────────────── Cuir ────────────────────────────────── */

/**
 * `glace` : veau glacé des habillées. Pas de grain visible, un rembordé net, une
 * surpiqûre fine ton sur ton, et surtout un long reflet de boîte à lumière qui
 * court sur le bombé du brin — c'est lui qui dit « brillant ».
 */
function Leather({ uid, color, detail, dir, half, glace = false }: BandProps & { glace?: boolean }) {
  const full = { x: C - HALF, width: HALF * 2, ...span(dir, D_LOOP, D_EDGE) };
  const dSeam = D_LOOP + 34;
  const inset = glace ? 13 : 17;
  const thread = glace ? tint(color, 0.2) : tint(color, 0.62);
  const point = glace ? "7 6" : "13 9";
  const fil = glace ? 1.8 : 3.2;

  const stitch = (side: -1 | 1, offset: number, stroke: string, width: number) => (
    <line
      x1={C + side * (HALF - inset) + offset}
      y1={y(dir, dSeam) + offset}
      x2={C + side * (HALF_AT_EDGE - inset) + offset}
      y2={y(dir, D_EDGE) + offset}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={point}
      strokeLinecap="round"
    />
  );

  return (
    <g>
      <rect {...full} fill={color} />
      {detail === "full" && !glace && <rect {...full} fill={color} filter={`url(#${uid}-strap-grain)`} />}
      <rect {...full} fill={`url(#${uid}-strap-dome)`} />
      {glace && (
        <>
          {/* Reflet de la boîte à lumière sur le bombé, à gauche de l'axe, et
              son rappel plus faible à droite. */}
          <path
            d={`M ${C - 96} ${y(dir, D_LOOP + 40)} L ${C - 58} ${y(dir, D_LOOP + 40)} L ${C - 54} ${y(dir, D_EDGE)} L ${C - 88} ${y(dir, D_EDGE)} Z`}
            fill={PAPER}
            fillOpacity="0.2"
            filter={detail === "full" ? `url(#${uid}-soft)` : undefined}
          />
          <path
            d={`M ${C - 84} ${y(dir, D_LOOP + 44)} L ${C - 72} ${y(dir, D_LOOP + 44)} L ${C - 68} ${y(dir, D_EDGE)} L ${C - 78} ${y(dir, D_EDGE)} Z`}
            fill={PAPER}
            fillOpacity={detail === "full" ? 0.16 : 0.3}
            filter={detail === "full" ? `url(#${uid}-pf-flou-brin)` : undefined}
          />
          <rect x={C + 92} width="10" {...span(dir, D_LOOP + 44, D_EDGE)} fill={PAPER} fillOpacity="0.08" />
          {/* Rembordé : le bord du brin est replié, il forme un bourrelet. */}
          {([-1, 1] as const).map((side) => (
            <line
              key={side}
              x1={C + side * (HALF - 6)}
              y1={y(dir, D_LOOP + 10)}
              x2={C + side * (HALF_AT_EDGE - 6)}
              y2={y(dir, D_EDGE)}
              stroke={side === -1 ? PAPER : INK}
              strokeOpacity={side === -1 ? 0.22 : 0.3}
              strokeWidth="3"
            />
          ))}
        </>
      )}

      {/* Le cuir roulé et collé autour de la barrette. */}
      <rect x={C - HALF} width={HALF * 2} {...span(dir, D_LOOP, dSeam)} fill={`url(#${uid}-strap-roll-${half})`} />

      {/* Couture : le fil s'enfonce dans le cuir, d'où l'ombre décalée. */}
      {detail === "full" && (
        <>
          <line
            x1={C - HALF + inset}
            y1={y(dir, dSeam) + 1.5}
            x2={C + HALF - inset}
            y2={y(dir, dSeam) + 1.5}
            stroke={shade(color, 0.55)}
            strokeWidth={fil + 1.8}
            strokeDasharray={point}
            strokeLinecap="round"
          />
          {stitch(-1, 1.5, shade(color, 0.55), fil + 1.8)}
          {stitch(1, 1.5, shade(color, 0.55), fil + 1.8)}
        </>
      )}
      <line
        x1={C - HALF + inset}
        y1={y(dir, dSeam)}
        x2={C + HALF - inset}
        y2={y(dir, dSeam)}
        stroke={thread}
        strokeWidth={fil}
        strokeDasharray={point}
        strokeLinecap="round"
      />
      {stitch(-1, 0, thread, fil)}
      {stitch(1, 0, thread, fil)}
    </g>
  );
}

/* ────────────────────────────── Caoutchouc ─────────────────────────────── */

function Rubber({ uid, color, detail, dir, half }: BandProps) {
  const full = { x: C - HALF, width: HALF * 2, ...span(dir, D_LOOP, D_EDGE) };
  // En plein détail le gaufrage occupe le départ du brin : les évents commencent après lui.
  const dFirst = detail === "full" ? D_LOOP + 140 : D_LOOP + 58;
  const pitch = detail === "full" ? 36 : 54;
  const count = Math.ceil((D_EDGE - dFirst) / pitch);

  return (
    <g>
      <rect {...full} fill={color} />
      <rect {...full} fill={`url(#${uid}-strap-dome)`} opacity="0.8" />
      <rect x={C - HALF} width={HALF * 2} {...span(dir, D_LOOP, D_LOOP + 40)} fill={`url(#${uid}-strap-roll-${half})`} opacity="0.7" />

      {/* Gorges longitudinales moulées, de part et d'autre du plat central. */}
      {([-1, 1] as const).map((side) => (
        <g key={side}>
          <line
            x1={C + side * 124}
            y1={y(dir, D_LOOP + 40)}
            x2={C + side * 114}
            y2={y(dir, D_EDGE)}
            stroke={shade(color, 0.5)}
            strokeWidth="5"
          />
          <line
            x1={C + side * 124 + 3.5}
            y1={y(dir, D_LOOP + 40)}
            x2={C + side * 114 + 3.5}
            y2={y(dir, D_EDGE)}
            stroke={tint(color, 0.22)}
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
        </g>
      ))}

      {/* Gaufrage : près du boîtier, le plat central est moulé en tablette, de
          petits pavés en relief séparés par des sillons. C'est le brin des
          plongeuses japonaises des années 70 : il laisse l'eau s'écouler et la
          peau respirer. Chaque pavé a son arête claire en haut à gauche. */}
      {detail === "full" &&
        Array.from({ length: 4 }, (_, rangee) =>
          Array.from({ length: 9 }, (_, colonne) => {
            const box = span(dir, D_LOOP + 50 + rangee * 19, D_LOOP + 50 + rangee * 19 + 14);
            const x = C - 85.5 + colonne * 19;
            return (
              <g key={`${rangee}-${colonne}`}>
                <rect x={x} y={box.y} width="15" height={box.height} rx="2" fill={shade(color, 0.42)} />
                <rect x={x + 1.4} y={box.y + 1.6} width="13" height={box.height - 2} rx="1.6" fill={tint(color, 0.07)} />
                <path d={`M ${x + 1.4} ${box.y + box.height - 1} V ${box.y + 1.6} H ${x + 14}`} fill="none" stroke={PAPER} strokeOpacity="0.2" strokeWidth="1" />
              </g>
            );
          }),
        )}

      {/* Évents en travers : une fente sombre, son arête basse accroche la lumière. */}
      {Array.from({ length: count }, (_, i) => {
        const box = span(dir, dFirst + i * pitch, dFirst + i * pitch + 13);
        return (
          <g key={i}>
            <rect x={C - 88} width="176" {...box} rx="6.5" fill={shade(color, 0.48)} />
            <rect x={C - 84} width="168" y={box.y + box.height - 1} height="2" rx="1" fill={tint(color, 0.3)} fillOpacity="0.55" />
          </g>
        );
      })}
    </g>
  );
}

/* ───────────────────────────────── NATO ────────────────────────────────── */

function Nato({ uid, color, detail, dir, half }: BandProps) {
  const full = { x: C - HALF, width: HALF * 2, ...span(dir, D_UNDER_CASE, D_EDGE) };
  const stripe = tint(color, 0.34);

  return (
    <g>
      <rect {...full} fill={color} />
      {([-1, 1] as const).map((side) => (
        <rect key={side} x={C + side * 40 - 19} width="38" {...span(dir, D_UNDER_CASE, D_EDGE)} fill={stripe} />
      ))}
      {detail === "full" && <rect {...full} fill={`url(#${uid}-strap-weave)`} />}
      <rect {...full} fill={`url(#${uid}-strap-dome)`} opacity="0.75" />

      {/* Le ruban franchit la barrette puis plonge sous le boîtier. */}
      <rect x={C - HALF} width={HALF * 2} {...span(dir, D_BAR - 22, D_BAR + 26)} fill={`url(#${uid}-strap-roll-${half})`} opacity="0.75" />
      <rect x={C - HALF} width={HALF * 2} {...span(dir, D_UNDER_CASE, D_BAR - 10)} fill={`url(#${uid}-strap-under-${half})`} />

      {/* Lisières thermosoudées. */}
      {([-1, 1] as const).map((side) => (
        <line
          key={side}
          x1={C + side * (HALF - 7)}
          y1={y(dir, D_UNDER_CASE)}
          x2={C + side * (HALF_AT_EDGE - 7)}
          y2={y(dir, D_EDGE)}
          stroke={shade(color, 0.4)}
          strokeOpacity="0.7"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}
