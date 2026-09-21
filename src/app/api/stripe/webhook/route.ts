import type Stripe from "stripe";
import { stripeOuNull } from "@/lib/stripe";
import { finaliser } from "@/lib/commandes/finalisation";
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

  switch (evenement.type) {
    /**
     * `completed` veut dire « le client a terminé le parcours Checkout », PAS
     * « l'argent est là » : avec un moyen de paiement différé (virement, SEPA),
     * la session se termine en `unpaid` et le résultat arrive plus tard par
     * `async_payment_succeeded` / `async_payment_failed`. On ne confirme donc que
     * sur `payment_status === "paid"` (audit A-14).
     */
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await surSessionPayee(evenement.data.object, evenement.type);
      break;

    case "checkout.session.async_payment_failed":
      await annulerSiEnAttente(evenement.data.object, "Paiement différé refusé par la banque.");
      break;

    case "checkout.session.expired":
      // La session a expiré sans paiement : la commande n'a jamais rien réservé,
      // on la marque annulée pour qu'elle ne traîne pas dans le CRM.
      await annulerSiEnAttente(evenement.data.object, null);
      break;

    default:
      break;
  }

  return Response.json({ recu: true });
}

async function surSessionPayee(session: Stripe.Checkout.Session, type: string): Promise<void> {
  const orderId = session.metadata?.["orderId"];
  if (!orderId) return;

  if (session.payment_status !== "paid") {
    // `unpaid` : paiement différé en cours, on attend l'évènement asynchrone.
    // `no_payment_required` : aucune commande Chronova n'est gratuite, on ne
    // confirme pas non plus. Dans les deux cas la commande reste en attente.
    console.warn(`Stripe ${type} sans paiement (${session.payment_status}) pour la commande ${orderId} : non confirmée.`);
    return;
  }

  const commande = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, number: true, status: true, totalCents: true, currency: true },
  });
  if (!commande) {
    // Répondre 200 : une commande inconnue ne le sera pas davantage au 10e essai.
    console.error(`Stripe ${type} : commande ${orderId} introuvable.`);
    return;
  }

  // Le montant encaissé doit être celui que le serveur a chiffré. Un écart ne
  // doit jamais arriver (c'est nous qui créons la session) ; s'il arrive, on ne
  // lance pas l'assemblage : note interne, et l'horloger tranche.
  const montantOk =
    session.amount_total === commande.totalCents &&
    (session.currency ?? "").toLowerCase() === commande.currency.toLowerCase();
  if (!montantOk) {
    console.error(
      `Stripe ${type} : montant inattendu pour ${commande.number} (${session.amount_total} ${session.currency}, attendu ${commande.totalCents} ${commande.currency}).`,
    );
    if (commande.status === "EN_ATTENTE_PAIEMENT") {
      await prisma.orderEvent.create({
        data: {
          orderId: commande.id,
          toStatus: commande.status,
          isPublic: false,
          note: `Paiement Stripe reçu mais montant inattendu : ${session.amount_total} ${session.currency} au lieu de ${commande.totalCents} ${commande.currency}. Commande NON confirmée, à vérifier dans Stripe (session ${session.id}).`,
        },
      });
    }
    return;
  }

  // Idempotent : une seconde livraison du même évènement ne réserve rien de plus
  // (bascule de statut conditionnelle en tête de transaction, voir `confirmerPaiement`).
  await finaliser(commande.id, {
    stripePaymentIntentId: session.payment_intent ? String(idDe(session.payment_intent)) : null,
  });
}

async function annulerSiEnAttente(session: Stripe.Checkout.Session, note: string | null): Promise<void> {
  const orderId = session.metadata?.["orderId"];
  if (!orderId) return;

  const annulee = await prisma.order.updateMany({
    where: { id: orderId, status: "EN_ATTENTE_PAIEMENT" },
    data: { status: "ANNULEE" },
  });
  if (annulee.count > 0 && note) {
    await prisma.orderEvent.create({
      data: { orderId, fromStatus: "EN_ATTENTE_PAIEMENT", toStatus: "ANNULEE", isPublic: false, note },
    });
  }
}

/** `payment_intent` est un identifiant, ou l'objet développé. */
function idDe(valeur: string | { id: string }): string {
  return typeof valeur === "string" ? valeur : valeur.id;
}
