"use server";

import { signIn, signOut } from "@/auth";
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

  await signIn("resend", { email, redirectTo: suite, redirect: false });

  return {
    statut: "succes",
    message: "Si un compte correspond à cette adresse, un lien de connexion vient d'y être envoyé.",
  };
}

export async function seDeconnecter() {
  await signOut({ redirectTo: "/" });
}
