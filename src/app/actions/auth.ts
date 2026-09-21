"use server";

import { signIn, signOut } from "@/auth";
import { VERSION_CGU } from "@/lib/content/versions";
import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Demande d'un lien de connexion.
 *
 * La réponse est volontairement la même que l'adresse existe ou non : dire
 * « ce compte n'existe pas » permettrait à n'importe qui de vérifier si une
 * personne est cliente de l'atelier.
 */
export async function demanderLien(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const suite = String(donnees.get("suite") ?? "/compte");

  if (!EMAIL.test(email)) {
    return {
      statut: "erreur",
      message: "Le formulaire n'a pas pu être envoyé.",
      erreurs: { email: "Cette adresse ne semble pas valide." },
    };
  }

  // Le même formulaire connecte et crée le compte : l'acceptation des
  // conditions d'utilisation est donc demandée à chaque fois, case décochée par
  // défaut, et revérifiée ici.
  if (donnees.get("cgu") !== "on") {
    return {
      statut: "erreur",
      message: "Le formulaire n'a pas pu être envoyé.",
      erreurs: { cgu: "Cochez la case pour accepter les conditions d'utilisation." },
    };
  }

  // Preuve de l'acceptation : qui, quand, quelle version du texte.
  await prisma.consentLog.create({
    data: { email, type: "CGU", granted: true, source: `connexion:${VERSION_CGU}` },
  });

  await signIn("resend", { email, redirectTo: suite, redirect: false });

  return {
    statut: "succes",
    message: "Si un compte correspond à cette adresse, un lien de connexion vient d'y être envoyé.",
  };
}

export async function seDeconnecter() {
  await signOut({ redirectTo: "/" });
}
