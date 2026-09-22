import { INK, METALS } from "../palette";
import { C, n } from "../geometry";
import type { CaseFinish, MetalTone } from "../types";

/**
 * Carrure coussin : la silhouette des plongeuses japonaises des années 70.
 *
 * Le boîtier n'est plus un cylindre d'où sortent quatre cornes, mais un galet
 * large dont les flancs bombés descendent d'un seul geste jusqu'à des cornes
 * très courtes. La montre paraît plus grande à plat et plus courte au poignet :
 * 48 mm de corne à corne pour près de 44 mm de large.
 *
 * Tout est décrit dans un quadrant, en (écart latéral, écart vertical) par
 * rapport au centre, puis reporté par symétrie — jamais par `scale(-1)`, qui
 * retournerait aussi la lumière.
 */
export const LUG_INNER = 181; // même entrecorne que la carrure ronde : le bracelet ne change pas
export const D_NOTCH = 300; // fond de l'entrecorne
export const D_TIP = 424; // pointe des cornes, plus courte que sur la carrure ronde
export const X_TIP = 236; // largeur du plat de la pointe
/** Flanc bombé, de l'angle de la corne jusqu'à 3 h : une seule courbe de Bézier. */
export const FLANK: readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]] = [
  [272, 398],
  [322, 346],
  [392, 214],
  [392, 0],
];

/** Contour fermé du coussin ; `kx`/`ky` le rétrécissent autour du centre (plat intérieur). */
export function cushionOutline(kx = 1, ky = 1): string {
  const p = (sx: number, sy: number, x: number, d: number) => `${n(C + sx * x * kx)} ${n(C + sy * d * ky)}`;
  const [f0, f1, f2, f3] = FLANK;
  // Un demi-côté, de l'entrecorne vers 3 h ou 9 h, puis son retour symétrique.
  const aller = (sx: number, sy: number) =>
    [
      `L ${p(sx, sy, LUG_INNER, D_NOTCH)}`,
      `L ${p(sx, sy, LUG_INNER, D_TIP - 14)}`,
      `Q ${p(sx, sy, LUG_INNER, D_TIP)} ${p(sx, sy, LUG_INNER + 14, D_TIP)}`,
      `L ${p(sx, sy, X_TIP, D_TIP)}`,
      `Q ${p(sx, sy, f0[0] - 8, D_TIP)} ${p(sx, sy, f0[0], f0[1])}`,
      `C ${p(sx, sy, f1[0], f1[1])} ${p(sx, sy, f2[0], f2[1])} ${p(sx, sy, f3[0], f3[1])}`,
    ].join(" ");
  const retour = (sx: number, sy: number) =>
    [
      `C ${p(sx, sy, f2[0], f2[1])} ${p(sx, sy, f1[0], f1[1])} ${p(sx, sy, f0[0], f0[1])}`,
      `Q ${p(sx, sy, f0[0] - 8, D_TIP)} ${p(sx, sy, X_TIP, D_TIP)}`,
      `L ${p(sx, sy, LUG_INNER + 14, D_TIP)}`,
      `Q ${p(sx, sy, LUG_INNER, D_TIP)} ${p(sx, sy, LUG_INNER, D_TIP - 14)}`,
      `L ${p(sx, sy, LUG_INNER, D_NOTCH)}`,
    ].join(" ");
  return [`M ${p(-1, -1, LUG_INNER, D_NOTCH)}`, aller(1, -1), retour(1, 1), aller(-1, 1), retour(-1, -1), "Z"].join(" ");
}

/**
 * Distance du centre au flanc du coussin dans la direction d'une heure donnée
 * (angle horaire en degrés, 90° = 3 h, 120° = 4 h). Sert à poser la couronne :
 * le flanc n'est pas à la même distance à 3 h et à 4 h.
 */
export function cushionRadius(angleDeg: number): number {
  const a = (((angleDeg % 360) + 360) % 360) * (Math.PI / 180);
  // Repli dans le quadrant : seul compte le rapport écart vertical / écart latéral.
  const pente = Math.abs(Math.cos(a)) / Math.max(1e-6, Math.abs(Math.sin(a)));
  const [f0, f1, f2, f3] = FLANK;
  let meilleur = f3[0];
  let ecart = Infinity;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const u = 1 - t;
    const x = u * u * u * f0[0] + 3 * u * u * t * f1[0] + 3 * u * t * t * f2[0] + t * t * t * f3[0];
    const d = u * u * u * f0[1] + 3 * u * u * t * f1[1] + 3 * u * t * t * f2[1] + t * t * t * f3[1];
    const e = Math.abs(d / x - pente);
    if (e < ecart) {
      ecart = e;
      meilleur = Math.hypot(x, d);
    }
  }
  return meilleur;
}

/** Les éventails de reflets s'arrêtent à 470 : on les agrandit pour couvrir les cornes. */
const ETENDU = `translate(${C} ${C}) scale(1.14) translate(${-C} ${-C})`;

/**
 * Corps du coussin, de face comme de dos : un grand plat supérieur brossé en
 * rayons, ceinturé d'un large chanfrein poli qui suit le galbe du flanc. C'est
 * ce chanfrein qui dessine la silhouette ; sans lui le coussin paraît plat.
 */
export function CushionBody({
  uid,
  metal,
  finish,
  prefix = "",
}: {
  uid: string;
  metal: MetalTone;
  finish: CaseFinish;
  /** Distingue les identifiants de la vue de dos de ceux de la vue de face. */
  prefix?: string;
}) {
  const ramp = METALS[metal];
  const outer = cushionOutline();
  const inner = cushionOutline(0.958, 0.966);
  const mat = finish === "microbille";

  return (
    <g data-layer="carrure-coussin">
      <clipPath id={`${uid}-${prefix}clip-coussin`}>
        <path d={outer} />
      </clipPath>
      <clipPath id={`${uid}-${prefix}clip-coussin-plat`}>
        <path d={inner} />
      </clipPath>

      <path d={outer} fill={ramp.mid} />
      <g clipPath={`url(#${uid}-${prefix}clip-coussin)`}>
        {/* Chanfrein poli : tourné vers l'extérieur, il renvoie le studio de son côté. */}
        <use href={`#${uid}-conic-poli`} transform={ETENDU} opacity={mat ? 0.45 : 1} />
        <g clipPath={`url(#${uid}-${prefix}clip-coussin-plat)`}>
          <path d={inner} fill={ramp.mid} />
          <use href={`#${uid}-conic-case`} transform={ETENDU} />
          {mat && <path d={inner} fill={`url(#${uid}-beaded)`} />}
        </g>
        {/* Les cornes plongent vers le poignet : leurs pointes s'assombrissent. */}
        <path d={outer} fill={`url(#${uid}-lug-fall-haut)`} />
        <path d={outer} fill={`url(#${uid}-lug-fall-bas)`} />
        {/* Arête vive entre le plat et le chanfrein : sombre, doublée d'un filet clair. */}
        <path d={inner} fill="none" stroke={INK} strokeOpacity="0.38" strokeWidth="1.6" />
        <path d={inner} fill="none" stroke={ramp.hi} strokeOpacity={mat ? 0.2 : 0.55} strokeWidth="0.9" transform="translate(0.8 1)" />
      </g>
      {/* Flancs intérieurs des cornes, dans l'ombre du bracelet. */}
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sy) => (
          <line
            key={`${sx}${sy}`}
            x1={C + sx * (LUG_INNER + 2)}
            y1={C + sy * (D_NOTCH + 4)}
            x2={C + sx * (LUG_INNER + 2)}
            y2={C + sy * (D_TIP - 12)}
            stroke={INK}
            strokeOpacity="0.4"
            strokeWidth="4"
          />
        )),
      )}
      <path d={outer} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  );
}
