"use server";

import { prisma } from "@/lib/db";
import type { EtatFormulaire } from "@/lib/formulaires/etat";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const budget = String(donnees.get("budget") ?? "").trim();
  const configuration = String(donnees.get("configuration") ?? "").trim();

  const erreurs: Record<string, string> = {};
  if (nom.length < 2) erreurs["nom"] = "Indiquez le nom sous lequel vous répondre.";
  if (!EMAIL.test(email)) erreurs["email"] = "Cette adresse ne semble pas valide.";
  if (message.length < 20) {
    erreurs["message"] = "Quelques phrases de plus aideront à vous répondre utilement.";
  }
  if (message.length > 4000) erreurs["message"] = "Message trop long : 4 000 caractères au maximum.";

  if (Object.keys(erreurs).length > 0) {
    return { statut: "erreur", message: "Le formulaire n'a pas pu être envoyé.", erreurs };
  }

  const budgetCents = budget ? Math.round(Number(budget.replace(/[^\d]/g, "")) * 100) : null;

  await prisma.inquiry.create({
    data: {
      type,
      name: nom,
      email,
      phone: telephone || null,
      message: configuration ? `${message}\n\nConfiguration de référence : ${configuration}` : message,
      budgetCents: Number.isFinite(budgetCents) ? budgetCents : null,
    },
  });

  return {
    statut: "succes",
    message:
      "Message reçu. Vous recevrez une réponse de l'atelier, pas d'un service client — comptez un à deux jours ouvrés.",
  };
}
