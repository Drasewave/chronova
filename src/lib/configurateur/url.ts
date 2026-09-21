import type { CatalogueLecture } from "./catalogue";
import type { Selections } from "./types";

const SEPARATEUR_PAIRE = "~";
const SEPARATEUR_VALEUR = ":";
const LONGUEUR_MAX = 4000;

/** `decodeURIComponent` lève `URIError` sur une séquence `%` incomplète. */
function decoder(brut: string): string | undefined {
  try {
    return decodeURIComponent(brut);
  } catch {
    return undefined;
  }
}

/**
 * Configuration ⇄ paramètre d'URL.
 *
 * Volontairement lisible (`?c=taille:40~cadran-teinte:bleu-abysse`) plutôt que
 * compressé : un lien partagé se relit, se corrige à la main et se débogue sans
 * outil. La longueur reste très en deçà des limites d'URL.
 */
export function encodeConfig(selections: Selections): string {
  return Object.entries(selections)
    .filter(([, valeur]) => valeur !== undefined && valeur !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupe, valeur]) => `${groupe}${SEPARATEUR_VALEUR}${encodeURIComponent(valeur)}`)
    .join(SEPARATEUR_PAIRE);
}

/**
 * Tolérant par construction : une option retirée du catalogue depuis que le lien
 * a été partagé est ignorée, pas une erreur. `normalizeSelections` complètera
 * ensuite les groupes obligatoires restés vides.
 *
 * Ne lève JAMAIS d'exception, quelle que soit l'entrée (audit A-10) : un lien
 * tronqué par une messagerie (`%E0%A4%A`), un paramètre répété (tableau), une
 * valeur démesurée… La paire fautive est ignorée, le reste du lien est conservé,
 * et au pire on retombe sur la configuration de départ du modèle.
 */
export function decodeConfig(catalogue: CatalogueLecture, valeur: unknown): Selections {
  if (typeof valeur !== "string" || !valeur) return {};
  const selections: Selections = {};
  // Un lien légitime fait quelques centaines de caractères : au-delà, on ne lit pas.
  if (valeur.length > LONGUEUR_MAX) return {};

  for (const paire of valeur.split(SEPARATEUR_PAIRE)) {
    const coupure = paire.indexOf(SEPARATEUR_VALEUR);
    if (coupure <= 0) continue;

    const groupe = paire.slice(0, coupure);
    const brut = decoder(paire.slice(coupure + 1));
    if (brut === undefined) continue;
    const entree = catalogue.groupIndex.get(groupe);
    if (!entree) continue;

    if (entree.group.selection === "texte") {
      const propre = brut.slice(0, entree.group.maxLength ?? 30);
      if (propre.trim()) selections[groupe] = propre;
      continue;
    }

    if (catalogue.optionIndex.has(`${groupe}${SEPARATEUR_VALEUR}${brut}`)) selections[groupe] = brut;
  }

  return selections;
}
