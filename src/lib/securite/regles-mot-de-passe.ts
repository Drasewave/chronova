/**
 * Règles d'un mot de passe, sans dépendance serveur : lues par le formulaire
 * (navigateur) comme par les Actions.
 */
export const MOT_DE_PASSE_MIN = 10;
export const MOT_DE_PASSE_MAX = 200;

/** Règle unique, partagée par l'inscription et le changement de mot de passe. */
export function erreurMotDePasse(motDePasse: string): string | null {
  if (motDePasse.length < MOT_DE_PASSE_MIN) return `Au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (motDePasse.length > MOT_DE_PASSE_MAX) return `Au plus ${MOT_DE_PASSE_MAX} caractères.`;
  return null;
}
