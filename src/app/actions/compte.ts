"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";

async function utilisateurConnecte() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/compte");
  return session.user;
}

export async function enregistrerProfil(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await utilisateurConnecte();

  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  const poignet = String(donnees.get("poignet") ?? "").trim();
  const preferences = String(donnees.get("preferences") ?? "").trim();
  const newsletter = donnees.get("newsletter") === "on";

  const poignetMm = poignet ? Number(poignet) : null;
  if (poignetMm !== null && (!Number.isFinite(poignetMm) || poignetMm < 120 || poignetMm > 240)) {
    return {
      statut: "erreur",
      message: "Le formulaire n'a pas pu être enregistré.",
      erreurs: { poignet: "Indiquez un tour de poignet entre 120 et 240 mm." },
    };
  }

  const avant = await prisma.user.findUniqueOrThrow({
    where: { id: utilisateur.id },
    select: { newsletter: true, email: true },
  });

  await prisma.user.update({
    where: { id: utilisateur.id },
    data: {
      name: nom || null,
      phone: telephone || null,
      wristSizeMm: poignetMm,
      preferences: preferences || null,
      newsletter,
    },
  });

  // Le consentement à la lettre est horodaté à chaque changement : c'est la
  // preuve exigée par le RGPD, et elle doit valoir dans les deux sens.
  if (avant.newsletter !== newsletter) {
    await prisma.consentLog.create({
      data: {
        userId: utilisateur.id,
        email: avant.email,
        type: "NEWSLETTER",
        granted: newsletter,
        source: "compte",
      },
    });
  }

  revalidatePath("/compte/profil");
  return { statut: "succes", message: "Profil enregistré." };
}

export async function ajouterAdresse(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const utilisateur = await utilisateurConnecte();

  const champs = {
    label: String(donnees.get("label") ?? "").trim() || null,
    fullName: String(donnees.get("nomComplet") ?? "").trim(),
    line1: String(donnees.get("ligne1") ?? "").trim(),
    line2: String(donnees.get("ligne2") ?? "").trim() || null,
    postalCode: String(donnees.get("codePostal") ?? "").trim(),
    city: String(donnees.get("ville") ?? "").trim(),
    country: String(donnees.get("pays") ?? "FR").trim().toUpperCase().slice(0, 2),
  };

  const erreurs: Record<string, string> = {};
  if (champs.fullName.length < 2) erreurs["nomComplet"] = "Indiquez le nom du destinataire.";
  if (champs.line1.length < 4) erreurs["ligne1"] = "Indiquez le numéro et la rue.";
  if (!/^\d{4,10}$/.test(champs.postalCode)) erreurs["codePostal"] = "Code postal invalide.";
  if (champs.city.length < 2) erreurs["ville"] = "Indiquez la ville.";

  if (Object.keys(erreurs).length > 0) {
    return { statut: "erreur", message: "L'adresse n'a pas pu être enregistrée.", erreurs };
  }

  const premiere = (await prisma.address.count({ where: { userId: utilisateur.id } })) === 0;

  await prisma.address.create({
    data: {
      userId: utilisateur.id,
      ...champs,
      isDefaultShipping: premiere,
      isDefaultBilling: premiere,
    },
  });

  revalidatePath("/compte/adresses");
  return { statut: "succes", message: "Adresse enregistrée." };
}

export async function supprimerAdresse(donnees: FormData): Promise<void> {
  const utilisateur = await utilisateurConnecte();
  const id = String(donnees.get("id") ?? "");

  // `deleteMany` filtré sur l'utilisateur : impossible de supprimer l'adresse
  // de quelqu'un d'autre en devinant un identifiant.
  await prisma.address.deleteMany({ where: { id, userId: utilisateur.id } });
  revalidatePath("/compte/adresses");
}

export async function definirAdresseParDefaut(donnees: FormData): Promise<void> {
  const utilisateur = await utilisateurConnecte();
  const id = String(donnees.get("id") ?? "");

  const adresse = await prisma.address.findFirst({ where: { id, userId: utilisateur.id } });
  if (!adresse) return;

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId: utilisateur.id },
      data: { isDefaultShipping: false, isDefaultBilling: false },
    }),
    prisma.address.update({
      where: { id },
      data: { isDefaultShipping: true, isDefaultBilling: true },
    }),
  ]);

  revalidatePath("/compte/adresses");
}

/**
 * Effacement des données personnelles, à la demande du client.
 *
 * Les commandes ne sont pas supprimées : la loi impose de conserver dix ans les
 * pièces comptables. Ce qui est effacé, c'est tout ce qui permet d'identifier
 * une personne — nom, adresses, téléphone, préférences, notes. L'adresse e-mail
 * est remplacée par une valeur neutre pour que le compte ne puisse plus servir
 * à se reconnecter.
 */
export async function anonymiserCompte(): Promise<void> {
  const utilisateur = await utilisateurConnecte();
  const anonyme = `supprime+${utilisateur.id}@chronova.invalid`;

  await prisma.$transaction([
    prisma.address.deleteMany({ where: { userId: utilisateur.id } }),
    prisma.session.deleteMany({ where: { userId: utilisateur.id } }),
    prisma.internalNote.deleteMany({ where: { userId: utilisateur.id } }),
    prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        email: anonyme,
        name: null,
        phone: null,
        preferences: null,
        crmNotes: null,
        wristSizeMm: null,
        newsletter: false,
        anonymizedAt: new Date(),
        tags: { set: [] },
      },
    }),
  ]);

  await signOut({ redirectTo: "/" });
}
