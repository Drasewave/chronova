import type { WatchRender } from "@/watch/types";

/** Référence d'une option : `groupe:option`. Sert de clé partout (URL, règles, panier). */
export type OptionRef = string;

export type SelectionType = "unique" | "texte" | "mesure";

/**
 * Ce que le public a le droit de savoir du stock d'une option : un ÉTAT, et le
 * délai de réapprovisionnement quand elle est indisponible. Jamais de quantité,
 * de référence de pièce, de fournisseur ni de prix d'achat.
 */
export interface OptionStock {
  state: StockState;
  /** Renseigné seulement quand l'état est `bientot`. */
  restockDays?: number;
}

/**
 * Une option telle qu'elle peut partir dans le navigateur.
 *
 * Tout ce qui figure ici est affiché ou sert au calcul côté client (prix, délai,
 * rendu). Rien d'autre ne doit y être ajouté sans se demander si un visiteur a
 * le droit de le lire dans le source de la page.
 */
export interface CatalogueOptionPublic {
  key: string;
  label: string;
  /** Nom de la teinte, toujours affiché : on ne se fie jamais à la couleur seule. */
  colorName?: string;
  colorHex?: string;
  description?: string;
  /** Supplément par rapport au prix de base du modèle. Donnée d'exemple. */
  priceDeltaCents: number;
  /** Jours d'atelier supplémentaires : réglage, cuisson, sous-traitance. */
  leadDaysDelta?: number;
  /** Ce que l'option change dans le rendu. C'est tout le lien données → dessin. */
  render?: Partial<WatchRender>;
  /** État public du stock, calculé côté serveur par la projection publique. */
  stock?: OptionStock;
}

/** L'option complète, côté serveur : elle sait quelle pièce elle consomme. */
export interface CatalogueOption extends CatalogueOptionPublic {
  /** Référence de la pièce de stock consommée par cette option. Interne. */
  partRef?: string;
}

export interface OptionGroupPublic extends Omit<OptionGroup, "options"> {
  options: CatalogueOptionPublic[];
}

export interface StepPublic extends Omit<Step, "groups"> {
  groups: OptionGroupPublic[];
}

export interface OptionGroup {
  key: string;
  label: string;
  help?: string;
  selection: SelectionType;
  /** Un groupe facultatif peut rester vide (gravure, aiguille 24 h). */
  optional?: boolean;
  /** Longueur maximale pour un groupe `texte`. */
  maxLength?: number;
  /** Supplément appliqué dès que le champ texte est renseigné. */
  filledPriceCents?: number;
  /** Jours supplémentaires dès que le champ texte est renseigné. */
  filledLeadDays?: number;
  options: CatalogueOption[];
}

export interface Step {
  key: string;
  label: string;
  intro: string;
  groups: OptionGroup[];
}

export type RuleKind = "exige-une-de" | "exclut";

export interface CompatibilityRule {
  /** L'option contrainte. */
  subject: OptionRef;
  kind: RuleKind;
  targets: OptionRef[];
  /** Raison affichée sous l'option grisée. Jamais un message générique. */
  message: string;
  /** Désactivée depuis le CRM : la règle reste stockée mais ne s'applique plus. */
  isActive?: boolean;
}

export type PartCategory =
  | "divers"
  | "boitier"
  | "cadran"
  | "aiguilles"
  | "lunette"
  | "insert"
  | "couronne"
  | "bracelet"
  | "verre"
  | "mouvement"
  | "fond";

export interface Part {
  ref: string;
  name: string;
  category: PartCategory;
  supplier: string;
  purchasePriceCents: number;
  quantityOnHand: number;
  quantityReserved: number;
  reorderThreshold: number;
  /** Délai de réapprovisionnement annoncé par le fournisseur, en jours. */
  restockDays: number;
}

/** Ce que l'utilisateur a choisi. `groupe` → `option`, plus les champs libres. */
export type Selections = Record<string, string>;

export type StockState = "disponible" | "derniere-piece" | "bientot";

export interface OptionAvailability {
  selectable: boolean;
  stock: StockState;
  /** Renseigné seulement quand l'option n'est pas sélectionnable. */
  reason?: string;
}
