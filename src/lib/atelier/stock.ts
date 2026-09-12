import type { MovementType } from "@/generated/prisma/enums";

/**
 * Le journal des mouvements est la vérité ; les deux compteurs portés par la
 * pièce n'en sont que le cache.
 *
 * Convention de signe : `quantity` dit toujours l'effet sur ce qui reste
 * librement disponible. Une réservation est donc négative alors même que rien
 * n'a quitté le tiroir, et la sortie d'assemblage l'est aussi — mais elle
 * solde en même temps la réservation qui retenait la pièce, sans quoi celle-ci
 * serait comptée deux fois.
 *
 *   en rayon = entrées + sorties d'assemblage + pertes + ajustements
 *   réservé  = réservations libérées ni par une libération ni par un montage
 */
export interface MouvementStock {
  type: MovementType;
  quantity: number;
}

export interface EtatStock {
  /** Ce qui est physiquement dans les tiroirs. */
  enRayon: number;
  /** Ce qui y est encore, mais promis à une commande en cours. */
  reserve: number;
  /** Ce qu'on peut promettre à une nouvelle commande. */
  disponible: number;
}

export function recomposerStock(mouvements: readonly MouvementStock[]): EtatStock {
  let enRayon = 0;
  let reserve = 0;

  for (const mouvement of mouvements) {
    switch (mouvement.type) {
      case "ENTREE":
      case "PERTE":
      case "AJUSTEMENT":
        enRayon += mouvement.quantity;
        break;
      case "RESERVATION":
        reserve -= mouvement.quantity;
        break;
      case "LIBERATION":
        reserve -= mouvement.quantity;
        break;
      case "SORTIE_ASSEMBLAGE":
        // La pièce sort du tiroir et cesse d'être réservée : deux effets, un
        // seul mouvement, parce qu'ils sont indissociables sur l'établi.
        enRayon += mouvement.quantity;
        reserve += mouvement.quantity;
        break;
    }
  }

  return { enRayon, reserve, disponible: enRayon - reserve };
}

/* ────────────────────────── Vue d'atelier ────────────────────────── */

/**
 * État d'une référence du point de vue de l'horloger — plus fin que celui
 * montré au client, qui n'a pas à connaître le seuil d'alerte.
 */
export type EtatPiece = "rupture" | "a-commander" | "juste" | "ok";

export interface CompteursPiece {
  quantityOnHand: number;
  quantityReserved: number;
  reorderThreshold: number;
}

export function etatPiece(piece: CompteursPiece): EtatPiece {
  const libre = piece.quantityOnHand - piece.quantityReserved;
  if (libre <= 0) return "rupture";
  if (libre <= piece.reorderThreshold) return "a-commander";
  if (libre <= piece.reorderThreshold + 1) return "juste";
  return "ok";
}

export const LIBELLE_ETAT: Record<EtatPiece, string> = {
  rupture: "Rupture",
  "a-commander": "À commander",
  juste: "Juste",
  ok: "En rayon",
};

/**
 * Le ton d'une pastille d'état.
 *
 * Seul ce qui demande une action est coloré : peindre en vert les trente
 * références qui vont bien noierait les cinq qui manquent.
 */
export const TON_ETAT: Record<EtatPiece, "alerte" | "neutre"> = {
  rupture: "alerte",
  "a-commander": "alerte",
  juste: "neutre",
  ok: "neutre",
};

/** Catégories de pièces, dans l'ordre du montage. */
export const CATEGORIES_PIECES = [
  "BOITIER",
  "CADRAN",
  "AIGUILLES",
  "LUNETTE",
  "INSERT",
  "COURONNE",
  "BRACELET",
  "VERRE",
  "MOUVEMENT",
  "FOND",
  "DIVERS",
] as const;

export const LIBELLE_CATEGORIE: Record<(typeof CATEGORIES_PIECES)[number], string> = {
  BOITIER: "Boîtier",
  CADRAN: "Cadran",
  AIGUILLES: "Aiguilles",
  LUNETTE: "Lunette",
  INSERT: "Insert",
  COURONNE: "Couronne",
  BRACELET: "Bracelet",
  VERRE: "Verre",
  MOUVEMENT: "Mouvement",
  FOND: "Fond",
  DIVERS: "Divers",
};

/**
 * Ce qu'un mouvement change, colonne par colonne.
 *
 * Le journal affiche les deux effets séparément, sinon il ne s'additionne pas
 * à l'œil : une réservation puis la sortie d'assemblage correspondante portent
 * toutes deux « −1 » dans la convention de signe, alors qu'elles ne retirent
 * qu'une seule pièce du tiroir.
 */
export function effetMouvement(
  mouvement: MouvementStock,
): { rayon: number; libre: number } {
  const { enRayon, reserve } = recomposerStock([mouvement]);
  return { rayon: enRayon, libre: enRayon - reserve };
}

/** Ce qu'un mouvement raconte dans le journal, à la première personne de l'atelier. */
export const LIBELLE_MOUVEMENT: Record<MovementType, string> = {
  ENTREE: "Entrée",
  RESERVATION: "Réservation",
  LIBERATION: "Libération",
  SORTIE_ASSEMBLAGE: "Sortie d'assemblage",
  PERTE: "Perte",
  AJUSTEMENT: "Ajustement",
};

/**
 * Mouvements que l'horloger saisit à la main.
 *
 * Les réservations et les sorties d'assemblage n'y figurent pas : elles sont
 * écrites par les commandes, et les saisir à la main dédoublerait le compte.
 */
export const MOUVEMENTS_MANUELS = ["ENTREE", "PERTE", "AJUSTEMENT"] as const;
