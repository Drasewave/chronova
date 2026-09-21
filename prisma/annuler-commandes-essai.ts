/**
 * Annule des commandes d'ESSAI et rend leurs pièces au stock.
 *
 * L'application n'a pas (encore) d'annulation qui libère les réservations : une
 * commande d'essai passée pendant des tests garde donc ses pièces, et peut
 * mettre un modèle en rupture sur le site. Ce script corrige comme le veut le
 * journal de stock : il n'efface rien, il ajoute un mouvement LIBERATION en
 * face de chaque RESERVATION de la commande, ramène le compteur réservé, passe
 * la commande à ANNULEE et laisse une note interne.
 *
 * Garde-fous : seules les commandes du compte d'essai de l'atelier, non
 * expédiées, sont acceptées ; relancer le script ne fait rien de plus.
 *
 *   npx tsx prisma/annuler-commandes-essai.ts CHR-2026-0008 CHR-2026-0009
 */
// `tsx` ne charge pas les fichiers .env : on le fait explicitement.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const COMPTE_ESSAI = "atelier@chronova.test";
const INTOUCHABLES = ["EXPEDIEE", "LIVREE", "REMBOURSEE"];

async function main() {
  const numeros = process.argv.slice(2);
  if (numeros.length === 0) throw new Error("Donnez au moins un numéro de commande.");

  for (const number of numeros) {
    const commande = await prisma.order.findUnique({
      where: { number },
      include: { user: { select: { email: true } } },
    });
    if (!commande) {
      console.log(`? ${number} : introuvable`);
      continue;
    }
    if (commande.user?.email !== COMPTE_ESSAI) {
      console.log(`! ${number} : n'appartient pas au compte d'essai, laissée telle quelle`);
      continue;
    }
    if (commande.status === "ANNULEE") {
      console.log(`= ${number} : déjà annulée`);
      continue;
    }
    if (INTOUCHABLES.includes(commande.status)) {
      console.log(`! ${number} : ${commande.status}, laissée telle quelle`);
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const mouvements = await tx.stockMovement.findMany({ where: { orderId: commande.id } });
      // Ce qui reste réservé pour cette commande, pièce par pièce : les
      // réservations (négatives) moins ce qui a déjà été libéré ou monté.
      const reste = new Map<string, number>();
      for (const m of mouvements) {
        const avant = reste.get(m.partId) ?? 0;
        if (m.type === "RESERVATION") reste.set(m.partId, avant - m.quantity);
        if (m.type === "LIBERATION") reste.set(m.partId, avant - m.quantity);
        if (m.type === "SORTIE_ASSEMBLAGE") reste.set(m.partId, avant + m.quantity);
      }

      for (const [partId, quantite] of reste) {
        if (quantite <= 0) continue;
        await tx.stockMovement.create({
          data: {
            partId,
            type: "LIBERATION",
            quantity: quantite,
            orderId: commande.id,
            reason: `Commande d'essai ${number} annulée`,
          },
        });
        await tx.part.update({ where: { id: partId }, data: { quantityReserved: { decrement: quantite } } });
      }

      await tx.order.update({ where: { id: commande.id }, data: { status: "ANNULEE" } });
      await tx.orderEvent.create({
        data: {
          orderId: commande.id,
          fromStatus: commande.status,
          toStatus: "ANNULEE",
          isPublic: false,
          note: "Commande d'essai passée pendant l'audit du site : annulée, pièces rendues au stock.",
        },
      });
      console.log(`~ ${number} : annulée, ${[...reste.values()].filter((q) => q > 0).length} pièce(s) libérée(s)`);
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
