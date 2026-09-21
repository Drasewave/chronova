import type { BomLine } from "@/lib/configurateur/bom";

/**
 * Revalidation du stock côté serveur (audit A-13).
 *
 * L'état « De retour bientôt = non sélectionnable » n'existait que dans
 * l'interface : un lien `?c=` forgé, ou un panier resté ouvert trois semaines,
 * pouvait commander une pièce en rupture, neuf fois. Ici, on additionne ce que
 * TOUT le panier consomme (deux montres peuvent vouloir le même cadran) et on le
 * compare à ce qui est réellement libre en base au moment de créer la commande.
 *
 * Fonctions pures : le module ne lit pas la base, il se teste hors-ligne.
 */
export interface LigneAVerifier {
  modelName: string;
  quantite: number;
  bom: BomLine[];
}

export interface CompteursStock {
  quantityOnHand: number;
  quantityReserved: number;
}

export interface PieceManquante {
  ref: string;
  /** Les choix du client qui consomment cette pièce, en clair : « Abysse 40 — Cadran · Saumon ». */
  choix: string[];
  demandee: number;
  libre: number;
}

export function piecesManquantes(
  lignes: readonly LigneAVerifier[],
  stock: ReadonlyMap<string, CompteursStock>,
): PieceManquante[] {
  const besoins = new Map<string, { demandee: number; choix: Set<string> }>();

  for (const ligne of lignes) {
    for (const entree of ligne.bom) {
      const besoin = besoins.get(entree.part.ref) ?? { demandee: 0, choix: new Set<string>() };
      besoin.demandee += entree.quantity * ligne.quantite;
      besoin.choix.add(`${ligne.modelName} — ${entree.becauseOf}`);
      besoins.set(entree.part.ref, besoin);
    }
  }

  const manquantes: PieceManquante[] = [];
  for (const [ref, besoin] of besoins) {
    const compteurs = stock.get(ref);
    // Pièce inconnue en base : la nomenclature l'ignore aussi à la réservation.
    if (!compteurs) continue;
    const libre = Math.max(0, compteurs.quantityOnHand - compteurs.quantityReserved);
    if (besoin.demandee > libre) {
      manquantes.push({ ref, choix: [...besoin.choix], demandee: besoin.demandee, libre });
    }
  }
  return manquantes;
}

/**
 * Message destiné au CLIENT : il nomme ses choix, jamais la référence de la
 * pièce ni la quantité restante (données internes, voir audit A-01).
 */
export function messageIndisponibilite(manquantes: readonly PieceManquante[]): string {
  const choix = [...new Set(manquantes.flatMap((piece) => piece.choix))];
  const liste = choix.map((libelle) => `« ${libelle} »`).join(", ");
  const epuise = manquantes.every((piece) => piece.libre === 0);
  return epuise
    ? `Ce choix n'est plus disponible pour le moment : ${liste}. Modifiez la configuration depuis le panier, puis relancez le paiement. Rien n'a été débité.`
    : `Il ne reste plus assez de pièces pour la quantité demandée : ${liste}. Réduisez la quantité ou modifiez la configuration, puis relancez le paiement. Rien n'a été débité.`;
}

/** Levée par la création de commande ; `message` est affichable tel quel au client. */
export class PanierIndisponibleError extends Error {
  readonly manquantes: readonly PieceManquante[];

  constructor(manquantes: readonly PieceManquante[]) {
    super(messageIndisponibilite(manquantes));
    this.name = "PanierIndisponibleError";
    this.manquantes = manquantes;
  }
}
