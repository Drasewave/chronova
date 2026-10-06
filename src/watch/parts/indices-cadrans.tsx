import { LUME_EDGE, LUME_FILL, METALS, isLight, rampAt, shade, tint, type MetalRamp } from "../palette";
import { C, n, polar } from "../geometry";
import type { MetalTone } from "../types";
import { studioLum } from "./conic";
import { ARABES_ORIENTAUX, CHIFFRES_MANUSCRITS, PHRASE_QUI, PHRASE_TARD, type JeuDeChiffres, type Ligne } from "./glyphes";

/**
 * Les six styles de cadran venus de la planche de référence : chiffres romains
 * appliqués, romains laqués sous minuterie chiffrée, chiffres arabes orientaux
 * (avec ou sans minuterie chiffrée), disque des vingt-quatre heures, et heures
 * écrites à la main. Chacun dessine ses index ET ce qui s'imprime avec eux
 * (disque central, phrase manuscrite) ; la minuterie chiffrée du pourtour, elle,
 * est du ressort du cadran (`dial.tsx`).
 */

const RAD = Math.PI / 180;

/** Une facette polie inclinée : jamais tout à fait noire, elle voit aussi le plafond. */
export function facet(ramp: MetalRamp, normal: number): string {
  return rampAt(ramp, 0.24 + 0.76 * studioLum(normal, "poli"));
}

/** Cette heure est-elle prise par autre chose que son index ? */
function omis(skip: number | number[] | undefined, hour: number): boolean {
  return Array.isArray(skip) ? skip.includes(hour) : skip === hour;
}

/** Un vecteur d'écran (la lumière vient du haut-gauche) ramené dans le repère tourné d'un index. */
function dansRepere(x: number, y: number, angle: number): [number, number] {
  const a = -angle * RAD;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

export interface CommunProps {
  metal: MetalTone;
  dialColor: string;
  lume: boolean;
  /** Positions horaires occupées (guichet de date, compteurs, lucarne du cœur ouvert). */
  skipHour?: number | number[];
  detail: "full" | "compact";
}

/* ------------------------------------------------------------------ */
/* Chiffres romains en traits                                          */
/* ------------------------------------------------------------------ */

interface Trait {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
}

/**
 * Traits d'un chiffre romain, dans son repère propre : centré sur l'origine, le
 * haut du chiffre vers le haut. I = un bâton ; V et X = un plein et un délié,
 * comme sur une capitale romaine. Une fois placé sur le cadran, le chiffre est
 * tourné de l'angle de son heure : sa tête regarde le bord, son pied le centre.
 */
function chiffreRomain(texte: string, hauteur: number, graisse: number): Trait[] {
  const h = hauteur / 2;
  const ecart = graisse * 0.9;
  const large = hauteur * 0.78;
  const traits: Trait[] = [];
  let x = 0;
  for (const lettre of texte) {
    if (lettre === "I") {
      traits.push({ x1: x + graisse / 2, y1: -h, x2: x + graisse / 2, y2: h, w: graisse });
      x += graisse + ecart;
    } else if (lettre === "V") {
      traits.push({ x1: x + graisse * 0.5, y1: -h, x2: x + large / 2, y2: h, w: graisse * 1.15 });
      traits.push({ x1: x + large - graisse * 0.3, y1: -h, x2: x + large / 2, y2: h, w: graisse * 0.62 });
      x += large + ecart;
    } else if (lettre === "X") {
      traits.push({ x1: x + graisse * 0.5, y1: -h, x2: x + large - graisse * 0.5, y2: h, w: graisse * 1.15 });
      traits.push({ x1: x + large - graisse * 0.3, y1: -h, x2: x + graisse * 0.3, y2: h, w: graisse * 0.62 });
      x += large + ecart;
    }
  }
  const total = x - ecart;
  return traits.map((t) => ({ ...t, x1: t.x1 - total / 2, x2: t.x2 - total / 2 }));
}

function Lignes({
  traits,
  largeur,
  stroke,
  opacity = 1,
  dx = 0,
  dy = 0,
}: {
  traits: Trait[];
  largeur: (w: number) => number;
  stroke: string;
  opacity?: number;
  dx?: number;
  dy?: number;
}) {
  return (
    <g stroke={stroke} strokeOpacity={opacity} transform={dx || dy ? `translate(${n(dx)} ${n(dy)})` : undefined}>
      {traits.map((t, i) => (
        <line key={i} x1={n(t.x1)} y1={n(t.y1)} x2={n(t.x2)} y2={n(t.y2)} strokeWidth={n(largeur(t.w))} />
      ))}
    </g>
  );
}

/** Chiffre appliqué : une tranche sombre sous le dessus poli, et un filet d'éclat. */
function TraitsAppliques({ traits, ramp, angle, relief }: { traits: Trait[]; ramp: MetalRamp; angle: number; relief: boolean }) {
  const [tx, ty] = dansRepere(1.5, 2.1, angle);
  const [hx, hy] = dansRepere(-0.7, -1, angle);
  return (
    <>
      <Lignes traits={traits} largeur={(w) => w} stroke={ramp.edge} opacity={0.95} dx={tx} dy={ty} />
      <Lignes traits={traits} largeur={(w) => w} stroke={facet(ramp, angle - 50)} />
      {relief && <Lignes traits={traits} largeur={(w) => Math.max(1, w * 0.26)} stroke={ramp.hi} opacity={0.85} dx={hx} dy={hy} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cadres biseautés (luminova, plots)                                  */
/* ------------------------------------------------------------------ */

/**
 * Cadre de métal biseauté sur quatre côtés, dans le repère tourné de l'index :
 * (x0, y0)–(x1, y1) est le rectangle extérieur. Le remplissage est du luminova
 * si la montre en porte, sinon un dessus poli.
 */
function CadreBiseaute({
  x0,
  y0,
  x1,
  y1,
  angle,
  ramp,
  lume,
  b = 3.6,
}: {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  angle: number;
  ramp: MetalRamp;
  lume: boolean;
  b?: number;
}) {
  return (
    <g>
      <path d={`M ${x0} ${y0} L ${x0 + b} ${y0 + b} L ${x0 + b} ${y1 - b} L ${x0} ${y1} Z`} fill={facet(ramp, angle - 90)} />
      <path d={`M ${x1} ${y0} L ${x1 - b} ${y0 + b} L ${x1 - b} ${y1 - b} L ${x1} ${y1} Z`} fill={facet(ramp, angle + 90)} />
      <path d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1 - b} ${y0 + b} L ${x0 + b} ${y0 + b} Z`} fill={facet(ramp, angle)} />
      <path d={`M ${x0} ${y1} L ${x1} ${y1} L ${x1 - b} ${y1 - b} L ${x0 + b} ${y1 - b} Z`} fill={facet(ramp, angle + 180)} />
      <rect
        x={x0 + b}
        y={y0 + b}
        width={x1 - x0 - b * 2}
        height={y1 - y0 - b * 2}
        fill={lume ? LUME_FILL : rampAt(ramp, 0.72)}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeOpacity="0.7"
        strokeWidth="0.8"
      />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="0.9" />
    </g>
  );
}

/**
 * Triangle de midi, dans le repère de l'index (le haut vers le bord) : la base
 * vers l'extérieur, la pointe vers le centre. Un biseau de métal sur les trois
 * côtés, le luminova au cœur.
 */
function TriangleLume({ ramp, lume, base, pointe, demi }: { ramp: MetalRamp; lume: boolean; base: number; pointe: number; demi: number }) {
  const k = 0.64;
  const cy = -(2 * base + pointe) / 3;
  const dedans = (x: number, y: number) => `${n(x * k)} ${n(cy + (y - cy) * k)}`;
  const a = `${-demi} ${-base}`;
  const b = `${demi} ${-base}`;
  const p = `0 ${-pointe}`;
  return (
    <g>
      <path d={`M ${a} L ${b} L ${p} Z`} fill={facet(ramp, 0)} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1" strokeLinejoin="round" />
      <path d={`M ${a} L ${p} L ${dedans(0, -pointe)} L ${dedans(-demi, -base)} Z`} fill={facet(ramp, 280)} />
      <path d={`M ${b} L ${p} L ${dedans(0, -pointe)} L ${dedans(demi, -base)} Z`} fill={facet(ramp, 80)} />
      <path
        d={`M ${dedans(-demi, -base)} L ${dedans(demi, -base)} L ${dedans(0, -pointe)} Z`}
        fill={lume ? LUME_FILL : rampAt(ramp, 0.74)}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeOpacity="0.7"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Bâtons fins « Diary »                                               */
/* ------------------------------------------------------------------ */

/**
 * Bâtons étroits à cadre de métal, double bâton à midi, minuterie fine : le
 * cadran « sunburst strips ». Même fabrication que le bâton appliqué ordinaire,
 * en plus long et plus fin.
 */
export function Diary({ metal, lume, skipHour, detail }: CommunProps) {
  const ramp = METALS[metal];
  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (omis(skipHour, hour)) return null;
        const angle = i * 30;
        const long = 60;
        const demi = i === 0 ? 8 : 11;
        const decalages = i === 0 ? [-11, 11] : [0];
        return (
          <g key={i} transform={`translate(${C} ${C}) rotate(${angle})`}>
            {decalages.map((dx) => (
              <g key={dx} transform={`translate(${dx} 0)`}>
                <CadreBiseaute x0={-demi} y0={-242} x1={demi} y1={-242 + long} angle={angle} ramp={ramp} lume={lume} b={detail === "full" ? 3.4 : 3} />
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Romains appliqués                                                   */
/* ------------------------------------------------------------------ */

const ROMAINS_PAIRS: Record<number, string> = { 0: "XII", 2: "II", 4: "IIII", 6: "VI", 8: "VIII", 10: "X" };

/**
 * Chiffres romains en métal aux heures paires, bâtons fins aux heures impaires :
 * le cadran des plongeuses « cathédrale » habillées. Rien n'est luminescent — on
 * lit ce cadran au reflet, comme celui des montres de montagne.
 */
export function Romains({ metal, skipHour, detail }: CommunProps) {
  const ramp = METALS[metal];
  const relief = detail === "full";
  const rayon = 224;
  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (omis(skipHour, hour)) return null;
        const angle = i * 30;
        const p = polar(rayon, angle);
        const traits = i % 2 === 0 ? chiffreRomain(ROMAINS_PAIRS[i] ?? "", 64, 9.6) : [{ x1: 0, y1: -28, x2: 0, y2: 28, w: 10 }];
        return (
          <g key={i} transform={`translate(${n(p.x)} ${n(p.y)}) rotate(${angle})`}>
            <TraitsAppliques traits={traits} ramp={ramp} angle={angle} relief={relief} />
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Romains laqués, minuterie chiffrée                                  */
/* ------------------------------------------------------------------ */

const ROMAINS_TOUS: Record<number, string> = { 1: "I", 2: "II", 4: "IIII", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 10: "X", 11: "XI" };
export const ENCRE_ROMAINS = "#17683F";

/**
 * Onze chiffres romains laqués (un contour sombre, un cœur de couleur), un
 * triangle luminescent à midi, un plot rectangulaire à 9 h : la disposition des
 * cadrans « Datejust » vert et blancs. L'encre est celle du catalogue.
 */
export function RomainsChapitre({ metal, lume, skipHour, detail, ink }: CommunProps & { ink?: string }) {
  const ramp = METALS[metal];
  const relief = detail === "full";
  const encre = ink ?? ENCRE_ROMAINS;
  const contour = shade(encre, 0.62);
  const eclat = tint(encre, 0.4);
  const rayon = 218;
  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (omis(skipHour, hour)) return null;
        const angle = i * 30;
        if (i === 0) {
          return (
            <g key={i} transform={`translate(${C} ${C})`}>
              <TriangleLume ramp={ramp} lume={lume} base={258} pointe={198} demi={34} />
            </g>
          );
        }
        if (i === 9) {
          return (
            <g key={i} transform={`translate(${C} ${C}) rotate(${angle})`}>
              <CadreBiseaute x0={-12} y0={-262} x1={12} y1={-190} angle={angle} ramp={ramp} lume={lume} b={3.4} />
            </g>
          );
        }
        const traits = chiffreRomain(ROMAINS_TOUS[i] ?? "", 70, 12.5);
        const p = polar(rayon, angle);
        return (
          <g key={i} transform={`translate(${n(p.x)} ${n(p.y)}) rotate(${angle})`}>
            <Lignes traits={traits} largeur={(w) => w + 3.2} stroke={contour} />
            <Lignes traits={traits} largeur={(w) => w} stroke={encre} />
            {relief && <Lignes traits={traits} largeur={(w) => Math.max(1, w * 0.22)} stroke={eclat} opacity={0.5} dx={-0.8} dy={-1} />}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Chiffres arabes orientaux et heures manuscrites                     */
/* ------------------------------------------------------------------ */

interface NombreProps {
  jeu: JeuDeChiffres;
  chiffres: string;
  x: number;
  y: number;
  /** Corps, en unités du repère 1000 × 1000 : la hauteur d'un em. */
  taille: number;
  /** Rotation du nombre autour de son centre d'encre, en degrés. */
  rotation?: number;
  fill: string;
  /** Tranche d'un chiffre appliqué : copie décalée, plus sombre. Absent : chiffre imprimé, à plat. */
  tranche?: string;
  filet?: string;
  /** Liseré sombre autour du chiffre appliqué : il le détache d'un cadran clair. */
  contour?: string;
  /** Épaississement du tracé, en unités du repère : les chiffres de la photo sont plus gras que la police. */
  gras?: number;
}

/** Un nombre à un ou deux chiffres, posé sur son centre d'encre, en tracés vectoriels figés. */
function Nombre({ jeu, chiffres, x, y, taille, rotation = 0, fill, tranche, filet, contour, gras = 0 }: NombreProps) {
  const s = taille / jeu.upm;
  const echelle = Math.round(s * 10000) / 10000;
  const glyphes: { d: string; dx: number }[] = [];
  let curseur = 0;
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  for (const chiffre of chiffres) {
    const g = jeu.digits[chiffre];
    if (!g) continue;
    glyphes.push({ d: g.d, dx: curseur });
    xmin = Math.min(xmin, curseur + g.box[0]);
    xmax = Math.max(xmax, curseur + g.box[2]);
    ymin = Math.min(ymin, g.box[1]);
    ymax = Math.max(ymax, g.box[3]);
    curseur += g.adv;
  }
  if (glyphes.length === 0) return null;
  const cx = (xmin + xmax) / 2;
  const cy = (ymin + ymax) / 2;
  const placer = (dx: number, dy: number) => `translate(${n(x + dx)} ${n(y + dy)}) rotate(${rotation}) scale(${echelle}) translate(${n(-cx)} ${n(-cy)})`;
  const chemins = glyphes.map((g, i) => <path key={i} d={g.d} transform={`translate(${n(g.dx)} 0)`} />);
  return (
    <>
      {tranche && (
        <g transform={placer(2.2, 3)} fill={tranche} fillOpacity="0.95" stroke={tranche} strokeWidth={n((1.2 + gras) / s)}>
          {chemins}
        </g>
      )}
      <g transform={placer(0, 0)} fill={fill} stroke={gras ? fill : contour} strokeOpacity={gras ? 1 : 0.75} strokeWidth={gras ? n(gras / s) : contour ? n(1.4 / s) : undefined} strokeLinejoin="round">
        {chemins}
      </g>
      {filet && (
        <g transform={placer(-0.6, -0.8)} fill="none" stroke={filet} strokeOpacity="0.85" strokeWidth={n(0.9 / s)}>
          {chemins}
        </g>
      )}
    </>
  );
}

function ArabesOrientauxGenerique({ metal, skipHour, detail, taille, rayon }: CommunProps & { taille: number; rayon: number }) {
  const ramp = METALS[metal];
  const relief = detail === "full";
  return (
    <g data-layer="index">
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        if (omis(skipHour, hour)) return null;
        const p = polar(rayon, i * 30);
        return (
          <Nombre
            key={i}
            jeu={ARABES_ORIENTAUX}
            chiffres={String(hour)}
            x={p.x}
            y={p.y}
            taille={taille}
            fill={rampAt(ramp, 0.66)}
            tranche={ramp.edge}
            contour={ramp.dark}
            gras={4}
            filet={relief ? ramp.hi : undefined}
          />
        );
      })}
    </g>
  );
}

/** Chiffres arabes orientaux appliqués, sur un cadran dégagé. */
export function ArabesOrientaux(props: CommunProps) {
  return <ArabesOrientauxGenerique {...props} taille={86} rayon={230} />;
}

/** Les mêmes, rentrés pour laisser la place à la minuterie chiffrée. */
export function ArabesChapitre(props: CommunProps) {
  return <ArabesOrientauxGenerique {...props} taille={92} rayon={208} />;
}

/* ------------------------------------------------------------------ */
/* Disque des vingt-quatre heures                                      */
/* ------------------------------------------------------------------ */

/** Longueur radiale du bâton de chaque heure : les plus bas se raccourcissent devant le disque. */
const LONGUEURS_SKY = [92, 82, 76, 76, 68, 48, 30, 48, 68, 76, 76, 82];
const HEURES_SKY = ["22", "24", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20"];
const R_SKY_EXT = 168;
const R_SKY_INT = 124;

/**
 * Disque central des vingt-quatre heures, cerné de douze rectangles de métal à
 * luminova, d'un triangle de repère au-dessus, et d'un petit carré lumineux à
 * chaque heure sur le réhaut. Le disque est imprimé, il ne tourne pas : un jeu de
 * chiffres pairs de 2 à 24 et un point entre chacun.
 */
export function Sky({ metal, dialColor, lume, skipHour, detail }: CommunProps) {
  const ramp = METALS[metal];
  const clair = isLight(dialColor);
  const imprime = clair ? shade(dialColor, 0.78) : tint(dialColor, 0.82);
  const full = detail === "full";
  const rayonChiffre = (R_SKY_EXT + R_SKY_INT) / 2;
  return (
    <g data-layer="index">
      <g data-layer="disque-24h">
        <circle cx={C} cy={C} r={R_SKY_EXT} fill="#FFFFFF" fillOpacity={clair ? 0.28 : 0.06} />
        <circle cx={C} cy={C} r={R_SKY_EXT} fill="none" stroke={imprime} strokeOpacity="0.45" strokeWidth="1.4" />
        <circle cx={C} cy={C} r={R_SKY_INT} fill="none" stroke={imprime} strokeOpacity="0.4" strokeWidth="1.2" />
        {HEURES_SKY.map((texte, i) => {
          const angle = i * 30;
          const p = polar(rayonChiffre, angle);
          const point = polar(rayonChiffre, angle + 15);
          return (
            <g key={texte}>
              <text
                x={n(p.x)}
                y={n(p.y)}
                dy="7.4"
                textAnchor="middle"
                fill={imprime}
                transform={`rotate(${angle} ${n(p.x)} ${n(p.y)})`}
                style={{ fontFamily: "var(--font-ui)", fontSize: 25, fontWeight: 700 }}
              >
                {texte}
              </text>
              <circle cx={n(point.x)} cy={n(point.y)} r="3.4" fill={imprime} />
            </g>
          );
        })}
      </g>
      {/* Repère de mois : un triangle blanc cerné de rouge, pointe vers le disque. */}
      <path
        d={`M ${C - 16} ${C - 198} L ${C + 16} ${C - 198} L ${C} ${C - 176} Z`}
        fill={clair ? "#FFFFFF" : "#F4F1EA"}
        stroke="#C93A2E"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        const angle = i * 30;
        const carre = polar(268, angle);
        const repere = (
          <g key={`c${i}`} transform={`translate(${n(carre.x)} ${n(carre.y)}) rotate(${angle})`}>
            <rect x="-6" y="-6" width="12" height="12" fill={lume ? LUME_FILL : rampAt(ramp, 0.74)} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="0.9" />
          </g>
        );
        if (omis(skipHour, hour)) return repere;
        const longueur = LONGUEURS_SKY[i] ?? 50;
        const large = i === 0 ? 30 : 28;
        return (
          <g key={i}>
            <g transform={`translate(${C} ${C}) rotate(${angle})`}>
              <CadreBiseaute x0={-large / 2} y0={-258} x1={large / 2} y1={-258 + longueur} angle={angle} ramp={ramp} lume={lume} b={full ? 4 : 3} />
            </g>
            {repere}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Heures manuscrites                                                  */
/* ------------------------------------------------------------------ */

/**
 * Où chaque heure est tombée : abscisse et ordonnée depuis le centre, corps, et
 * un léger roulis, comme un cadran dont on aurait noté les heures de mémoire.
 * Le douze est à droite du onze, le trois au-dessus du neuf : le désordre est le propos.
 */
const HEURES_MANUSCRITES: ReadonlyArray<{ t: string; x: number; y: number; corps: number; roulis: number }> = [
  { t: "1", x: -181, y: 131, corps: 74, roulis: -6 },
  { t: "6", x: -122, y: 90, corps: 74, roulis: 4 },
  { t: "10", x: -110, y: 168, corps: 70, roulis: -3 },
  { t: "4", x: -37, y: 115, corps: 66, roulis: 10 },
  { t: "2", x: -31, y: 191, corps: 74, roulis: -4 },
  { t: "11", x: 21, y: 69, corps: 70, roulis: 0 },
  { t: "8", x: 35, y: 135, corps: 70, roulis: 3 },
  { t: "5", x: 46, y: 196, corps: 74, roulis: 2 },
  { t: "12", x: 118, y: 135, corps: 72, roulis: -8 },
  { t: "3", x: 108, y: 12, corps: 78, roulis: 4 },
  { t: "9", x: 160, y: 50, corps: 66, roulis: 12 },
  { t: "7", x: 218, y: 65, corps: 72, roulis: -2 },
];

/** Une ligne de texte manuscrit, calée à gauche sur `x`, ligne de base à `y`, largeur finale `largeur`. */
function LigneManuscrite({ ligne, x, y, largeur, fill }: { ligne: Ligne; x: number; y: number; largeur: number; fill: string }) {
  const s = largeur / (ligne.box[2] - ligne.box[0]);
  return <path d={ligne.d} fill={fill} transform={`translate(${n(x)} ${n(y)}) scale(${Math.round(s * 10000) / 10000}) translate(${n(-ligne.box[0])} 0)`} />;
}

/**
 * Cadran « Who cares » : une phrase écrite à la main sous midi, douze heures
 * jetées dans le désordre au bas du cadran. Rien n'est appliqué, tout est encre.
 */
export function Fantaisie({ dialColor }: CommunProps) {
  const encre = isLight(dialColor) ? "#1F2C8F" : tint(dialColor, 0.9);
  return (
    <g data-layer="index">
      <LigneManuscrite ligne={PHRASE_QUI} x={C - 174} y={C - 148} largeur={172} fill={encre} />
      <LigneManuscrite ligne={PHRASE_TARD} x={C - 183} y={C - 100} largeur={284} fill={encre} />
      {HEURES_MANUSCRITES.map((h) => (
        <Nombre key={h.t} jeu={CHIFFRES_MANUSCRITS} chiffres={h.t} x={C + h.x} y={C + h.y} taille={h.corps * 0.8} rotation={h.roulis} fill={encre} />
      ))}
    </g>
  );
}
