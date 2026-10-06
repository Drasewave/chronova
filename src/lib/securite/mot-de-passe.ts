import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export { erreurMotDePasse, MOT_DE_PASSE_MAX, MOT_DE_PASSE_MIN } from "./regles-mot-de-passe";

/**
 * Mots de passe : scrypt (module crypto de Node, aucune dépendance), sel aléatoire
 * de 16 octets, empreinte de 64 octets. Format stocké : `scrypt$<sel>$<empreinte>`
 * en base64url — l'algorithme est écrit dans la valeur pour pouvoir en changer un
 * jour sans casser les comptes existants.
 */
const LONGUEUR = 64;
const COUT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function deriver(motDePasse: string, sel: Buffer): Promise<Buffer> {
  return new Promise((resoudre, rejeter) =>
    scrypt(motDePasse.normalize("NFKC"), sel, LONGUEUR, COUT, (erreur, cle) =>
      erreur ? rejeter(erreur) : resoudre(cle),
    ),
  );
}

export async function hacherMotDePasse(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  const cle = await deriver(motDePasse, sel);
  return `scrypt$${sel.toString("base64url")}$${cle.toString("base64url")}`;
}

/** Comparaison en temps constant ; une valeur illisible ne correspond à rien. */
export async function verifierMotDePasse(motDePasse: string, stocke: string | null | undefined): Promise<boolean> {
  const [algo, sel, empreinte] = String(stocke ?? "").split("$");
  if (algo !== "scrypt" || !sel || !empreinte) return false;
  const attendue = Buffer.from(empreinte, "base64url");
  const calculee = await deriver(motDePasse, Buffer.from(sel, "base64url"));
  return attendue.length === calculee.length && timingSafeEqual(attendue, calculee);
}

/**
 * Empreinte factice : quand l'adresse n'a pas de compte, on vérifie quand même
 * contre elle, pour que la réponse prenne le même temps (pas d'énumération des
 * comptes par chronométrage).
 */
export const EMPREINTE_FACTICE =
  "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);
