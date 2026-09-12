"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { recomposerStock } from "@/lib/atelier/stock";
import type { MovementType } from "@/generated/prisma/enums";

async function exigerAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session.user;
}

/** Un entier signé issu d'un champ de formulaire, ou zéro. */
function entier(valeur: FormDataEntryValue | null): number {
  const nombre = Number(String(valeur ?? "").replace(",", "."));
  return Number.isFinite(nombre) ? Math.trunc(nombre) : 0;
}

/**
 * Recalcule les deux compteurs d'une pièce depuis son journal.
 *
 * Personne n'incrémente un compteur à la main : on réécrit ce que le journal
 * raconte. Une erreur de saisie se corrige donc en ajoutant un mouvement, pas
 * en retouchant un chiffre — l'historique reste lisible.
 */
async function recalculer(partId: string) {
  const mouvements = await prisma.stockMovement.findMany({
    where: { partId },
    select: { type: true, quantity: true },
  });
  const etat = recomposerStock(mouvements);
  await prisma.part.update({
    where: { id: partId },
    data: { quantityOnHand: etat.enRayon, quantityReserved: etat.reserve },
  });
  return etat;
}

/**
 * Saisie d'un mouvement de stock : réception, perte ou correction d'inventaire.
 *
 * Le signe est imposé par le type, pas par l'horloger : une entrée est toujours
 * positive, une perte toujours négative. Seul l'ajustement accepte les deux,
 * puisque c'est précisément son rôle.
 */
export async function enregistrerMouvement(donnees: FormData): Promise<void> {
  const admin = await exigerAdmin();
  const reference = String(donnees.get("reference") ?? "");
  const type = String(donnees.get("type") ?? "") as MovementType;
  const saisie = entier(donnees.get("quantite"));
  const motif = String(donnees.get("motif") ?? "").trim();

  if (!["ENTREE", "PERTE", "AJUSTEMENT"].includes(type)) {
    throw new Error("Ce type de mouvement est écrit par les commandes, pas à la main.");
  }
  if (saisie === 0) return;

  const piece = await prisma.part.findUniqueOrThrow({ where: { reference } });
  const quantite =
    type === "ENTREE" ? Math.abs(saisie) : type === "PERTE" ? -Math.abs(saisie) : saisie;

  await prisma.stockMovement.create({
    data: {
      partId: piece.id,
      type,
      quantity: quantite,
      actorId: admin.id,
      reason: motif || null,
    },
  });

  await recalculer(piece.id);
  revalidatePath("/atelier/stock");
  revalidatePath(`/atelier/stock/${reference}`);
  revalidatePath("/atelier");
}

/**
 * Réglages d'une pièce : seuil d'alerte, prix d'achat, fournisseur, rangement.
 *
 * Les quantités ne sont pas modifiables ici — elles viennent du journal.
 */
export async function enregistrerPiece(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const reference = String(donnees.get("reference") ?? "");
  const fournisseur = String(donnees.get("fournisseur") ?? "");

  await prisma.part.update({
    where: { reference },
    data: {
      name: String(donnees.get("nom") ?? "").trim() || undefined,
      purchasePriceCents: Math.max(0, Math.round(Number(String(donnees.get("prix") ?? "0").replace(",", ".")) * 100)),
      reorderThreshold: Math.max(0, entier(donnees.get("seuil"))),
      restockDays: Math.max(0, entier(donnees.get("delai"))),
      storageLocation: String(donnees.get("rangement") ?? "").trim() || null,
      notes: String(donnees.get("notes") ?? "").trim() || null,
      supplierId: fournisseur || null,
    },
  });

  revalidatePath("/atelier/stock");
  revalidatePath(`/atelier/stock/${reference}`);
  // Le configurateur affiche le délai de réapprovisionnement : il doit suivre.
  revalidatePath("/composer", "layout");
  revalidatePath("/collection", "layout");
}

/** Coordonnées et délai d'un fournisseur. */
export async function enregistrerFournisseur(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("id") ?? "");

  await prisma.supplier.update({
    where: { id },
    data: {
      contactName: String(donnees.get("contact") ?? "").trim() || null,
      email: String(donnees.get("email") ?? "").trim() || null,
      phone: String(donnees.get("telephone") ?? "").trim() || null,
      website: String(donnees.get("site") ?? "").trim() || null,
      address: String(donnees.get("adresse") ?? "").trim() || null,
      leadTimeDays: Math.max(0, entier(donnees.get("delai"))),
      notes: String(donnees.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/atelier/fournisseurs");
  revalidatePath(`/atelier/fournisseurs/${id}`);
}

/**
 * Bon de commande fournisseur, prérempli avec ce qui est sous le seuil.
 *
 * La quantité proposée ramène chaque référence à deux fois son seuil : commander
 * juste le seuil ferait repartir l'alerte au premier montage.
 */
export async function creerBonDeCommande(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const supplierId = String(donnees.get("fournisseur") ?? "");

  const pieces = await prisma.part.findMany({
    where: { supplierId },
    orderBy: { reference: "asc" },
  });
  const aCommander = pieces
    .map((piece) => ({
      piece,
      quantite: piece.reorderThreshold * 2 - (piece.quantityOnHand - piece.quantityReserved),
    }))
    .filter((ligne) => ligne.quantite > 0);

  if (aCommander.length === 0) return;

  const fournisseur = await prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } });
  const compte = await prisma.purchaseOrder.count();
  const reference = `BC-${new Date().getFullYear()}-${String(compte + 1).padStart(4, "0")}`;

  await prisma.purchaseOrder.create({
    data: {
      reference,
      supplierId,
      status: "BROUILLON",
      expectedAt: new Date(Date.now() + fournisseur.leadTimeDays * 24 * 60 * 60 * 1000),
      lines: {
        create: aCommander.map((ligne) => ({
          partId: ligne.piece.id,
          quantity: ligne.quantite,
          unitCostCents: ligne.piece.purchasePriceCents,
        })),
      },
    },
  });

  revalidatePath(`/atelier/fournisseurs/${supplierId}`);
}

/**
 * Réception d'un bon de commande : les pièces entrent en stock.
 *
 * Une seule réception par bon, totale. Les réceptions partielles existent dans
 * le schéma (`quantityReceived`) mais l'écran ne les propose pas encore : mieux
 * vaut une fonction juste qu'une fonction à moitié.
 */
export async function recevoirBonDeCommande(donnees: FormData): Promise<void> {
  const admin = await exigerAdmin();
  const id = String(donnees.get("bon") ?? "");

  const bon = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id },
    include: { lines: true },
  });
  if (bon.status === "RECUE") return;

  await prisma.$transaction([
    ...bon.lines.map((ligne) =>
      prisma.stockMovement.create({
        data: {
          partId: ligne.partId,
          type: "ENTREE",
          quantity: ligne.quantity,
          actorId: admin.id,
          reason: `Réception ${bon.reference}`,
        },
      }),
    ),
    ...bon.lines.map((ligne) =>
      prisma.purchaseOrderLine.update({
        where: { id: ligne.id },
        data: { quantityReceived: ligne.quantity },
      }),
    ),
    prisma.purchaseOrder.update({
      where: { id },
      data: { status: "RECUE", receivedAt: new Date() },
    }),
  ]);

  for (const ligne of bon.lines) await recalculer(ligne.partId);

  revalidatePath(`/atelier/fournisseurs/${bon.supplierId}`);
  revalidatePath("/atelier/stock");
  revalidatePath("/atelier");
}

/** Passe un brouillon à « envoyée », ou annule un bon. */
export async function changerStatutBon(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("bon") ?? "");
  const statut = String(donnees.get("statut") ?? "");
  if (statut !== "ENVOYEE" && statut !== "ANNULEE") return;

  const bon = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: statut, orderedAt: statut === "ENVOYEE" ? new Date() : undefined },
  });

  revalidatePath(`/atelier/fournisseurs/${bon.supplierId}`);
}
