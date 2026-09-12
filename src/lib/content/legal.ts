import "server-only";
import { prisma } from "@/lib/db";

export interface IdentiteLegale {
  raisonSociale: string;
  siret: string;
  tva: string;
  adresse: string;
}

const VIDE: IdentiteLegale = { raisonSociale: "", siret: "", tva: "", adresse: "" };

/**
 * Identité légale de l'atelier, saisie depuis le CRM.
 *
 * Tant qu'un champ est vide, la page affiche « À remplir » plutôt qu'une
 * information inventée : mieux vaut un site visiblement incomplet qu'un site
 * qui ment sur son éditeur.
 */
export async function lireIdentiteLegale(): Promise<IdentiteLegale> {
  const reglage = await prisma.setting.findUnique({ where: { key: "legal.identite" } });
  const valeur = (reglage?.value ?? {}) as Partial<Record<keyof IdentiteLegale, unknown>>;

  return {
    raisonSociale: String(valeur.raisonSociale ?? "").trim(),
    siret: String(valeur.siret ?? "").trim(),
    tva: String(valeur.tva ?? "").trim(),
    adresse: String(valeur.adresse ?? "").trim(),
  } satisfies IdentiteLegale;
}

export { VIDE as IDENTITE_VIDE };
