import { GROUP_INDEX, OPTION_INDEX } from "@/lib/data/catalogue";
import type { Selections } from "./types";

const SEPARATEUR_PAIRE = "~";
const SEPARATEUR_VALEUR = ":";

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
 */
export function decodeConfig(valeur: string | null | undefined): Selections {
  if (!valeur) return {};
  const selections: Selections = {};

  for (const paire of valeur.split(SEPARATEUR_PAIRE)) {
    const coupure = paire.indexOf(SEPARATEUR_VALEUR);
    if (coupure <= 0) continue;

    const groupe = paire.slice(0, coupure);
    const brut = decodeURIComponent(paire.slice(coupure + 1));
    const entree = GROUP_INDEX.get(groupe);
    if (!entree) continue;

    if (entree.group.selection === "texte") {
      const propre = brut.slice(0, entree.group.maxLength ?? 30);
      if (propre.trim()) selections[groupe] = propre;
      continue;
    }

    if (OPTION_INDEX.has(`${groupe}${SEPARATEUR_VALEUR}${brut}`)) selections[groupe] = brut;
  }

  return selections;
}
