"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { VERSION_CGU } from "@/lib/content/versions";
import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";
import { REGLES } from "@/lib/securite/limite-debit";
import { limiter } from "@/lib/securite/limite-requete";
import {
  EMPREINTE_FACTICE,
  erreurMotDePasse,
  hacherMotDePasse,
  verifierMotDePasse,
} from "@/lib/securite/mot-de-passe";
import { ouvrirSession } from "@/lib/securite/session";
import { avecBase } from "@/lib/base-path";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const echec = (erreurs: Record<string, string>, message = "Le formulaire n'a pas pu être envoyé."): EtatFormulaire => ({
  statut: "erreur",
  message,
  erreurs,
});

/**
 * Connexion par adresse e-mail et mot de passe.
 *
 * Un seul message pour « adresse inconnue » et « mauvais mot de passe » : dire
 * lequel des deux est faux permettrait de vérifier si quelqu'un est client de
 * l'atelier. Le mot de passe est vérifié même sans compte (empreinte factice),
 * pour que la réponse prenne le même temps dans les deux cas.
 */
export async function seConnecter(_precedent: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(donnees.get("mot_de_passe") ?? "");
  const suite = cheminLocal(String(donnees.get("suite") ?? ""));

  if (email.length > 254 || !EMAIL.test(email)) return echec({ email: "Cette adresse ne semble pas valide." });
  if (!motDePasse) return echec({ mot_de_passe: "Indiquez votre mot de passe." });

  // Deux clés : l'IP de l'appelant, et le compte visé (une IP se change).
  const tropVite = await limiter("connexion", [
    { cle: "ip", regle: REGLES.connexionParIp },
    { cle: `email:${email}`, regle: REGLES.connexionParEmail },
  ]);
  if (tropVite) return echec({ mot_de_passe: tropVite }, tropVite);

  const compte = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, anonymizedAt: true },
  });
  const bon = await verifierMotDePasse(motDePasse, compte?.passwordHash ?? EMPREINTE_FACTICE);
  if (!compte || !bon || compte.anonymizedAt) {
    return echec({ mot_de_passe: "Adresse e-mail ou mot de passe incorrect." }, "Adresse e-mail ou mot de passe incorrect.");
  }

  await ouvrirSession(compte.id);
  redirect(suite);
}

/**
 * Création d'un compte client. L'adresse déjà prise est refusée : sans e-mail de
 * vérification, réattribuer un compte existant à qui connaît seulement son adresse
 * reviendrait à le lui donner.
 */
export async function creerCompte(_precedent: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(donnees.get("mot_de_passe") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");
  const suite = cheminLocal(String(donnees.get("suite") ?? ""));

  const erreurs: Record<string, string> = {};
  if (email.length > 254 || !EMAIL.test(email)) erreurs.email = "Cette adresse ne semble pas valide.";
  const regle = erreurMotDePasse(motDePasse);
  if (regle) erreurs.mot_de_passe = regle;
  else if (confirmation !== motDePasse) erreurs.confirmation = "Les deux mots de passe ne correspondent pas.";
  // L'acceptation des conditions d'utilisation : case décochée par défaut, revérifiée ici.
  if (donnees.get("cgu") !== "on") erreurs.cgu = "Cochez la case pour accepter les conditions d'utilisation.";
  if (Object.keys(erreurs).length > 0) return echec(erreurs);

  const tropVite = await limiter("inscription", [{ cle: "ip", regle: REGLES.inscriptionParIp }]);
  if (tropVite) return echec({ email: tropVite }, tropVite);

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return echec({ email: "Un compte existe déjà avec cette adresse. Connectez-vous." });
  }

  const passwordHash = await hacherMotDePasse(motDePasse);
  // Le compte et la preuve d'acceptation (qui, quand, quelle version) dans la même transaction.
  const [compte] = await prisma.$transaction([
    prisma.user.create({ data: { email, passwordHash }, select: { id: true } }),
    prisma.consentLog.create({ data: { email, type: "CGU", granted: true, source: `inscription:${VERSION_CGU}` } }),
  ]);

  await ouvrirSession(compte.id);
  redirect(suite);
}

/**
 * Changer (ou choisir, pour un compte qui n'en a pas encore) son mot de passe.
 * L'actuel est exigé s'il existe ; toutes les sessions sont ensuite fermées et
 * une nouvelle est ouverte ici : un appareil qui connaissait l'ancien est déconnecté.
 */
export async function changerMotDePasse(_precedent: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/compte/profil");
  const actuel = String(donnees.get("actuel") ?? "");
  const nouveau = String(donnees.get("mot_de_passe") ?? "");
  const confirmation = String(donnees.get("confirmation") ?? "");

  const tropVite = await limiter("connexion", [
    { cle: "ip", regle: REGLES.connexionParIp },
    { cle: `compte:${session.user.id}`, regle: REGLES.connexionParEmail },
  ]);
  if (tropVite) return echec({ actuel: tropVite }, tropVite);

  const compte = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (compte.passwordHash && !(await verifierMotDePasse(actuel, compte.passwordHash))) {
    return echec({ actuel: "Mot de passe actuel incorrect." });
  }
  const regle = erreurMotDePasse(nouveau);
  if (regle) return echec({ mot_de_passe: regle });
  if (confirmation !== nouveau) return echec({ confirmation: "Les deux mots de passe ne correspondent pas." });

  const passwordHash = await hacherMotDePasse(nouveau);
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: session.user.id } }),
  ]);
  await ouvrirSession(session.user.id);
  // Redirection plutôt qu'un état de formulaire : la page doit être rendue avec la nouvelle
  // session (l'ancienne vient d'être fermée), et c'est elle qui affiche la confirmation.
  redirect("/compte/profil?mot_de_passe=change");
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
  await signOut({ redirectTo: avecBase("/") });
}
