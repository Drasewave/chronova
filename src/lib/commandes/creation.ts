import "server-only";
import { prisma } from "@/lib/db";
import { buildConfiguration } from "@/lib/configurateur/configuration";
import { decodeConfig } from "@/lib/configurateur/url";
import { getCatalogue, getModel } from "@/lib/data/queries";
import type { OrderStatus } from "@/generated/prisma/enums";
import { PanierIndisponibleError, piecesManquantes, type PieceManquante } from "./disponibilite";

/** Ce que le client envoie : une référence, jamais un prix. */
export interface LignePanier {
  modelSlug: string;
  shareParam: string;
  quantity: number;
}

export interface AdresseCommande {
  fullName: string;
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string;
}

const CHECKLIST = [
  "Contrôle des pièces à réception",
  "Pose du cadran et des index",
  "Chassage des aiguilles",
  "Emboîtage du mouvement",
  "Pose du verre et du joint",
  "Vissage du fond",
  "Test d'étanchéité",
  "Marche suivie sur 72 h",
  "Nettoyage et mise en écrin",
];

/**
 * Recalcule le panier côté serveur.
 *
 * Le navigateur n'envoie que le modèle, la configuration et la quantité. Prix,
 * délai et nomenclature sont recalculés ici à partir du catalogue en base : un
 * panier vieux de trois semaines, ou trafiqué, ne peut pas imposer son tarif.
 */
export async function chiffrerPanier(lignes: LignePanier[]) {
  const catalogue = await getCatalogue();
  const chiffrees = [];

  for (const ligne of lignes) {
    if (typeof ligne?.modelSlug !== "string") continue;
    const modele = await getModel(ligne.modelSlug);
    if (!modele) continue;

    const selections = {
      ...modele.defaultSelections,
      ...decodeConfig(catalogue, ligne.shareParam),
    };
    const configuration = buildConfiguration(catalogue, modele, selections);
    // `quantity` vient du navigateur : un NaN traverserait `Math.min/max` intact.
    const demandee = Number(ligne.quantity);
    const quantite = Number.isFinite(demandee) ? Math.min(9, Math.max(1, Math.trunc(demandee))) : 1;

    chiffrees.push({ modele, configuration, quantite });
  }

  const sousTotalCents = chiffrees.reduce(
    (somme, ligne) => somme + ligne.configuration.price.totalCents * ligne.quantite,
    0,
  );

  return { chiffrees, sousTotalCents };
}

type LigneChiffree = Awaited<ReturnType<typeof chiffrerPanier>>["chiffrees"][number];

/**
 * Ce que le panier consomme, comparé à ce qui est LIBRE en base maintenant
 * (audit A-13). Les compteurs sont relus directement, pas pris dans le catalogue
 * mis en cache pour le rendu : c'est l'instant de la commande qui compte.
 */
export async function verifierDisponibilite(chiffrees: LigneChiffree[]): Promise<PieceManquante[]> {
  const references = [
    ...new Set(chiffrees.flatMap((ligne) => ligne.configuration.bom.map((entree) => entree.part.ref))),
  ];
  if (references.length === 0) return [];

  const pieces = await prisma.part.findMany({
    where: { reference: { in: references } },
    select: { reference: true, quantityOnHand: true, quantityReserved: true },
  });

  return piecesManquantes(
    chiffrees.map((ligne) => ({
      modelName: ligne.modele.name,
      quantite: ligne.quantite,
      bom: ligne.configuration.bom,
    })),
    new Map(pieces.map((piece) => [piece.reference, piece] as const)),
  );
}

/** Frais de port, lus dans les paramètres de l'atelier. */
export async function fraisDePort(sousTotalCents: number): Promise<number> {
  const [frais, franco] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "livraison.frais_cents" } }),
    prisma.setting.findUnique({ where: { key: "livraison.franco_cents" } }),
  ]);

  const montant = (frais?.value as { cents?: number } | null)?.cents ?? 0;
  const seuil = (franco?.value as { cents?: number } | null)?.cents ?? Infinity;
  return sousTotalCents >= seuil ? 0 : montant;
}

/**
 * Numéro de commande lisible : CHR-2026-0007.
 *
 * Deux paiements simultanés pourraient viser le même numéro ; la contrainte
 * d'unicité en base tranche, et on retente avec le suivant plutôt que de
 * sérialiser toutes les commandes derrière un verrou.
 */
async function numeroDisponible(): Promise<string> {
  const annee = new Date().getFullYear();
  const dejaCetteAnnee = await prisma.order.count({
    where: { number: { startsWith: `CHR-${annee}-` } },
  });

  for (let essai = 0; essai < 20; essai += 1) {
    const numero = `CHR-${annee}-${String(dejaCetteAnnee + 1 + essai).padStart(4, "0")}`;
    const pris = await prisma.order.findUnique({ where: { number: numero }, select: { id: true } });
    if (!pris) return numero;
  }

  throw new Error("Impossible d'attribuer un numéro de commande.");
}

/**
 * Crée la commande en attente de paiement.
 *
 * Rien n'est réservé à ce stade : tant que le paiement n'est pas confirmé, le
 * stock reste disponible pour quelqu'un d'autre. En revanche la disponibilité est
 * VÉRIFIÉE ici : on n'envoie pas au paiement un panier que l'atelier ne peut pas
 * monter. Lève `PanierIndisponibleError` (message affichable au client).
 */
export async function creerCommandeEnAttente(options: {
  userId: string;
  email: string;
  lignes: LignePanier[];
  adresse: AdresseCommande;
}) {
  const { chiffrees, sousTotalCents } = await chiffrerPanier(options.lignes);
  if (chiffrees.length === 0) throw new Error("Panier vide.");

  const manquantes = await verifierDisponibilite(chiffrees);
  if (manquantes.length > 0) throw new PanierIndisponibleError(manquantes);

  const port = await fraisDePort(sousTotalCents);
  const numero = await numeroDisponible();
  const delaiMax = Math.max(...chiffrees.map((ligne) => ligne.configuration.leadTime.days));

  // Les identifiants de modèle sont résolus avant de construire la création :
  // une requête ne peut pas vivre à l'intérieur d'un `data` imbriqué.
  const modelesEnBase = await prisma.watchModel.findMany({
    where: { slug: { in: chiffrees.map((ligne) => ligne.modele.slug) } },
    select: { id: true, slug: true },
  });
  const idParSlug = new Map(modelesEnBase.map((modele) => [modele.slug, modele.id] as const));

  return prisma.order.create({
    data: {
      number: numero,
      userId: options.userId,
      email: options.email,
      status: "EN_ATTENTE_PAIEMENT",
      subtotalCents: sousTotalCents,
      shippingCents: port,
      totalCents: sousTotalCents + port,
      shippingAddress: options.adresse as never,
      promisedAt: new Date(Date.now() + delaiMax * 24 * 60 * 60 * 1000),
      items: {
        create: chiffrees.map((ligne) => ({
          quantity: ligne.quantite,
          unitPriceCents: ligne.configuration.price.totalCents,
          partsCostCents: ligne.configuration.partsCostCents,
          snapshot: {
            modele: ligne.modele.name,
            render: ligne.configuration.render,
            summary: ligne.configuration.summary,
          } as never,
          configuration: {
            create: {
              shareCode: ligne.configuration.shareParam,
              modelId: idParSlug.get(ligne.modele.slug)!,
              selections: ligne.configuration.selections as never,
              engravingText: ligne.configuration.selections["gravure"] ?? null,
              wristSizeMm: Number(ligne.configuration.selections["poignet"] ?? 0) || null,
              snapshot: {
                render: ligne.configuration.render,
                summary: ligne.configuration.summary,
                price: ligne.configuration.price,
                leadTime: ligne.configuration.leadTime,
              } as never,
              priceCents: ligne.configuration.price.totalCents,
              partsCostCents: ligne.configuration.partsCostCents,
              leadTimeDays: ligne.configuration.leadTime.days,
            },
          },
        })),
      },
    },
    include: { items: true },
  });
}

/**
 * Confirme le paiement d'une commande.
 *
 * Appelée par le webhook Stripe, et par le mode de démonstration hors
 * production. **Idempotente** : Stripe peut livrer deux fois le même
 * évènement, et une double réservation de stock serait invisible jusqu'au jour
 * où une pièce manquerait.
 */
export async function confirmerPaiement(options: {
  orderId: string;
  stripePaymentIntentId?: string | null;
  adresse?: AdresseCommande | null;
}): Promise<{ deja: boolean; numero: string }> {
  const commande = await prisma.order.findUniqueOrThrow({
    where: { id: options.orderId },
    include: { items: { include: { configuration: true } } },
  });

  if (commande.status !== "EN_ATTENTE_PAIEMENT") {
    return { deja: true, numero: commande.number };
  }

  const catalogue = await getCatalogue();

  // Nomenclature : on repart des sélections figées, pas d'un calcul refait.
  const nomenclature: {
    orderItemId: string;
    partId: string;
    reference: string;
    quantity: number;
    unitCostCents: number;
  }[] = [];
  for (const ligne of commande.items) {
    const modele = await getModel(
      (
        await prisma.watchModel.findUniqueOrThrow({
          where: { id: ligne.configuration.modelId },
          select: { slug: true },
        })
      ).slug,
    );
    if (!modele) continue;

    const configuration = buildConfiguration(
      catalogue,
      modele,
      ligne.configuration.selections as Record<string, string>,
    );
    for (const entree of configuration.bom) {
      const piece = await prisma.part.findUnique({ where: { reference: entree.part.ref } });
      if (!piece) continue;
      nomenclature.push({
        orderItemId: ligne.id,
        partId: piece.id,
        reference: piece.reference,
        quantity: entree.quantity * ligne.quantity,
        unitCostCents: entree.unitCostCents,
      });
    }
  }

  /**
   * Tout se joue dans UNE transaction, et elle commence par le changement de
   * statut conditionnel : `updateMany … where status = EN_ATTENTE_PAIEMENT`.
   * Si Stripe livre deux fois l'évènement en même temps, une seule des deux
   * transactions modifie la ligne ; l'autre voit `count === 0` et s'arrête avant
   * toute réservation. Le test de statut fait plus haut, hors transaction, n'est
   * qu'un raccourci (audit A-14).
   */
  const premiere = await prisma.$transaction(
    async (tx) => {
      const bascule = await tx.order.updateMany({
        where: { id: commande.id, status: "EN_ATTENTE_PAIEMENT" },
        data: {
          status: "PAYEE",
          paidAt: new Date(),
          stripePaymentIntentId: options.stripePaymentIntentId ?? null,
          ...(options.adresse ? { shippingAddress: options.adresse as never } : {}),
        },
      });
      if (bascule.count === 0) return false;

      // Réservation du stock : la quantité réservée monte, le journal enregistre
      // le mouvement. La quantité en rayon ne bouge qu'au moment de l'assemblage.
      const aCourt: string[] = [];
      for (const entree of nomenclature) {
        await tx.orderItemPart.create({
          data: {
            orderItemId: entree.orderItemId,
            partId: entree.partId,
            quantity: entree.quantity,
            unitCostCents: entree.unitCostCents,
            reservedAt: new Date(),
          },
        });
        const piece = await tx.part.update({
          where: { id: entree.partId },
          data: { quantityReserved: { increment: entree.quantity } },
          select: { quantityOnHand: true, quantityReserved: true },
        });
        if (piece.quantityReserved > piece.quantityOnHand) aCourt.push(entree.reference);
        await tx.stockMovement.create({
          data: {
            partId: entree.partId,
            type: "RESERVATION",
            quantity: -entree.quantity,
            orderId: commande.id,
            reason: `Commande ${commande.number}`,
          },
        });
      }

      await tx.orderEvent.create({
        data: { orderId: commande.id, toStatus: "PAYEE", isPublic: true },
      });

      // Le client a payé : on ne refuse plus rien. Mais si, entre la création de
      // la commande et le paiement, quelqu'un d'autre a pris la dernière pièce,
      // l'atelier doit le savoir tout de suite — note interne, jamais publique.
      if (aCourt.length > 0) {
        await tx.orderEvent.create({
          data: {
            orderId: commande.id,
            toStatus: "PAYEE",
            isPublic: false,
            note: `Stock insuffisant au moment du paiement, à réapprovisionner : ${[...new Set(aCourt)].join(", ")}.`,
          },
        });
      }

      await tx.assemblyTask.createMany({
        data: CHECKLIST.map((label, index) => ({
          orderId: commande.id,
          label,
          sortIndex: index,
        })),
      });

      return true;
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  return { deja: !premiere, numero: commande.number };
}

export const STATUT_PAYEE: OrderStatus = "PAYEE";
