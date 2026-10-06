import { prisma } from "@/lib/db";
import { recomposerStock } from "@/lib/atelier/stock";
import type { Prisma } from "@/generated/prisma/client";
import type { MovementType } from "@/generated/prisma/enums";

/**
 * Mouvements de stock saisis à la main — le service, sans session.
 *
 * Appelé par l'atelier (action `enregistrerMouvement`). Pas un fichier
 * « use server » : ses exports ne sont pas des actions publiques.
 */

export const TYPES_MANUELS = ["ENTREE", "PERTE", "AJUSTEMENT"] as const;
export type TypeManuel = (typeof TYPES_MANUELS)[number];

export class ErreurMouvement extends Error {}

/**
 * Recalcule les deux compteurs d'une pièce depuis son journal. Personne n'incrémente un
 * compteur à la main : on réécrit ce que le journal raconte.
 */
export async function recalculer(partId: string, tx: Prisma.TransactionClient = prisma) {
  const mouvements = await tx.stockMovement.findMany({ where: { partId }, select: { type: true, quantity: true } });
  const etat = recomposerStock(mouvements);
  await tx.part.update({ where: { id: partId }, data: { quantityOnHand: etat.enRayon, quantityReserved: etat.reserve } });
  return etat;
}

/**
 * Réception, perte ou correction d'inventaire. Le signe est imposé par le type : une entrée
 * est toujours positive, une perte toujours négative ; seul l'ajustement accepte les deux.
 * Mouvement et compteurs dans la même transaction.
 */
export async function ajouterMouvement(entree: {
  reference: string;
  type: string;
  quantite: number;
  acteurId: string | null;
  motif?: string | null;
}): Promise<{ id: string }> {
  if (!TYPES_MANUELS.includes(entree.type as TypeManuel))
    throw new ErreurMouvement("Ce type de mouvement est écrit par les commandes, pas à la main.");
  const saisie = Math.trunc(entree.quantite);
  if (!Number.isFinite(saisie) || saisie === 0) throw new ErreurMouvement("La quantité doit être un nombre entier non nul.");

  const piece = await prisma.part.findUnique({ where: { reference: entree.reference }, select: { id: true } });
  if (!piece) throw new ErreurMouvement(`Aucune pièce de référence « ${entree.reference} ».`);

  const type = entree.type as MovementType;
  const quantite = type === "ENTREE" ? Math.abs(saisie) : type === "PERTE" ? -Math.abs(saisie) : saisie;
  const mouvement = await prisma.$transaction(async (tx) => {
    const m = await tx.stockMovement.create({
      data: {
        partId: piece.id,
        type,
        quantity: quantite,
        actorId: entree.acteurId,
        reason: entree.motif?.trim() || null,
      },
    });
    await recalculer(piece.id, tx);
    return m;
  });
  return { id: mouvement.id };
}
