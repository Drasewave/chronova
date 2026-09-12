import type { InquiryStatus, CaseStatus, CaseType } from "@/generated/prisma/enums";

/** L'entonnoir d'une demande, du message reçu au dossier classé. */
export const LIBELLE_DEMANDE: Record<InquiryStatus, string> = {
  NOUVEAU: "Nouveau",
  LU: "Lu",
  EN_COURS: "En cours",
  DEVIS_ENVOYE: "Devis envoyé",
  CONVERTI: "Converti",
  CLOS: "Clos",
};

/** Seul ce qui attend une réponse est coloré. */
export const TON_DEMANDE: Record<InquiryStatus, "alerte" | "accent" | "neutre" | "positif"> = {
  NOUVEAU: "alerte",
  LU: "neutre",
  EN_COURS: "accent",
  DEVIS_ENVOYE: "accent",
  CONVERTI: "positif",
  CLOS: "neutre",
};

export const LIBELLE_DOSSIER: Record<CaseStatus, string> = {
  RECU: "Reçue à l'atelier",
  DIAGNOSTIC: "Diagnostic",
  DEVIS: "Devis à valider",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  RENVOYE: "Renvoyée",
};

export const TON_DOSSIER: Record<CaseStatus, "alerte" | "accent" | "neutre" | "positif"> = {
  RECU: "alerte",
  DIAGNOSTIC: "accent",
  DEVIS: "accent",
  EN_COURS: "accent",
  TERMINE: "positif",
  RENVOYE: "neutre",
};

export const LIBELLE_TYPE_DOSSIER: Record<CaseType, string> = {
  GARANTIE: "Garantie",
  REVISION: "Révision",
  REPARATION: "Réparation",
};
