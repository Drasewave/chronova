import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Les étapes d'une commande, du point de vue du client.
 *
 * Chaque étape dit ce qui se passe réellement à l'atelier : « Pièces reçues »
 * n'est pas un statut administratif, c'est le moment où l'horloger a tout sous
 * la main et peut commencer.
 */
export interface EtapeCommande {
  statut: OrderStatus;
  label: string;
  description: string;
}

export const ETAPES_CLIENT: EtapeCommande[] = [
  {
    statut: "PAYEE",
    label: "Commande enregistrée",
    description: "Le paiement est confirmé, la configuration est figée.",
  },
  {
    statut: "PIECES_A_COMMANDER",
    label: "Pièces commandées",
    description: "Ce qui manquait à l'atelier est commandé auprès des fournisseurs.",
  },
  {
    statut: "PIECES_RECUES",
    label: "Pièces reçues",
    description: "Toutes les pièces sont arrivées et contrôlées une à une.",
  },
  {
    statut: "EN_ASSEMBLAGE",
    label: "En assemblage",
    description: "Cadran, aiguilles, emboîtage : la montre prend forme.",
  },
  {
    statut: "CONTROLE",
    label: "Contrôle",
    description: "Test d'étanchéité, puis soixante-douze heures de marche suivie.",
  },
  {
    statut: "EXPEDIEE",
    label: "Expédiée",
    description: "La montre est partie, avec sa fiche de contrôle.",
  },
  {
    statut: "LIVREE",
    label: "Livrée",
    description: "Le transporteur a remis le colis.",
  },
];

const INDEX = new Map(ETAPES_CLIENT.map((etape, index) => [etape.statut, index] as const));

export function indexEtape(statut: OrderStatus): number {
  return INDEX.get(statut) ?? -1;
}

/** Statuts qui sortent du parcours normal : ils remplacent la frise. */
export const STATUTS_HORS_PARCOURS: Partial<Record<OrderStatus, string>> = {
  EN_ATTENTE_PAIEMENT: "En attente de paiement",
  ANNULEE: "Commande annulée",
  REMBOURSEE: "Commande remboursée",
};

export function libelleStatut(statut: OrderStatus): string {
  return (
    STATUTS_HORS_PARCOURS[statut] ??
    ETAPES_CLIENT.find((etape) => etape.statut === statut)?.label ??
    statut
  );
}

const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(date: Date | null | undefined): string | undefined {
  return date ? FORMAT_DATE.format(date) : undefined;
}
