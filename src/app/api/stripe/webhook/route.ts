import type Stripe from "stripe";
import { stripeOuNull } from "@/lib/stripe";
import { finaliser } from "@/app/actions/paiement";
import { prisma } from "@/lib/db";

/**
 * Webhook Stripe.
 *
 * C'est la seule source de vérité du paiement : le retour du navigateur peut
 * être fermé, rejoué ou fabriqué de toutes pièces. La signature est vérifiée sur
 * le corps BRUT de la requête — c'est pourquoi on lit `request.text()` et non
 * `request.json()`.
 */
export async function POST(request: Request) {
  const stripe = stripeOuNull();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return new Response("Paiement non configuré", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Signature absente", { status: 400 });

  const brut = await request.text();

  let evenement: Stripe.Event;
  try {
    evenement = stripe.webhooks.constructEvent(brut, signature, secret);
  } catch (erreur) {
    console.error("Signature Stripe invalide :", erreur);
    return new Response("Signature invalide", { status: 400 });
  }

  if (evenement.type === "checkout.session.completed") {
    const session = evenement.data.object;
    const orderId = session.metadata?.["orderId"];
    if (orderId) {
      await finaliser(orderId);
      if (session.payment_intent) {
        await prisma.order.update({
          where: { id: orderId },
          data: { stripePaymentIntentId: String(session.payment_intent) },
        });
      }
    }
  }

  if (evenement.type === "checkout.session.expired") {
    const orderId = evenement.data.object.metadata?.["orderId"];
    if (orderId) {
      // La session a expiré sans paiement : la commande n'a jamais rien réservé,
      // on la marque annulée pour qu'elle ne traîne pas dans le CRM.
      await prisma.order.updateMany({
        where: { id: orderId, status: "EN_ATTENTE_PAIEMENT" },
        data: { status: "ANNULEE" },
      });
    }
  }

  return Response.json({ recu: true });
}
