import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Forme complète du réglage `legal.identite`.
 *
 * L'ordre des clés est celui de l'écran Paramètres. Une base créée avant
 * l'ajout d'une clé ne la contient pas : le CRM et la lecture ci-dessous
 * partent donc toujours de cette forme, puis y posent ce qui est en base.
 */
export const IDENTITE_VIDE = {
  raisonSociale: "",
  siret: "",
  immatriculation: "",
  tva: "",
  adresse: "",
  email: "",
  telephone: "",
  directeurPublication: "",
  mediateurNom: "",
  mediateurAdresse: "",
  mediateurSite: "",
  identifiantRep: "",
};

export type IdentiteLegale = typeof IDENTITE_VIDE;

export const CLE_IDENTITE = "legal.identite";

/**
 * Hébergeur du site et de la base (même machine). L'entité contractante dépend
 * de la région Oracle Cloud choisie : à vérifier sur la facture ou le contrat
 * avant la mise en ligne.
 */
export const HEBERGEUR = {
  nom: "Oracle France SAS",
  adresse: "15 boulevard Charles de Gaulle, 92715 Colombes Cedex, France",
  telephone: "+33 1 57 60 20 20",
  service: "Oracle Cloud Infrastructure",
} as const;

/**
 * Identité légale de l'atelier, saisie depuis le CRM.
 *
 * Tant qu'un champ est vide, la page affiche « À remplir » plutôt qu'une
 * information inventée : mieux vaut un site visiblement incomplet qu'un site
 * qui ment sur son éditeur. Les mentions légales, les CGV, les CGU, la
 * politique de confidentialité et le pied de page lisent tous cette fonction :
 * une seule saisie, aucune incohérence possible entre les pages. `cache` : le
 * pied de page et la page la demandent dans le même rendu, une requête suffit.
 */
export const lireIdentiteLegale = cache(async (): Promise<IdentiteLegale> => {
  const reglage = await prisma.setting.findUnique({ where: { key: CLE_IDENTITE } });
  const valeur = (reglage?.value ?? {}) as Partial<Record<keyof IdentiteLegale, unknown>>;

  const identite = { ...IDENTITE_VIDE };
  for (const cle of Object.keys(IDENTITE_VIDE) as (keyof IdentiteLegale)[]) {
    identite[cle] = String(valeur[cle] ?? "").trim();
  }
  return identite;
});

/** Le médiateur n'est cité que si l'adhésion est faite : nom ET site renseignés. */
export function mediateurChoisi(identite: IdentiteLegale): boolean {
  return Boolean(identite.mediateurNom && identite.mediateurSite);
}
