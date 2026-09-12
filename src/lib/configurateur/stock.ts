import { PART_INDEX } from "@/lib/data/catalogue";
import type { Part, StockState } from "./types";

/** Quantité réellement disponible : ce qui est en rayon moins ce qui est promis. */
export function availableQuantity(part: Part): number {
  return part.quantityOnHand - part.quantityReserved;
}

/**
 * État d'une pièce, du point de vue du client.
 *
 * « De retour bientôt » n'est pas une formule commerciale : c'est l'état d'une
 * référence dont il ne reste rien de libre. L'option devient alors non
 * sélectionnable, avec le délai de réapprovisionnement du fournisseur.
 */
export function resolveStockState(partRef: string | undefined): StockState {
  if (!partRef) return "disponible";
  const part = PART_INDEX.get(partRef);
  if (!part) return "disponible";

  const libre = availableQuantity(part);
  if (libre <= 0) return "bientot";
  if (libre <= 1) return "derniere-piece";
  return "disponible";
}

export function stockLabel(state: StockState): string {
  switch (state) {
    case "bientot":
      return "De retour bientôt";
    case "derniere-piece":
      return "Dernière pièce";
    default:
      return "En stock";
  }
}

/** Sous une pièce en rupture : le délai réel de réapprovisionnement. */
export function restockMessage(partRef: string | undefined): string | undefined {
  if (!partRef) return undefined;
  const part = PART_INDEX.get(partRef);
  if (!part || availableQuantity(part) > 0) return undefined;
  return `Réapprovisionnement annoncé sous ${part.restockDays} jours.`;
}
