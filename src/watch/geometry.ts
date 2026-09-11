/** Géométrie commune à toutes les vues. Repère 1000 × 1000, montre centrée. */

export const C = 500; // centre
export const R_CASE = 352; // flanc extérieur du boîtier
export const R_BEZEL_OUT = 341;
export const R_BEZEL_IN = 292;
export const R_DIAL = 289;
export const R_MINUTE_TRACK = 266;
export const R_INDEX_OUT = 257;
export const R_INDEX_IN = 221;
export const R_LUG_TIP = 470;

export const LUG_ANGLES = [27, -27, 153, -153] as const;

/** Échelle appliquée au groupe entier : un boîtier de 38 mm est un 40 réduit. */
export const SIZE_SCALE: Record<number, number> = {
  37: 0.915,
  38: 0.945,
  39: 0.972,
  40: 1,
};

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

export const DEFAULT_TIME = { hours: 10, minutes: 10, seconds: 32 };
