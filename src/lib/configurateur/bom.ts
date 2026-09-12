import type { Catalogue } from "./catalogue";
import type { Part, Selections } from "./types";

export interface BomLine {
  part: Part;
  quantity: number;
  unitCostCents: number;
  /** Le choix client à l'origine de cette pièce, pour la fiche de commande. */
  becauseOf: string;
}

/**
 * Nomenclature : configuration → liste des pièces à sortir du stock.
 *
 * Une seule fonction, utilisée par le configurateur (calcul de marge), par le
 * paiement (réservation du stock) et par le CRM (fiche d'assemblage). Il ne peut
 * donc pas y avoir deux nomenclatures divergentes pour la même montre.
 */
export function buildBom(catalogue: Catalogue, selections: Selections): BomLine[] {
  const lignes = new Map<string, BomLine>();

  for (const step of catalogue.steps) {
    for (const group of step.groups) {
      const valeur = selections[group.key];
      if (!valeur || group.selection === "texte") continue;

      const option = catalogue.optionIndex.get(`${group.key}:${valeur}`)?.option;
      const part = option?.partRef ? catalogue.partIndex.get(option.partRef) : undefined;
      if (!option || !part) continue;

      const existante = lignes.get(part.ref);
      if (existante) {
        existante.quantity += 1;
      } else {
        lignes.set(part.ref, {
          part,
          quantity: 1,
          unitCostCents: part.purchasePriceCents,
          becauseOf: `${group.label} · ${option.label}`,
        });
      }
    }
  }

  return [...lignes.values()];
}

/** Coût d'achat des pièces. La marge est le prix de vente moins ce montant. */
export function partsCost(lignes: BomLine[]): number {
  return lignes.reduce((somme, ligne) => somme + ligne.unitCostCents * ligne.quantity, 0);
}
