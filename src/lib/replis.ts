/**
 * Les replis « sans prestataire » (courriels écrits dans la console, paiement
 * simulé) sont-ils permis ?
 *
 * Toujours en développement. Avec un build de production, seulement si
 * `CHRONOVA_DEMO=1` le demande noir sur blanc : c'est le cas du serveur de
 * démonstration, qui tourne en `next start` pour la vitesse mais n'a ni compte
 * Resend ni compte Stripe. Un site réellement en ligne ne pose jamais cette
 * variable — et dès qu'une clé est renseignée, le repli correspondant
 * s'efface de lui-même.
 */
export function replisAutorises(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.CHRONOVA_DEMO === "1";
}
