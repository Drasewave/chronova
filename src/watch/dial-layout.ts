import type { IndexStyle, Movement } from "./types";

/**
 * Ce qu'un style d'index change sur le cadran lui-même, au-delà des index : où
 * s'imprime le nom, quelle minuterie court sur le pourtour, si un disque central
 * prend la place du texte. Une seule fonction pour la vue de face et la vue
 * projetée : les deux dessinent le même cadran.
 */
export interface DialLayout {
  /** `nu` : cadran dégagé. `sky` : disque central des 24 h, qui chasse le texte du bas. */
  variant: "standard" | "nu" | "sky";
  /**
   * `courante` : gros traits sur le réhaut. `fine` : chemin de fer à deux rails et
   * soixante traits fins. `ticks` : les seuls soixante traits, sans rail. `chiffree` : minuterie de 5 à 60. `aucune` : rien.
   */
  minuterie: "courante" | "fine" | "ticks" | "chiffree" | "aucune";
  /**
   * `pro` : nom appliqué en métal, bloc de lignes sous le centre. `datejust` : nom
   * appliqué, deux lignes dessous, deux lignes en bas. `diary` : deux lignes sous le
   * centre, sans nom. `cursive` : nom appliqué et « Automatique » à la plume.
   * `sky` : tout dans le disque. `aucune` : rien d'imprimé.
   */
  signature: "complete" | "pro" | "datejust" | "diary" | "cursive" | "sky" | "aucune";
  /** Nom resserré et descendu d'un cran (cadran de terrain à échelle 13–24). */
  compactSignature: boolean;
  /** Grand guichet à cadre épais, du métal des index (cadrans appliqués). */
  cadreDate: boolean;
}

const STANDARD: DialLayout = {
  variant: "standard",
  minuterie: "courante",
  signature: "complete",
  compactSignature: false,
  cadreDate: false,
};

export function dialLayout(style: IndexStyle): DialLayout {
  switch (style) {
    case "terrain-24h":
      return { ...STANDARD, compactSignature: true };
    case "romains":
      return { ...STANDARD, minuterie: "fine", signature: "pro", cadreDate: true };
    case "romains-chapitre":
    case "arabes-chapitre":
      return { ...STANDARD, minuterie: "chiffree", signature: "datejust", cadreDate: true };
    case "arabes-orientaux":
      return { ...STANDARD, variant: "nu", minuterie: "aucune", signature: "cursive", cadreDate: true };
    case "sky":
      return { ...STANDARD, variant: "sky", minuterie: "fine", signature: "sky", cadreDate: true };
    case "diary":
      return { ...STANDARD, minuterie: "ticks", signature: "diary", cadreDate: true };
    case "fantaisie":
      return { ...STANDARD, variant: "nu", minuterie: "aucune", signature: "aucune" };
    default:
      return STANDARD;
  }
}

/**
 * Heures dont l'index cède la place à autre chose : le guichet de date à 3 h, les
 * deux compteurs du chronographe à 3 h et 9 h, la lucarne du cœur ouvert à 9 h.
 */
export function heuresPrises(movement: Movement, showDate: boolean): number[] | undefined {
  const prises = new Set<number>();
  if (showDate) prises.add(3);
  if (movement === "VK64") {
    prises.add(3);
    prises.add(9);
  }
  if (movement === "NH38") prises.add(9);
  return prises.size ? [...prises] : undefined;
}
