/**
 * État partagé des formulaires.
 *
 * Volontairement hors du fichier d'action : un module « use server » ne peut
 * exporter que des fonctions asynchrones, jamais un type ni une constante.
 */
export interface EtatFormulaire {
  statut: "vide" | "succes" | "erreur";
  message?: string;
  /** Erreurs par champ, pour les rattacher au bon `aria-describedby`. */
  erreurs?: Record<string, string>;
}

export const ETAT_INITIAL: EtatFormulaire = { statut: "vide" };
