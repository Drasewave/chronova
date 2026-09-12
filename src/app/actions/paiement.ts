"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { paiementSimule, stripeOuNull } from "@/lib/stripe";
import { confirmerPaiement, creerCommandeEnAttente, type LignePanier } from "@/lib/commandes/creation";
import { envoyerCourriel } from "@/lib/email";
import { formatPrice } from "@/lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Départ vers le paiement.
 *
 * Le navigateur n'envoie que des références de configuration : tout le chiffrage
 * est refait ici. La commande est créée en attente, puis Stripe encaisse ; c'est
 * le webhook qui la confirmera, jamais le retour du navigateur — qu'un client
 * peut fermer, rejouer ou fabriquer.
 */
export async function partirAuPaiement(lignes: LignePanier[]): Promise<{ erreur: string } | never> {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/panier");

  if (!Array.isArray(lignes) || lignes.length === 0) {
    return { erreur: "Votre panier est vide." };
  }

  const adresse = await prisma.address.findFirst({
    where: { userId: session.user.id },
    orderBy: { isDefaultShipping: "desc" },
  });

  if (!adresse) {
    return {
      erreur:
        "Ajoutez d'abord une adresse de livraison dans votre compte : c'est elle qui figurera sur le colis.",
    };
  }

  const commande = await creerCommandeEnAttente({
    userId: session.user.id,
    email: session.user.email ?? "",
    lignes,
    adresse: {
      fullName: adresse.fullName,
      line1: adresse.line1,
      line2: adresse.line2,
      postalCode: adresse.postalCode,
      city: adresse.city,
      country: adresse.country,
    },
  });

  const stripe = stripeOuNull();

  if (!stripe) {
    if (!paiementSimule()) {
      return {
        erreur:
          "Le paiement n'est pas configuré sur ce site. Écrivez à l'atelier, la commande sera prise autrement.",
      };
    }

    // Démonstration hors production : on déroule la suite comme si Stripe avait
    // confirmé, pour que le suivi de commande soit réellement observable.
    await finaliser(commande.id);
    redirect(`/commande/confirmation?commande=${commande.number}&demo=1`);
  }

  const lignesStripe = await prisma.orderItem.findMany({
    where: { orderId: commande.id },
    include: { configuration: { include: { model: { select: { name: true } } } } },
  });

  const sessionStripe = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    customer_email: commande.email,
    client_reference_id: commande.number,
    metadata: { orderId: commande.id, orderNumber: commande.number },
    line_items: [
      ...lignesStripe.map((ligne) => ({
        quantity: ligne.quantity,
        price_data: {
          currency: "eur",
          unit_amount: ligne.unitPriceCents,
          product_data: {
            name: `${ligne.configuration.model.name} — configuration personnalisée`,
            description: resumeCourt(ligne.snapshot),
          },
        },
      })),
      ...(commande.shippingCents > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "eur",
                unit_amount: commande.shippingCents,
                product_data: { name: "Livraison suivie et assurée" },
              },
            },
          ]
        : []),
    ],
    success_url: `${SITE}/commande/confirmation?commande=${commande.number}`,
    cancel_url: `${SITE}/commande/interrompue?commande=${commande.number}`,
  });

  await prisma.order.update({
    where: { id: commande.id },
    data: { stripeSessionId: sessionStripe.id },
  });

  if (!sessionStripe.url) return { erreur: "Stripe n'a pas renvoyé d'adresse de paiement." };
  redirect(sessionStripe.url);
}

/** Confirme la commande puis envoie l'e-mail, sans jamais bloquer sur l'e-mail. */
export async function finaliser(orderId: string): Promise<void> {
  const resultat = await confirmerPaiement({ orderId });
  if (resultat.deja) return;

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
}

function resumeCourt(snapshot: unknown): string {
  const summary = (snapshot as { summary?: { groupKey: string; value: string }[] } | null)?.summary;
  if (!summary) return "";
  return ["cadran-teinte", "aiguilles-forme", "bracelet-type"]
    .map((cle) => summary.find((ligne) => ligne.groupKey === cle)?.value)
    .filter(Boolean)
    .join(" · ");
}
