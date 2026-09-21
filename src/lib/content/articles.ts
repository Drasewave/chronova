/**
 * Article défini devant un nom de modèle. Tous les modèles sont des montres :
 * l'article est féminin, élidé devant une voyelle ou un h muet
 * (« l'Abysse 40 », « la Soirée 37 », « l'Horizon 39 », « la Houle 40 »).
 */
const VOYELLES = "aàâäeéèêëiîïoôöuùûüyœæ";

/** Mots à h aspiré susceptibles de nommer une montre : pas d'élision devant eux. */
const H_ASPIRES = [
  "hache", "haie", "halte", "hameau", "hanche", "harpon", "hasard", "hâte", "haut", "havre",
  "héron", "héros", "hibou", "houle", "hublot", "huit", "hune", "hussard",
];

function elide(nom: string): boolean {
  const mot = nom.trim().toLocaleLowerCase("fr");
  const initiale = mot[0];
  if (!initiale) return false;
  if (VOYELLES.includes(initiale)) return true;
  if (initiale !== "h") return false;
  return !H_ASPIRES.some((aspire) => mot.startsWith(aspire));
}

/** « l'Abysse 40 », « la Corail 39 ». */
export function avecArticle(nom: string): string {
  return elide(nom) ? `l'${nom.trim()}` : `la ${nom.trim()}`;
}

/** « de l'Abysse 40 », « de la Corail 39 ». */
export function deLa(nom: string): string {
  return `de ${avecArticle(nom)}`;
}
