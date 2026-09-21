import { FRAME_SCALE, R_BEZEL_OUT, R_CASE, R_DIAL, R_INDEX_IN, R_INDEX_OUT, SIZE_SCALE, dialScale, n } from "@/watch/geometry";
import { flankLayout } from "@/watch/watch-svg";
import type { WatchRender } from "@/watch/types";

/**
 * Cadrages des gros plans, calculés depuis la géométrie de la montre montrée.
 *
 * Un recadrage écrit en dur vise un point du repère 1000 × 1000 ; or ce point
 * change avec le modèle : la tête de montre est réduite selon son diamètre
 * (`SIZE_SCALE`) et le cadrage produit (`FRAME_SCALE`), le cadran est resserré
 * sous une lunette à insert (`dialScale`), la couronne est à 3 h ou à 4 h, et le
 * flanc d'un coussin est plus loin du centre que celui d'une carrure ronde.
 * Ici chaque fenêtre est posée sur la pièce qu'elle annonce, quel que soit le
 * modèle.
 */
const CENTRE = 500;

/** Échelle du groupe entier, vue de face. */
function echelleTete(render: WatchRender): number {
  return (SIZE_SCALE[render.caseSize] ?? 1) * FRAME_SCALE;
}

/** Point du repère final : rayon mesuré dans le repère de la tête, angle horaire (0° = midi). */
function point(rayon: number, angleDeg: number, echelle: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTRE + rayon * echelle * Math.cos(rad), y: CENTRE + rayon * echelle * Math.sin(rad) };
}

/** Fenêtre carrée « x y largeur hauteur », centrée, bornée au cadre du dessin. */
function fenetre(centre: { x: number; y: number }, cote: number): string {
  const borne = (valeur: number) => Math.min(1000 - cote, Math.max(0, valeur - cote / 2));
  return `${n(borne(centre.x))} ${n(borne(centre.y))} ${n(cote)} ${n(cote)}`;
}

/** Deux index voisins, à 1 h et 2 h, avec le réhaut et le bord de la lunette ; le guichet de 3 h reste hors champ. */
export function cadrageIndex(render: WatchRender): string {
  const tete = echelleTete(render);
  const sousVerre = tete * dialScale(render.bezelStyle);
  return fenetre(point((R_INDEX_OUT + R_INDEX_IN) / 2 - 12, 38, sousVerre), 270 * tete);
}

/** L'arc de lunette autour de 11 h : l'insert, les crans, le réhaut, le bord du cadran. */
export function cadrageLunette(render: WatchRender): string {
  const tete = echelleTete(render);
  const bordCadran = R_DIAL * dialScale(render.bezelStyle);
  return fenetre(point((R_BEZEL_OUT + bordCadran) / 2 - 30, 338, tete), 300 * tete);
}

/** La couronne de remontage, là où elle est : à 3 h ou à 4 h, contre un flanc rond ou coussin. */
export function cadrageCouronne(render: WatchRender): string {
  const tete = echelleTete(render);
  const flanc = flankLayout(render);
  // La couronne dépasse le flanc d'une quarantaine d'unités : on vise en deçà du
  // flanc, pour garder dans le champ la lunette et laisser peu de fond vide.
  const rayon = R_CASE + flanc.offsetAt(flanc.crownAt) - 30;
  return fenetre(point(rayon, flanc.crownAt * 30, tete), 290 * tete);
}

/** Le cadran entier jusqu'au réhaut, pour la galerie d'une fiche. */
export function cadrageCadran(render: WatchRender): string {
  const rayon = R_DIAL * dialScale(render.bezelStyle) * echelleTete(render) * 1.03;
  return fenetre({ x: CENTRE, y: CENTRE }, 2 * rayon);
}
