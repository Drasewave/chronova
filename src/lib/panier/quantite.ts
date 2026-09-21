export const QUANTITE_MIN = 1;
export const QUANTITE_MAX = 9;

/**
 * Lit une quantité saisie au clavier.
 *
 * Renvoie `undefined` tant que la saisie n'est pas un entier exploitable (champ
 * vide, « 0 », « -2 », « 1,5 », « abc ») : l'appelant ne touche alors à rien.
 * Au-delà du maximum, on borne — « 12 » devient 9, comme le fait le serveur.
 */
export function lireQuantite(saisie: string): number | undefined {
  const texte = saisie.trim();
  if (!/^\d{1,4}$/.test(texte)) return undefined;
  const valeur = Number(texte);
  if (valeur < QUANTITE_MIN) return undefined;
  return Math.min(QUANTITE_MAX, valeur);
}

/**
 * Quantité à enregistrer dans le panier : toujours un entier entre 1 et 9.
 * Une valeur invalide rend la quantité actuelle — jamais une suppression.
 */
export function bornerQuantite(demandee: number, actuelle: number): number {
  if (!Number.isFinite(demandee) || demandee < QUANTITE_MIN) return actuelle;
  return Math.min(QUANTITE_MAX, Math.floor(demandee));
}
