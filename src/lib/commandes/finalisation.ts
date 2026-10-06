import "server-only";
import { prisma } from "@/lib/db";
import { envoyerCourriel } from "@/lib/email";
import { formatPrice } from "@/lib/utils";
import { confirmerPaiement } from "./creation";
import { SITE } from "@/lib/env";


/**
 * Confirme la commande puis envoie l'e-mail, sans jamais bloquer sur l'e-mail.
 *
 * Vit dans `src/lib` sous `server-only`, PAS dans un fichier `"use server"` :
 * toute fonction exportée d'un tel fichier est une action publique, appelable
 * par n'importe qui avec un identifiant de commande. « Marquer payée » ne doit
 * jamais en être une (audit A-14). Seuls le webhook Stripe (paiement vérifié) et
 * le mode démonstration l'appellent.
 */
export async function finaliser(
  orderId: string,
  options: { stripePaymentIntentId?: string | null } = {},
): Promise<{ deja: boolean }> {
  const resultat = await confirmerPaiement({
    orderId,
    stripePaymentIntentId: options.stripePaymentIntentId ?? null,
  });
  if (resultat.deja) return { deja: true };

  const commande = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: { select: { name: true } } },
  });

  const gabarit = await prisma.emailTemplate.findUnique({ where: { key: "commande.payee" } });
  const prenom = commande.user?.name?.split(" ")[0] ?? "";
  const delai = commande.promisedAt
    ? Math.max(
        1,
        Math.round((commande.promisedAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      )
    : 14;

  const corps = (gabarit?.bodyMd ?? "Votre commande {{numero}} est enregistrée.")
    .replaceAll("{{prenom}}", prenom)
    .replaceAll("{{numero}}", commande.number)
    .replaceAll("{{delai}}", String(delai));

  try {
    await envoyerCourriel({
      to: commande.email,
      subject: (gabarit?.subject ?? "Votre commande {{numero}}").replaceAll(
        "{{numero}}",
        commande.number,
      ),
      text: [
        corps,
        "",
        `Total : ${formatPrice(commande.totalCents)}`,
        `Suivi : ${SITE}/compte/commandes/${commande.number}`,
      ].join("\n"),
    });
  } catch (erreur) {
    // Un e-mail qui ne part pas ne doit pas annuler une commande payée : on
    // trace, la commande reste valide, et le CRM pourra relancer l'envoi.
    console.error("E-mail de confirmation non envoyé :", erreur);
  }

  return { deja: false };
}
