"use server";

import { signIn, signOut } from "@/auth";
import { VERSION_CGU } from "@/lib/content/versions";
import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";
import { REGLES } from "@/lib/securite/limite-debit";
import { limiter } from "@/lib/securite/limite-requete";

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
  const suite = cheminLocal(String(donnees.get("suite") ?? ""));

  if (email.length > 254 || !EMAIL.test(email)) {
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

  // Chaque appel écrit en base ET envoie un e-mail : sans limite, n'importe qui
  // peut bombarder la boîte d'un tiers ou vider le quota d'envoi (audit A-12).
  // Deux clés : l'IP de l'appelant, et l'adresse visée (une IP se change).
  const tropVite = await limiter("lien-magique", [
    { cle: "ip", regle: REGLES.lienParIp },
    { cle: `email:${email}`, regle: REGLES.lienParEmail },
  ]);
  // Le formulaire de connexion n'affiche que les erreurs de champ : le message
  // est donc aussi rattaché au champ e-mail, pour être vu et lu.
  if (tropVite) return { statut: "erreur", message: tropVite, erreurs: { email: tropVite } };

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

/**
 * `suite` vient du formulaire, donc du visiteur : on n'y accepte qu'un chemin du
 * site. `//evil.example`, `/\\evil.example` ou une URL absolue enverraient la
 * personne ailleurs juste après sa connexion (redirection ouverte).
 */
function cheminLocal(suite: string): string {
  if (!suite.startsWith("/") || suite.startsWith("//") || suite.includes("\\") || suite.length > 300) {
    return "/compte";
  }
  return suite;
}

export async function seDeconnecter() {
  await signOut({ redirectTo: "/" });
}
