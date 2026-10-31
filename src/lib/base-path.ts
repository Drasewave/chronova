/**
 * Préfixe sous lequel le site est servi : `https://vps.orvanes.tech/chronova`.
 *
 * Next l'ajoute tout seul aux liens (`<Link>`), aux ressources et aux
 * `redirect()`. Il ne le fait PAS pour les adresses qu'on remet à un tiers —
 * Auth.js (retour après connexion ou déconnexion), Stripe, e-mails — : celles-ci
 * passent par `avecBase`. Une seule valeur, lue aussi par `next.config.ts`.
 */
export const BASE_PATH = "/chronova";

/** `/compte` → `/chronova/compte`. Ne double pas un préfixe déjà présent. */
export function avecBase(chemin: string): string {
  if (chemin === BASE_PATH || chemin.startsWith(`${BASE_PATH}/`)) return chemin;
  return `${BASE_PATH}${chemin === "/" ? "" : chemin}` || "/";
}
