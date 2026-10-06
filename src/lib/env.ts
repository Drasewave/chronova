import "server-only";

/**
 * Environnement lu et validé une seule fois, au chargement du module.
 *
 * `NEXT_PUBLIC_SITE_URL` décide de toutes les adresses absolues (métadonnées,
 * sitemap, robots, retours Stripe, liens des e-mails). Avant, huit fichiers la
 * lisaient avec deux replis différents : un oubli en production produisait des
 * liens morts sans aucune erreur.
 *
 * Variable absente ou invalide :
 * - production : erreur claire, le démarrage (ou le build) échoue ;
 * - production avec `CHRONOVA_DEMO=1` (instance de démonstration, voulue) et
 *   développement : avertissement dans le journal, et repli sur le domaine prévu.
 */
const REPLI = "https://chronova.fr";

function lireSite(): string {
  const brut = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let probleme = brut ? "" : "NEXT_PUBLIC_SITE_URL est absente";
  if (brut) {
    try {
      new URL(brut);
    } catch {
      probleme = `NEXT_PUBLIC_SITE_URL n'est pas une URL valide (« ${brut} »)`;
    }
  }
  if (!probleme) return brut as string;

  const tolere = process.env.NODE_ENV !== "production" || process.env.CHRONOVA_DEMO === "1";
  if (!tolere) throw new Error(`${probleme}. Définissez l'URL publique du site, par exemple ${REPLI}.`);
  console.warn(`[env] ${probleme} : repli sur ${REPLI}.`);
  return REPLI;
}

/** URL publique du site, sans repli par fichier. */
export const SITE = lireSite();

/** Variables sans lesquelles un serveur de production ne sert à rien. Appelée au démarrage. */
export function validerEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const manquantes = ["DATABASE_URL", "AUTH_SECRET"].filter((nom) => !process.env[nom]);
  if (manquantes.length) throw new Error(`Variables d'environnement manquantes : ${manquantes.join(", ")}.`);
}
