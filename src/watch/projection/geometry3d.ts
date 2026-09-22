import { C, R_BEZEL_OUT, n } from "../geometry";
import { studioLum, type Sheen } from "../parts/conic";

/**
 * Modèle en volume de la montre, pour la vue projetée.
 *
 * Repère : celui de la vue de face (1000 × 1000, centre `C`, 17,6 unités par
 * millimètre — un boîtier de 40 mm a 704 unités de diamètre), complété d'une
 * altitude `z` vers l'observateur de face. `z = 0` est le plan médian de la
 * carrure, celui de l'axe de la couronne. Les cotes viennent de
 * `parts/profile.tsx` (10 px par millimètre, mi-carrure à y ≈ 483), converties.
 *
 * Projection orthographique après un lacet `θ` autour de l'axe 12 h – 6 h :
 *
 *     x' = C + (x − C)·cos θ − z·sin θ        y' = y        profondeur = (x − C)·sin θ + z·cos θ
 *
 * θ = 0 : de face ; 90 : le flanc de 3 h nous fait face, le cadran regarde vers
 * la gauche ; 180 : le dos, la couronne à gauche ; 270 : le flanc de 9 h.
 */

export const PAR_MM = 17.6;

/** Altitudes, en unités du dessin. */
export const Z = {
  /** Dessus d'une lunette lisse ou cannelée. Une lunette à insert est plus haute. */
  lunette: 104,
  lunetteInsert: 111,
  /** Dessus du crantage d'une lunette à insert : l'insert est en pente au-dessus. */
  crantage: 90,
  /** Plan de joint lunette / carrure. */
  carrure: 58,
  /** Plan de joint carrure / fond. */
  fond: -51,
  fondBas: -104,
  fondBasSaphir: -99,
  couronne: 4,
  cadran: 76,
  index: 84,
  aiguilles: 94,
  /** Dessous du verre : le dessus de la lunette. */
  verrePlat: 12,
  verreBombe: 47,
  verreBoxMur: 30,
  verreBoxDome: 23,
  /** Les cornes plongent vers le poignet à partir de cette distance au centre. */
  corneCoude: 300,
  cornePente: 0.855,
  corneEpaisseur: 56,
  /** Dessus du brin, au niveau des barrettes. */
  bracelet: -20,
} as const;

/** Diamètre hors tout du fond vissé (voir `parts/back.tsx`). */
export const R_FOND = 326;
export const R_INSERT_OUT = R_BEZEL_OUT - 14;

export interface Pose {
  /** Lacet ramené dans [0, 360). */
  theta: number;
  s: number;
  c: number;
  /** Le cadran est visible (cos θ ≥ 0), sinon le fond. */
  front: boolean;
  /** Flanc qui regarde vers nous : +1 = côté 3 h, −1 = côté 9 h. */
  side: 1 | -1;
  /** Échelle horizontale des dessins à plat, jamais nulle ni négative. */
  cf: number;
}

export function pose(yaw: number): Pose {
  const theta = ((yaw % 360) + 360) % 360;
  const rad = (theta * Math.PI) / 180;
  let s = Math.sin(rad);
  let c = Math.cos(rad);
  if (Math.abs(s) < 1e-9) s = 0;
  if (Math.abs(c) < 1e-9) c = 0;
  // Une face vue exactement par la tranche n'a pas de largeur : une matrice
  // non inversible ne dessine rien et casse les dégradés. On garde un fil.
  return { theta, s, c, front: c >= 0, side: s >= 0 ? 1 : -1, cf: Math.max(Math.abs(c), 0.02) };
}

/** Abscisse projetée d'un point (x, z). */
export function px(p: Pose, x: number, z: number): number {
  return C + (x - C) * p.c - z * p.s;
}

/** Profondeur d'un point : positive vers l'observateur. */
export function depth(p: Pose, x: number, z: number): number {
  return (x - C) * p.s + z * p.c;
}

/**
 * Transformation d'un dessin à plat posé à l'altitude `z` : il se resserre en
 * `cos θ` autour de l'axe 12 h – 6 h et glisse latéralement de `z·sin θ`. Les
 * dessins symétriques (bracelet, cornes, fond) gardent leur lumière du
 * haut-gauche : de dos ils ne sont pas retournés, seulement resserrés.
 */
export function flat(p: Pose, z: number): string {
  return `translate(${n(C - z * p.s)} 0) scale(${n(p.cf)} 1) translate(${-C} 0)`;
}

/**
 * Même chose pour une corne : au-delà du coude (`Z.corneCoude`), le dessus plonge
 * de `Z.cornePente` par unité de distance. L'altitude dépend de `y`, la
 * projection devient un cisaillement — encore une matrice, pas un recalcul.
 */
export function lugTilt(p: Pose, sy: 1 | -1, zRoot: number): string {
  const k = Z.cornePente;
  // x' = cf·(x − C) − (zRoot − k·(sy·(y − C) − coude))·s + C
  const a = p.cf;
  const cc = sy * k * p.s;
  const e = C - a * C - zRoot * p.s - k * (Z.corneCoude + sy * C) * p.s;
  return `matrix(${n(a)} 0 ${n(cc)} 1 ${n(e)} 0)`;
}

/* ─────────────────────────────── Lumière ────────────────────────────────── */

/** Luminance d'une surface qui nous fait face, par finition : le plafond du studio. */
const FACING: Record<Sheen, number> = { poli: 0.62, brosse: 0.44, mat: 0.48, ceramique: 0.55 };

/**
 * Luminance reçue par une facette de normale (nx, ny, nz) dans le repère de
 * l'écran (x à droite, y en bas, z vers nous). La part de la normale dans le
 * plan de l'écran est éclairée comme de face (`studioLum`, mêmes boîtes à
 * lumière) ; la part qui nous regarde reçoit le plafond, un peu plus fort
 * quand la facette penche vers le haut. Une seule formule pour le flanc, la
 * couronne, la tranche du bracelet — et qui rejoint le rendu de face à θ = 0.
 */
export function lum3(nx: number, ny: number, nz: number, sheen: Sheen): number {
  const m = Math.hypot(nx, ny);
  const plan = m > 1e-6 ? studioLum((Math.atan2(nx, -ny) * 180) / Math.PI, sheen) : 0;
  const face = FACING[sheen] * (1 - 0.3 * ny);
  const t = Math.min(1, m);
  return t * plan + (1 - t) * (nz > 0 ? face : FACING[sheen] * 0.5);
}

/** Normale d'un flanc de cylindre debout, à l'azimut φ (0 = 3 h, sens horaire), tournée du lacet. */
export function flankNormal(p: Pose, phi: number): [number, number, number] {
  const cx = Math.cos(phi);
  return [cx * p.c, Math.sin(phi), cx * p.s];
}

/* ─────────────────────────────── Bandes ─────────────────────────────────── */

/**
 * Face visible d'un cylindre (ou d'un tronc de cône) coaxial à la montre,
 * entre deux altitudes : la moitié du pourtour qui regarde vers nous, balayée
 * du cercle du haut au cercle du bas. Chaque cercle devient une ellipse de
 * demi-axe horizontal `r·|cos θ|`, décalée de `−z·sin θ`. À θ = 90 les ellipses
 * sont des segments et la bande un rectangle de largeur (zTop − zBot).
 */
export function bandPath(p: Pose, rTop: number, zTop: number, rBot: number, zBot: number, side: 1 | -1 = p.side): string {
  const xt = C - zTop * p.s;
  const xb = C - zBot * p.s;
  const bulgeRight = side * (p.c < 0 ? -1 : 1) > 0;
  const rxT = rTop * Math.abs(p.c);
  const rxB = rBot * Math.abs(p.c);
  const sw1 = bulgeRight ? 1 : 0;
  const sw2 = bulgeRight ? 0 : 1;
  return `M ${n(xt)} ${n(C - rTop)} A ${n(rxT)} ${n(rTop)} 0 0 ${sw1} ${n(xt)} ${n(C + rTop)} L ${n(xb)} ${n(C + rBot)} A ${n(rxB)} ${n(rBot)} 0 0 ${sw2} ${n(xb)} ${n(C - rBot)} Z`;
}

/** Ellipse d'un cercle horizontal de rayon `r` à l'altitude `z`. */
export function ellipseAt(p: Pose, r: number, z: number): { cx: number; cy: number; rx: number; ry: number } {
  return { cx: n(C - z * p.s), cy: C, rx: n(Math.max(0.01, r * Math.abs(p.c))), ry: r };
}

/** Arc visible du pourtour à l'altitude `z` : `M … A …`, sans fermer. */
export function rimArc(p: Pose, r: number, z: number, side: 1 | -1 = p.side): string {
  const x = C - z * p.s;
  const bulgeRight = side * (p.c < 0 ? -1 : 1) > 0;
  return `M ${n(x)} ${n(C - r)} A ${n(r * Math.abs(p.c))} ${n(r)} 0 0 ${bulgeRight ? 1 : 0} ${n(x)} ${n(C + r)}`;
}

/** Portion du pourtour entre deux azimuts (radians, 0 = 3 h, sens horaire), à l'altitude `z`. */
export function rimSegment(p: Pose, r: number, z: number, phi0: number, phi1: number): string {
  const [x0, y0] = rimPoint(p, r, z, phi0);
  const [x1, y1] = rimPoint(p, r, z, phi1);
  return `M ${n(x0)} ${n(y0)} A ${n(Math.max(0.01, r * Math.abs(p.c)))} ${n(r)} 0 0 ${(phi1 > phi0 ? 1 : 0) ^ (p.c < 0 ? 1 : 0)} ${n(x1)} ${n(y1)}`;
}

/** Point du pourtour d'un cercle de rayon `r` à l'altitude `z`, à l'azimut φ (0 = 3 h). */
export function rimPoint(p: Pose, r: number, z: number, phi: number): [number, number] {
  return [px(p, C + r * Math.cos(phi), z), C + r * Math.sin(phi)];
}

/* ─────────────────────────────── Cylindres ──────────────────────────────── */

export interface Cyl {
  /** Axe, du pied à la tête, dans le repère de la montre (x, y, z). */
  from: [number, number, number];
  to: [number, number, number];
  r: number;
}

/**
 * Projection d'un cylindre quelconque (couronne, poussoir). Ses deux bouts sont
 * des cercles perpendiculaires à l'axe : à l'écran, deux ellipses identiques
 * dont le petit axe suit l'axe projeté (`r·|profondeur de l'axe|`) et le grand
 * axe vaut `r`. Le corps est donc un rectangle terminé par deux demi-ellipses.
 */
export function projectCyl(p: Pose, cyl: Cyl) {
  const [x0, y0, z0] = cyl.from;
  const [x1, y1, z1] = cyl.to;
  const ax = px(p, x1, z1) - px(p, x0, z0);
  const ay = y1 - y0;
  const len3 = Math.hypot(x1 - x0, y1 - y0, z1 - z0) || 1;
  const dz = ((x1 - x0) * p.s + (z1 - z0) * p.c) / len3;
  const length = Math.hypot(ax, ay);
  return {
    x: px(p, x0, z0),
    y: y0,
    angle: (Math.atan2(ay, ax) * 180) / Math.PI,
    length,
    /** Petit axe des bouts. */
    minor: Math.abs(dz) * cyl.r,
    /** La tête (bout `to`) nous regarde. */
    headVisible: dz > 0.02,
    footVisible: dz < -0.02,
    /** Profondeur du milieu de l'axe. */
    depth: depth(p, (x0 + x1) / 2, (z0 + z1) / 2),
  };
}

/** Corps d'un cylindre projeté, dans son repère local (pied à l'origine, axe vers +x). */
export function cylBodyPath(length: number, r: number, minor: number): string {
  const L = n(Math.max(0, length));
  const m = n(Math.max(0.01, minor));
  return `M 0 ${-r} L ${L} ${-r} A ${m} ${r} 0 0 1 ${L} ${r} L 0 ${r} A ${m} ${r} 0 0 1 0 ${-r} Z`;
}

/* ─────────────────────────────── Divers ─────────────────────────────────── */

export function smooth01(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function pts(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"} ${n(x)} ${n(y)}`).join(" ");
}

/**
 * Ruban : une arête projetée (`top`) balayée horizontalement de `dx` — le flanc
 * d'une pièce plate extrudée, vu de biais. `dx` = épaisseur × sin θ.
 */
export function ribbon(top: Array<[number, number]>, dx: number): string {
  const bottom = top.map(([x, y]): [number, number] => [x + dx, y]).reverse();
  return `${pts(top)} ${bottom.map(([x, y]) => `L ${n(x)} ${n(y)}`).join(" ")} Z`;
}

/** Enveloppe convexe (chaîne monotone) : le balayage d'une pièce convexe entre deux altitudes. */
export function hull(points: Array<[number, number]>): Array<[number, number]> {
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const q of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Array<[number, number]> = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const q = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Projection fidèle (retournée de dos) d'un dessin à plat asymétrique, posé à l'altitude `z`. */
export function flatSigned(p: Pose, z: number): string {
  const c = Math.abs(p.c) < 0.02 ? (p.c < 0 ? -0.02 : 0.02) : p.c;
  return `translate(${n(C - z * p.s)} 0) scale(${n(c)} 1) translate(${-C} 0)`;
}

/** Point d'une cubique de Bézier. */
export function bez3(a: [number, number], b: [number, number], c: [number, number], d: [number, number], t: number): [number, number] {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
  return [w[0] * a[0] + w[1] * b[0] + w[2] * c[0] + w[3] * d[0], w[0] * a[1] + w[1] * b[1] + w[2] * c[1] + w[3] * d[1]];
}

export function bez2(a: [number, number], b: [number, number], c: [number, number], t: number): [number, number] {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
}
