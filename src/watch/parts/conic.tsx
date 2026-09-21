import { n } from "../geometry";

/**
 * Reflets angulaires.
 *
 * Un métal poli ne porte pas de couleur : il renvoie le studio. Autour d'une
 * pièce circulaire, ce studio se lit comme une suite de secteurs clairs et
 * sombres — ce qu'un dégradé linéaire ne sait pas faire et que SVG ne propose
 * pas nativement (pas de dégradé conique). On le construit donc en éventail :
 * un disque de secteurs fins, défini une fois dans `<defs>`, puis repris par
 * `<use>` sous un masque annulaire pour chaque bague (carrure, lunette,
 * réhaut, insert). Un seul éventail, autant de bagues qu'on veut.
 *
 * Angles : 0° = midi, sens horaire, comme `polar`.
 */

export type Sheen = "poli" | "brosse" | "mat" | "ceramique";

/** Boîtes à lumière du studio : direction, demi-largeur, intensité. */
const LIGHTS: ReadonlyArray<readonly [angle: number, width: number, power: number]> = [
  [318, 34, 1], // boîte principale, en haut à gauche
  [138, 20, 0.62], // bande de débouchage, en bas à droite
  [48, 9, 0.38], // liseré, en haut à droite
  [226, 12, 0.3], // rappel, en bas à gauche
];

function lobe(angle: number, centre: number, width: number): number {
  let d = Math.abs(((angle - centre) % 360) + 360) % 360;
  if (d > 180) d = 360 - d;
  return Math.exp(-((d / width) ** 2));
}

/**
 * Luminance reçue (0 à 1) par une facette dont la normale pointe vers `angle`.
 * Le poli durcit les transitions, le brossé les étale, le mat les écrase.
 */
export function studioLum(angle: number, sheen: Sheen = "poli"): number {
  const spread = sheen === "brosse" ? 1.7 : sheen === "mat" ? 2.6 : sheen === "ceramique" ? 0.8 : 1;
  let lum = 0;
  for (const [centre, width, power] of LIGHTS) lum += power * lobe(angle, centre, width * spread);
  lum = Math.min(1, lum);

  // Un poli n'est jamais noir sur de grandes plages : il voit aussi le plafond du studio.
  if (sheen === "poli") return 0.27 + 0.73 * smooth(lum, 0.1, 0.8);
  if (sheen === "brosse") return 0.34 + 0.5 * lum;
  if (sheen === "mat") return 0.42 + 0.2 * lum;
  return 0.06 + 0.8 * smooth(lum, 0.3, 0.95);
}

function smooth(x: number, a: number, b: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Bruit entier, identique sur le serveur et dans le navigateur. */
export function jitter(i: number): number {
  let h = Math.imul(i + 1, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return ((h >>> 0) % 1000) / 1000;
}

/** Éventail de `count` secteurs ; `colorAt` reçoit l'angle médian et l'indice. */
export function ConicDisk({
  id,
  count,
  radius = 470,
  colorAt,
}: {
  id: string;
  count: number;
  radius?: number;
  colorAt: (angle: number, index: number) => string;
}) {
  const step = 360 / count;
  // Léger recouvrement : sans lui l'anticrénelage laisse un filet entre secteurs.
  const over = step * 0.62;
  return (
    <g id={id}>
      {Array.from({ length: count }, (_, i) => {
        const mid = i * step;
        const a = point(radius, mid - over);
        const b = point(radius, mid + over);
        return <path key={i} d={`M 500 500 L ${a} L ${b} Z`} fill={colorAt(mid, i)} />;
      })}
    </g>
  );
}

function point(radius: number, angle: number): string {
  const rad = ((angle - 90) * Math.PI) / 180;
  return `${n(500 + radius * Math.cos(rad))} ${n(500 + radius * Math.sin(rad))}`;
}

/** Anneau entre deux rayons, à remplir en `evenodd`. */
export function annulus(rOut: number, rIn: number): string {
  const c = (r: number) => `M ${500 - r} 500 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  return `${c(rOut)} ${c(rIn)}`;
}

/** Une bague : l'éventail `disk` vu à travers un anneau. */
export function Ring({
  id,
  disk,
  rOut,
  rIn,
  rotate = 0,
  opacity,
}: {
  /** Identifiant unique du masque. */
  id: string;
  /** Identifiant de l'éventail à reprendre. */
  disk: string;
  rOut: number;
  rIn: number;
  /** Une pente tournée vers l'intérieur reflète le côté opposé : 180°. */
  rotate?: number;
  opacity?: number;
}) {
  return (
    <>
      <clipPath id={id}>
        <path d={annulus(rOut, rIn)} clipRule="evenodd" />
      </clipPath>
      <g clipPath={`url(#${id})`} opacity={opacity}>
        <use href={`#${disk}`} transform={rotate ? `rotate(${rotate} 500 500)` : undefined} />
      </g>
    </>
  );
}
