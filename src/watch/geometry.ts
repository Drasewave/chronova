/** Géométrie commune à toutes les vues. Repère 1000 × 1000, montre centrée. */

export const C = 500; // centre
export const R_CASE = 352; // flanc extérieur du boîtier
export const R_BEZEL_OUT = 341;
export const R_BEZEL_IN = 292;
export const R_DIAL = 289;
export const R_MINUTE_TRACK = 266;
export const R_INDEX_OUT = 257;
export const R_INDEX_IN = 221;
/** Pointe des cornes : 49,8 mm de corne à corne pour un boîtier de 40. */
export const R_LUG_TIP = 438;

/**
 * Cadrage des vues de face et de dos. La tête de montre n'occupe pas tout le
 * cadre : il faut voir la pièce de bout et les premiers maillons, comme sur une
 * photographie produit.
 */
export const FRAME_SCALE = 0.9;

/** Échelle appliquée au groupe entier : un boîtier de 38 mm est un 40 réduit. */
export const SIZE_SCALE: Record<number, number> = {
  37: 0.915,
  38: 0.945,
  39: 0.972,
  40: 1,
  41: 1.028,
};

/**
 * Part du diamètre laissée au cadran. Une lunette à insert est large : sur une
 * plongeuse japonaise le verre ne fait guère que les trois quarts de la lunette,
 * et c'est ce cadran resserré dans un large anneau gravé qui fait la silhouette.
 * Cadran, index, aiguilles et verre sont réduits d'un bloc autour du centre.
 */
export function dialScale(bezelStyle: string): number {
  if (bezelStyle === "plongee" || bezelStyle === "gmt") return 0.9;
  if (bezelStyle === "tachymetre") return 0.93;
  return 1;
}

/** Point sur un cercle centré, angle en degrés, 0° = midi, sens horaire. */
export function polar(radius: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: C + radius * Math.cos(rad), y: C + radius * Math.sin(rad) };
}

/** Arrondit pour éviter des chaînes SVG à quinze décimales. */
export function n(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Angles des aiguilles pour une heure donnée. */
export function handAngles(time: { hours: number; minutes: number; seconds: number }) {
  const { hours, minutes, seconds } = time;
  return {
    hour: ((hours % 12) + minutes / 60) * 30,
    minute: (minutes + seconds / 60) * 6,
    second: seconds * 6,
    /** Aiguille GMT : un tour en 24 h. */
    gmt: ((hours % 24) + minutes / 60) * 15,
  };
}

/**
 * Pose de catalogue : 10 h 10, et la trotteuse à 37 s. À 222°, elle tombe dans
 * le vide entre les index de 7 h et de 8 h : elle dégage les deux lignes de
 * texte du bas du cadran (153°–207°), le guichet jour-date, la lucarne du cœur
 * ouvert à 9 h et les petits chiffres 19/20 de l'échelle 24 h ; son contrepoids
 * reste entre l'aiguille des minutes et midi, loin du nom.
 */
export const DEFAULT_TIME = { hours: 10, minutes: 10, seconds: 37 };

/**
 * Dans la pose de catalogue, l'aiguille 24 h d'un GMT montre un second fuseau,
 * sept heures plus à l'est (17 h 10) : c'est l'usage des photographies de GMT,
 * et à l'heure locale elle barrerait la fin d'« AUTOMATIQUE ». À 257,5°, sa
 * flèche tombe entre les index de 8 h et de 9 h, sans en couvrir aucun.
 * Dans le navigateur, l'horloge vivante la ramène à l'heure locale du visiteur.
 */
export const POSE_GMT_OFFSET_DEG = 105;
