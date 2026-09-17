import "server-only";
import Stripe from "stripe";

/**
 * Client Stripe, créé à la demande.
 *
 * Volontairement pas d'instance au niveau du module : sans clé, l'application
 * doit pouvoir démarrer, se construire et servir tout le site vitrine. Seul le
 * paiement exige la clé, et il le dit clairement.
 */
export function stripeOuNull(): Stripe | null {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return null;
  return new Stripe(cle, { typescript: true });
}

/**
 * Le paiement peut-il être simulé ?
 *
 * Uniquement hors production, et uniquement si aucune clé n'est configurée :
 * cela permet de dérouler tout le parcours après paiement (création de la
 * commande, réservation du stock, suivi client) sans compte Stripe, sans jamais
 * pouvoir se déclencher sur un site en ligne.
 */
export function paiementSimule(): boolean {
  return !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production";
}
