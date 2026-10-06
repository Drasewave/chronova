"use server";

import { revalidatePath } from "next/cache";
import { exigerAdminAction } from "@/lib/securite/acces";
import { prisma } from "@/lib/db";
import { appliquerEtape, enregistrerSuiviCommande } from "@/lib/commandes/etapes-service";
import { OrderStatus } from "@/generated/prisma/enums";

/**
 * Changement d'étape depuis l'atelier : le contrôle du rôle, puis le service
 * (src/lib/commandes/etapes-service.ts) — statut, frise, sortie de stock, garantie, e-mail.
 */
export async function changerEtape(donnees: FormData): Promise<void> {
  const admin = await exigerAdminAction();
  const numero = String(donnees.get("numero") ?? "");
  const etape = String(donnees.get("etape") ?? "");
  // Valeur de formulaire : on vérifie qu'elle est bien un statut avant de l'écrire.
  if (!Object.hasOwn(OrderStatus, etape)) throw new Error("Étape inconnue.");
  await appliquerEtape(numero, etape as OrderStatus, admin.id, { note: String(donnees.get("note") ?? "") });

  revalidatePath("/atelier/commandes");
  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
}


export async function basculerTache(donnees: FormData): Promise<void> {
  await exigerAdminAction();
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
  await exigerAdminAction();
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
  await exigerAdminAction();
  const numero = String(donnees.get("numero") ?? "");

  await enregistrerSuiviCommande(numero, {
    transporteur: String(donnees.get("transporteur") ?? "").trim() || null,
    numero: String(donnees.get("suivi") ?? "").trim() || null,
    url: String(donnees.get("url") ?? "").trim() || null,
  });

  revalidatePath(`/atelier/commandes/${numero}`);
  revalidatePath(`/compte/commandes/${numero}`);
}

export async function enregistrerNotes(donnees: FormData): Promise<void> {
  await exigerAdminAction();
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
  await exigerAdminAction();
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
