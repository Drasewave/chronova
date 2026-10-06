/**
 * Limitation de débit, en mémoire (audit A-12).
 *
 * Fenêtre glissante par clé (`action:ip`, `action:email`…). Assez pour empêcher
 * qu'un script bombarde une boîte aux lettres de liens magiques, vide le quota
 * d'e-mails ou remplisse la base de demandes.
 *
 * LIMITES, à connaître :
 * — la mémoire est celle DU PROCESSUS : un redémarrage remet les compteurs à
 *   zéro, et plusieurs instances (cluster, serverless) compteraient chacune de
 *   leur côté. Chronova tourne sur un seul processus Node : c'est suffisant
 *   aujourd'hui. Le jour où il y en a plusieurs, remplacer `Memoire` par une
 *   table Postgres ou un Redis — l'interface `verifierLimite` ne change pas ;
 * — l'adresse IP vient de `X-Forwarded-For` : elle n'est fiable que derrière un
 *   proxy qui ÉCRASE cet en-tête (nginx, Caddy…). Exposé directement, un client
 *   peut la falsifier ; c'est pourquoi les actions sensibles limitent AUSSI sur
 *   une clé que l'attaquant ne choisit pas librement (l'e-mail visé, le compte).
 *
 * Module pur (aucun import Next) : il se teste hors-ligne, horloge injectée.
 */
export interface RegleDebit {
  /** Nombre d'appels autorisés dans la fenêtre. */
  max: number;
  fenetreMs: number;
}

export interface VerdictDebit {
  ok: boolean;
  /** Temps à attendre avant le prochain appel accepté, en millisecondes. */
  attendreMs: number;
}

const TAILLE_MAX = 20_000;

/** Horodatages des appels acceptés, par clé. */
const Memoire = new Map<string, number[]>();

export function verifierLimite(cle: string, regle: RegleDebit, maintenant = Date.now()): VerdictDebit {
  const seuil = maintenant - regle.fenetreMs;
  const recents = (Memoire.get(cle) ?? []).filter((instant) => instant > seuil);

  if (recents.length >= regle.max) {
    Memoire.set(cle, recents);
    return { ok: false, attendreMs: Math.max(0, recents[0]! + regle.fenetreMs - maintenant) };
  }

  recents.push(maintenant);
  Memoire.set(cle, recents);
  if (Memoire.size > TAILLE_MAX) purger(maintenant);
  return { ok: true, attendreMs: 0 };
}

/** La mémoire ne doit pas devenir elle-même un moyen de saturer le serveur. */
function purger(maintenant: number): void {
  const UNE_HEURE = 60 * 60 * 1000;
  for (const [cle, instants] of Memoire) {
    const dernier = instants[instants.length - 1];
    if (dernier === undefined || dernier < maintenant - UNE_HEURE) Memoire.delete(cle);
  }
  // Toujours trop plein (attaque distribuée) : on repart de zéro plutôt que de grossir.
  if (Memoire.size > TAILLE_MAX) Memoire.clear();
}

/** Pour les tests. */
export function reinitialiserLimites(): void {
  Memoire.clear();
}

export function messageLimite(attendreMs: number): string {
  const minutes = Math.max(1, Math.ceil(attendreMs / 60_000));
  return `Trop de tentatives en peu de temps. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/**
 * Adresse du client : `X-Real-IP` (écrasé par le proxy de confiance), sinon la
 * DERNIÈRE valeur de `X-Forwarded-For` (celle que le proxy a ajoutée ; les
 * précédentes sont choisies par le client), sinon « inconnue ».
 */
export function ipDepuisEnTetes(enTetes: { get(nom: string): string | null }): string {
  const reelle = enTetes.get("x-real-ip")?.trim();
  const transmise = enTetes.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = reelle || transmise || "inconnue";
  // Une « IP » de 2 Ko ne doit pas servir de clé.
  return ip.slice(0, 64);
}

export const REGLES = {
  /** Connexion par mot de passe : par IP, et par compte visé (essais de mots de passe). */
  connexionParIp: { max: 10, fenetreMs: 10 * 60_000 },
  connexionParEmail: { max: 6, fenetreMs: 15 * 60_000 },
  /** Création de compte : par IP (fabrication de comptes en série). */
  inscriptionParIp: { max: 5, fenetreMs: 30 * 60_000 },
  /** Formulaires contact / pièce unique. */
  demandeParIp: { max: 5, fenetreMs: 10 * 60_000 },
  demandeParEmail: { max: 3, fenetreMs: 10 * 60_000 },
  /** Création de commande (départ au paiement). */
  commandeParIp: { max: 12, fenetreMs: 10 * 60_000 },
  commandeParCompte: { max: 8, fenetreMs: 10 * 60_000 },
} satisfies Record<string, RegleDebit>;
