"use server";

import { revalidatePath } from "next/cache";
import { exigerAdminAction } from "@/lib/securite/acces";
import { CLE_IDENTITE, IDENTITE_VIDE } from "@/lib/content/legal";
import { prisma } from "@/lib/db";

/* Paramètres de l'atelier : délais, port, garantie, identité légale, gabarits d'e-mail. */

/* ────────────────────────────── Paramètres ───────────────────────────── */

/**
 * Réglages de l'atelier.
 *
 * Chaque valeur garde la forme qu'elle avait en base : un nombre reste un
 * nombre, un objet reste un objet dont on ne remplace que les clés éditées.
 * Le drapeau `aRemplir` disparaît dès qu'une vraie valeur est saisie — c'est
 * lui qui fait afficher « [À REMPLIR] » sur le site.
 */
function estMontant(cle: string) {
  return cle === "cents" || cle.endsWith("Cents");
}

export async function enregistrerParametres(donnees: FormData): Promise<void> {
  await exigerAdminAction();
  const reglages = await prisma.setting.findMany();

  for (const reglage of reglages) {
    const valeur = reglage.value as unknown;

    if (typeof valeur === "number") {
      const saisie = Number(String(donnees.get(reglage.key) ?? "").replace(",", "."));
      if (!Number.isFinite(saisie)) continue;
      await prisma.setting.update({ where: { key: reglage.key }, data: { value: saisie } });
      continue;
    }

    if (valeur && typeof valeur === "object") {
      const objet: Record<string, unknown> = {
        ...(reglage.key === CLE_IDENTITE ? IDENTITE_VIDE : {}),
        ...(valeur as Record<string, unknown>),
      };
      let touche = false;

      for (const cle of Object.keys(objet)) {
        if (cle === "aRemplir" || cle === "exemple") continue;
        const champ = donnees.get(`${reglage.key}.${cle}`);
        if (champ === null) continue;
        const brut = String(champ).trim();
        const nombre = Number(brut.replace(",", "."));
        // Seule une clé monétaire est stockée en centimes ; « mois » ou
        // « jours » sont des nombres ordinaires qu'il ne faut pas centupler.
        objet[cle] = estMontant(cle)
          ? Math.round(nombre * 100)
          : typeof objet[cle] === "number"
            ? Math.round(nombre)
            : brut;
        touche = true;
      }
      if (!touche) continue;

      const rempli = Object.entries(objet).some(
        ([cle, v]) => cle !== "aRemplir" && cle !== "exemple" && v !== "" && v !== 0,
      );
      if (rempli) {
        delete objet["aRemplir"];
        delete objet["exemple"];
      }
      await prisma.setting.update({ where: { key: reglage.key }, data: { value: objet as never } });
    }
  }

  revalidatePath("/atelier/parametres");
  // L'identité légale figure dans le pied de page, donc sur tout le site.
  revalidatePath("/", "layout");
}

/** Sujet et corps d'un e-mail automatique. */
export async function enregistrerGabarit(donnees: FormData): Promise<void> {
  await exigerAdminAction();
  const key = String(donnees.get("gabarit") ?? "");

  await prisma.emailTemplate.update({
    where: { key },
    data: {
      subject: String(donnees.get("sujet") ?? "").trim(),
      bodyMd: String(donnees.get("corps") ?? ""),
      isActive: donnees.get("actif") === "on",
    },
  });

  revalidatePath("/atelier/parametres");
}
