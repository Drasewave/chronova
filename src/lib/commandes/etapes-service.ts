import { prisma } from "@/lib/db";
import { envoyerCourriel } from "@/lib/email";
import type { OrderStatus } from "@/generated/prisma/enums";
import { SITE } from "@/lib/env";

/**
 * Étapes d'une commande — le service, sans session.
 *
 * Appelé par l'atelier (action `changerEtape`, après le contrôle du rôle). Ce n'est PAS un
 * fichier « use server » : ses exports ne sont pas des actions publiques (même règle que
 * src/lib/commandes/finalisation.ts, audit A-14).
 */


/** Gabarit d'e-mail associé à chaque étape. Absent : aucun e-mail n'est envoyé. */
const GABARITS: Partial<Record<OrderStatus, string>> = {
  PAYEE: "commande.payee",
  PIECES_RECUES: "commande.pieces_recues",
  EN_ASSEMBLAGE: "commande.en_assemblage",
  CONTROLE: "commande.controle",
  EXPEDIEE: "commande.expediee",
  LIVREE: "commande.livree",
};

export type ResultatEtape = { change: boolean; de: OrderStatus };

/**
 * Changement d'étape : le statut, une entrée de frise visible par le client et l'e-mail
 * correspondant. La sortie de stock a lieu au passage en assemblage (les pièces quittent les
 * tiroirs) ; la garantie naît à l'expédition.
 *
 * Le passage est conditionnel (`updateMany where status = de`) : deux demandes simultanées ne
 * sortent jamais deux fois les pièces ni n'envoient deux e-mails.
 */
export async function appliquerEtape(
  numero: string,
  cible: OrderStatus,
  acteurId: string | null,
  options: { note?: string } = {},
): Promise<ResultatEtape> {
  const commande = await prisma.order.findUniqueOrThrow({
    where: { number: numero },
    include: { items: { include: { parts: true } }, warranty: true },
  });
  const de = commande.status;
  if (de === cible) return { change: false, de };

  const change = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: commande.id, status: de },
      data: {
        status: cible,
        ...(cible === "EXPEDIEE" ? { shippedAt: new Date() } : {}),
        ...(cible === "LIVREE" ? { deliveredAt: new Date() } : {}),
      },
    });
    // Quelqu'un d'autre vient de la faire avancer : on ne rejoue rien.
    if (count === 0) return false;

    await tx.orderEvent.create({
      data: {
        orderId: commande.id,
        fromStatus: de,
        toStatus: cible,
        note: options.note?.trim() || null,
        actorId: acteurId,
        emailSent: Boolean(GABARITS[cible]),
      },
    });

    if (cible === "EN_ASSEMBLAGE") {
      for (const ligne of commande.items) {
        for (const piece of ligne.parts) {
          // Conditionnel lui aussi : une pièce déjà sortie ne l'est pas deux fois.
          const sortie = await tx.orderItemPart.updateMany({
            where: { id: piece.id, consumedAt: null },
            data: { consumedAt: new Date() },
          });
          if (sortie.count === 0) continue;
          // La pièce quitte le tiroir : la quantité en rayon baisse, et la
          // réservation qui la retenait est libérée d'autant.
          await tx.part.update({
            where: { id: piece.partId },
            data: {
              quantityOnHand: { decrement: piece.quantity },
              quantityReserved: { decrement: piece.quantity },
            },
          });
          await tx.stockMovement.create({
            data: {
              partId: piece.partId,
              type: "SORTIE_ASSEMBLAGE",
              quantity: -piece.quantity,
              orderId: commande.id,
              actorId: acteurId,
              reason: `Assemblage ${commande.number}`,
            },
          });
        }
      }
    }

    if (cible === "EXPEDIEE" && !commande.warranty) {
      const duree = await tx.setting.findUnique({ where: { key: "garantie.duree_mois" } });
      const mois = (duree?.value as { mois?: number } | null)?.mois ?? 24;
      await tx.warranty.create({
        data: {
          orderId: commande.id,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + mois * 30 * 24 * 60 * 60 * 1000),
          terms: "[À REMPLIR : durée et conditions de garantie]",
        },
      });
    }
    return true;
  });

  if (change) await previenir(commande.id, cible);
  return { change, de };
}

/** Transporteur et suivi du colis. Rend vrai si quelque chose a changé. */
export async function enregistrerSuiviCommande(
  numero: string,
  suivi: { transporteur: string | null; numero: string | null; url: string | null },
): Promise<boolean> {
  const avant = await prisma.order.findUniqueOrThrow({
    where: { number: numero },
    select: { carrier: true, trackingNumber: true, trackingUrl: true },
  });
  const apres = { carrier: suivi.transporteur || null, trackingNumber: suivi.numero || null, trackingUrl: suivi.url || null };
  if (avant.carrier === apres.carrier && avant.trackingNumber === apres.trackingNumber && avant.trackingUrl === apres.trackingUrl)
    return false;
  await prisma.order.update({ where: { number: numero }, data: apres });
  return true;
}

/** Envoie l'e-mail d'étape. Un échec ne remet jamais la commande en cause. */
async function previenir(orderId: string, etape: OrderStatus): Promise<void> {
  const cle = GABARITS[etape];
  if (!cle) return;

  const [commande, gabarit] = await Promise.all([
    prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true } }, qc: true },
    }),
    prisma.emailTemplate.findUnique({ where: { key: cle } }),
  ]);

  if (!gabarit?.isActive) return;

  const variables: Record<string, string> = {
    prenom: commande.user?.name?.split(" ")[0] ?? "",
    numero: commande.number,
    modele: (commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "votre montre",
    suivi: commande.trackingNumber ?? "—",
    ecart:
      commande.qc?.rateSecondsPerDay === null || commande.qc?.rateSecondsPerDay === undefined
        ? "—"
        : String(commande.qc.rateSecondsPerDay),
    lien_suivi: `${SITE}/compte/commandes/${commande.number}`,
    delai: "—",
  };

  const remplir = (texte: string) =>
    texte.replace(/\{\{(\w+)\}\}/g, (_, cle: string) => variables[cle] ?? `{{${cle}}}`);

  try {
    await envoyerCourriel({
      to: commande.email,
      subject: remplir(gabarit.subject),
      text: `${remplir(gabarit.bodyMd)}\n\nSuivi : ${variables["lien_suivi"]}`,
    });
  } catch (erreur) {
    console.error(`E-mail d'étape ${etape} non envoyé :`, erreur);
  }
}
