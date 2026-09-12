"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { envoyerCourriel } from "@/lib/email";
import type { OrderStatus } from "@/generated/prisma/enums";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Gabarit d'e-mail associé à chaque étape. Absent : aucun e-mail n'est envoyé. */
const GABARITS: Partial<Record<OrderStatus, string>> = {
  PAYEE: "commande.payee",
  PIECES_RECUES: "commande.pieces_recues",
  EN_ASSEMBLAGE: "commande.en_assemblage",
  CONTROLE: "commande.controle",
  EXPEDIEE: "commande.expediee",
  LIVREE: "commande.livree",
};

async function exigerAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session.user;
}

/**
 * Changement d'étape.
 *
 * Trois choses en même temps : le statut, une entrée de frise visible par le
 * client, et l'e-mail correspondant. La sortie de stock est déclenchée ici au
 * passage en assemblage — c'est le moment où les pièces quittent réellement les
 * tiroirs.
 */
export async function changerEtape(donnees: FormData): Promise<void> {
  const admin = await exigerAdmin();
  const numero = String(donnees.get("numero") ?? "");
  const cible = String(donnees.get("etape") ?? "") as OrderStatus;
  const note = String(donnees.get("note") ?? "").trim();

  const commande = await prisma.order.findUniqueOrThrow({
    where: { number: numero },
    include: {
      items: { include: { parts: true } },
      user: { select: { name: true } },
      qc: true,
      warranty: true,
    },
  });

  if (commande.status === cible) return;

  const sortieStock =
    cible === "EN_ASSEMBLAGE" &&
    commande.items.some((ligne) => ligne.parts.some((piece) => piece.consumedAt === null));

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: commande.id },
      data: {
        status: cible,
        ...(cible === "EXPEDIEE" ? { shippedAt: new Date() } : {}),
        ...(cible === "LIVREE" ? { deliveredAt: new Date() } : {}),
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: commande.id,
        fromStatus: commande.status,
        toStatus: cible,
        note: note || null,
        actorId: admin.id,
        emailSent: Boolean(GABARITS[cible]),
      },
    });

    if (sortieStock) {
      for (const ligne of commande.items) {
        for (const piece of ligne.parts) {
          if (piece.consumedAt) continue;
          await tx.orderItemPart.update({
            where: { id: piece.id },
            data: { consumedAt: new Date() },
          });
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
              actorId: admin.id,
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
  });

  await previenir(commande.id, cible);

  revalidatePath("/atelier/commandes");
  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
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

export async function basculerTache(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("id") ?? "");
  const numero = String(donnees.get("numero") ?? "");

  const tache = await prisma.assemblyTask.findUnique({ where: { id } });
  if (!tache) return;

  await prisma.assemblyTask.update({
    where: { id },
    data: { isDone: !tache.isDone, doneAt: tache.isDone ? null : new Date() },
  });

  revalidatePath(`/atelier/commandes/${numero}`);
}

export async function enregistrerControle(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const numero = String(donnees.get("numero") ?? "");
  const commande = await prisma.order.findUniqueOrThrow({ where: { number: numero } });

  const nombre = (cle: string) => {
    const brut = String(donnees.get(cle) ?? "").replace(",", ".").trim();
    if (!brut) return null;
    const valeur = Number(brut);
    return Number.isFinite(valeur) ? valeur : null;
  };

  const champs = {
    waterTestPassed: donnees.get("etancheite") === "on",
    waterTestBar: nombre("bar"),
    rateSecondsPerDay: nombre("ecart"),
    amplitudeDegrees: nombre("amplitude"),
    beatErrorMs: nombre("erreurLevee"),
    notes: String(donnees.get("notes") ?? "").trim() || null,
    passed: donnees.get("valide") === "on",
  };

  await prisma.qualityControl.upsert({
    where: { orderId: commande.id },
    update: champs,
    create: { orderId: commande.id, ...champs, testStartedAt: new Date() },
  });

  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
}

export async function enregistrerSuivi(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const numero = String(donnees.get("numero") ?? "");

  await prisma.order.update({
    where: { number: numero },
    data: {
      carrier: String(donnees.get("transporteur") ?? "").trim() || null,
      trackingNumber: String(donnees.get("suivi") ?? "").trim() || null,
      trackingUrl: String(donnees.get("url") ?? "").trim() || null,
    },
  });

  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
}

export async function enregistrerNotes(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const numero = String(donnees.get("numero") ?? "");

  await prisma.order.update({
    where: { number: numero },
    data: { internalNotes: String(donnees.get("notes") ?? "").trim() || null },
  });

  revalidatePath(`/atelier/commandes/${numero}`);
}

/**
 * Photo d'assemblage.
 *
 * Le stockage de fichiers n'est pas branché : on enregistre une description et
 * la visibilité, et l'emplacement est affiché côté client. Brancher Vercel Blob
 * ne changera que la valeur de `url`.
 */
export async function ajouterPhoto(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const numero = String(donnees.get("numero") ?? "");
  const commande = await prisma.order.findUniqueOrThrow({ where: { number: numero } });
  const alt = String(donnees.get("alt") ?? "").trim();
  if (!alt) return;

  await prisma.orderPhoto.create({
    data: {
      orderId: commande.id,
      url: String(donnees.get("url") ?? "").trim(),
      alt,
      caption: String(donnees.get("legende") ?? "").trim() || null,
      isPublic: donnees.get("visible") === "on",
    },
  });

  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
}
