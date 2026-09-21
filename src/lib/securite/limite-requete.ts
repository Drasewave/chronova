import "server-only";
import { headers } from "next/headers";
import {
  ipDepuisEnTetes,
  messageLimite,
  verifierLimite,
  type RegleDebit,
} from "./limite-debit";

/**
 * Applique une ou plusieurs limites à l'appel en cours (action serveur ou route).
 *
 * `{ cle: "ip" }` utilise l'adresse du visiteur ; toute autre clé (e-mail,
 * identifiant de compte) est prise telle quelle. Renvoie le message à afficher si
 * l'une des limites est atteinte, sinon `null`.
 */
export async function limiter(
  action: string,
  limites: { cle: "ip" | (string & {}); regle: RegleDebit }[],
): Promise<string | null> {
  const ip = ipDepuisEnTetes(await headers());

  for (const { cle, regle } of limites) {
    const valeur = cle === "ip" ? `ip:${ip}` : cle.toLowerCase().slice(0, 200);
    const verdict = verifierLimite(`${action}|${valeur}`, regle);
    if (!verdict.ok) return messageLimite(verdict.attendreMs);
  }
  return null;
}
