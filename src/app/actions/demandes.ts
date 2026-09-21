"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";
import { REGLES } from "@/lib/securite/limite-debit";
import { limiter } from "@/lib/securite/limite-requete";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** 10 M€ : très au-dessus de toute pièce unique, très en dessous d'Int32 (21 M€ en centimes). */
const BUDGET_MAX_CENTS = 1_000_000_000;

/**
 * Réception d'une demande (contact ou pièce unique).
 *
 * La validation est refaite ici, côté serveur : les attributs `required` du
 * formulaire sont un confort d'utilisation, jamais une garantie.
 *
 * Le champ `entreprise` est un leurre : invisible et vide pour un humain, il est
 * rempli par la plupart des robots. Rempli, la demande est acceptée en apparence
 * et jetée — un robot qui reçoit une erreur réessaie, un robot qui reçoit un
 * succès passe au site suivant.
 */
export async function envoyerDemande(
  _precedent: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const leurre = String(donnees.get("entreprise") ?? "");
  if (leurre.trim()) return { statut: "succes" };

  const type = donnees.get("type") === "SUR_MESURE" ? "SUR_MESURE" : "CONTACT";
  const nom = String(donnees.get("nom") ?? "").trim();
  const email = String(donnees.get("email") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  const message = String(donnees.get("message") ?? "").trim();
  const sujet = String(donnees.get("sujet") ?? "").trim().slice(0, 80);
  const budget = String(donnees.get("budget") ?? "").trim();
  const configuration = String(donnees.get("configuration") ?? "").trim();

  const erreurs: Record<string, string> = {};
  if (nom.length < 2) erreurs["nom"] = "Indiquez le nom sous lequel vous répondre.";
  if (nom.length > 120) erreurs["nom"] = "Nom trop long : 120 caractères au maximum.";
  if (email.length > 254 || !EMAIL.test(email)) erreurs["email"] = "Cette adresse ne semble pas valide.";
  if (telephone.length > 40) erreurs["telephone"] = "Numéro trop long : 40 caractères au maximum.";
  if (budget.length > 40) erreurs["budget"] = "Indiquez un montant en euros, par exemple 2500.";
  if (configuration.length > 2000) erreurs["configuration"] = "Lien de configuration trop long.";
  if (message.length < 20) {
    erreurs["message"] = "Quelques phrases de plus aideront à vous répondre utilement.";
  }
  if (message.length > 4000) erreurs["message"] = "Message trop long : 4 000 caractères au maximum.";

  if (Object.keys(erreurs).length > 0) {
    return { statut: "erreur", message: "Le formulaire n'a pas pu être envoyé.", erreurs };
  }

  // La colonne est un entier 32 bits : un budget démesuré faisait échouer
  // l'insertion (erreur 500). Au-delà du plafond, on ne l'enregistre pas.
  const budgetBrut = budget ? Math.round(Number(budget.replace(/[^\d]/g, "")) * 100) : null;
  const budgetCents =
    budgetBrut !== null && Number.isFinite(budgetBrut) && budgetBrut > 0 && budgetBrut <= BUDGET_MAX_CENTS
      ? budgetBrut
      : null;

  // Chaque demande écrit en base, sans session : on borne (audit A-12).
  const tropVite = await limiter("demande", [
    { cle: "ip", regle: REGLES.demandeParIp },
    { cle: `email:${email}`, regle: REGLES.demandeParEmail },
  ]);
  if (tropVite) return { statut: "erreur", message: tropVite };

  // Rattachée au compte quand la personne est connectée : la demande figure
  // alors dans son export de données et suit l'effacement du compte.
  const session = await auth();

  await prisma.inquiry.create({
    data: {
      type,
      userId: session?.user?.id ?? null,
      name: nom,
      email,
      phone: telephone || null,
      // Le sujet et la configuration n'ont pas de colonne : ils voyagent dans
      // le message, pour que ce que le client a saisi arrive bien à l'atelier.
      message: [
        sujet ? `Sujet : ${sujet}` : "",
        message,
        configuration ? `Configuration de référence : ${configuration}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      budgetCents,
    },
  });

  return {
    statut: "succes",
    message:
      "Message reçu. Vous recevrez une réponse de l'atelier, pas d'un service client — comptez un à deux jours ouvrés.",
  };
}
