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
