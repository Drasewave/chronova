import "server-only";
import { Resend } from "resend";

const EXPEDITEUR = process.env.RESEND_FROM ?? "Chronova <atelier@exemple.fr>";

export interface Courriel {
  to: string;
  subject: string;
  /** Corps en texte brut : lisible partout, y compris dans les clients austères. */
  text: string;
  html?: string;
}

/**
 * Envoi d'un e-mail transactionnel.
 *
 * Sans `RESEND_API_KEY`, en développement, le message est écrit dans la console
 * du serveur : on peut ainsi suivre tout le parcours de connexion et de commande
 * sans compte chez un prestataire. En production, l'absence de clé lève une
 * erreur — un lien de connexion perdu dans des logs serait un bug silencieux.
 */
export async function envoyerCourriel(courriel: Courriel): Promise<void> {
  const cle = process.env.RESEND_API_KEY;

  if (!cle) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY manquante : impossible d'envoyer les e-mails transactionnels.");
    }
    console.info(
      [
        "",
        "┌─ COURRIEL (mode développement, non envoyé) ───────────────────",
        `│ À       : ${courriel.to}`,
        `│ Objet   : ${courriel.subject}`,
        "│",
        ...courriel.text.split("\n").map((ligne) => `│ ${ligne}`),
        "└───────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  const resend = new Resend(cle);
  const { error } = await resend.emails.send({
    from: EXPEDITEUR,
    to: courriel.to,
    subject: courriel.subject,
    text: courriel.text,
    ...(courriel.html ? { html: courriel.html } : {}),
  });

  if (error) throw new Error(`Envoi impossible : ${error.message}`);
}
