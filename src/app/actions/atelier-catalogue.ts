"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { RuleKind } from "@/generated/prisma/enums";

async function exigerAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session.user;
}

/**
 * Le catalogue est lu par le site public, lui-même mis en cache.
 *
 * Toute écriture ici doit donc invalider les pages qui en dépendent, sinon
 * l'horloger change un prix et ne le voit nulle part.
 */
function rafraichirVitrine() {
  revalidatePath("/atelier/catalogue");
  revalidatePath("/collection", "layout");
  revalidatePath("/composer", "layout");
  revalidatePath("/", "page");
}

const centimes = (valeur: FormDataEntryValue | null) =>
  Math.round(Number(String(valeur ?? "0").replace(",", ".")) * 100);

/** Une couleur de rendu : six chiffres hexadécimaux, ou rien. */
function couleur(valeur: FormDataEntryValue | null): string | null {
  const brut = String(valeur ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(brut) ? brut.toLowerCase() : null;
}

/**
 * Modification d'une option du configurateur.
 *
 * La clé n'est pas modifiable : elle apparaît dans les liens partagés et dans
 * les configurations déjà commandées. La renommer casserait les deux.
 */
export async function enregistrerOption(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("option") ?? "");
  const piece = String(donnees.get("piece") ?? "");
  const hex = couleur(donnees.get("hex"));

  const existante = await prisma.option.findUniqueOrThrow({
    where: { id },
    select: { renderPatch: true },
  });

  // Le correctif de rendu porte la couleur : la changer d'un côté sans l'autre
  // afficherait une pastille qui ne correspond pas à la montre dessinée.
  const patch = { ...((existante.renderPatch as Record<string, unknown> | null) ?? {}) };
  if (hex) {
    for (const cle of ["dialColor", "insertColor", "strapColor"]) {
      if (cle in patch) patch[cle] = hex;
    }
  }

  await prisma.option.update({
    where: { id },
    data: {
      label: String(donnees.get("label") ?? "").trim() || undefined,
      description: String(donnees.get("description") ?? "").trim() || null,
      colorName: String(donnees.get("nomTeinte") ?? "").trim() || null,
      colorHex: hex,
      priceDeltaCents: centimes(donnees.get("supplement")),
      leadDaysDelta: Number(donnees.get("delai")) || null,
      partId: piece || null,
      isActive: donnees.get("actif") === "on",
      renderPatch: Object.keys(patch).length > 0 ? (patch as never) : undefined,
    },
  });

  rafraichirVitrine();
}

/** Active ou coupe une option sans ouvrir son formulaire. */
export async function basculerOption(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("option") ?? "");
  const option = await prisma.option.findUniqueOrThrow({ where: { id }, select: { isActive: true } });
  await prisma.option.update({ where: { id }, data: { isActive: !option.isActive } });
  rafraichirVitrine();
}

/** Intitulé et aide d'un groupe, tels qu'ils apparaissent dans le configurateur. */
export async function enregistrerGroupe(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("groupe") ?? "");

  await prisma.optionGroup.update({
    where: { id },
    data: {
      label: String(donnees.get("label") ?? "").trim() || undefined,
      help: String(donnees.get("aide") ?? "").trim() || null,
    },
  });

  rafraichirVitrine();
}

/** Titre et phrase d'introduction d'une étape. */
export async function enregistrerEtape(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("etape") ?? "");

  await prisma.configStep.update({
    where: { id },
    data: {
      label: String(donnees.get("label") ?? "").trim() || undefined,
      intro: String(donnees.get("intro") ?? "").trim() || undefined,
    },
  });

  rafraichirVitrine();
}

/** Fiche d'un modèle de base : prix, cotes, textes, publication. */
export async function enregistrerModele(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const slug = String(donnees.get("modele") ?? "");
  const nombre = (cle: string) => Number(String(donnees.get(cle) ?? "").replace(",", "."));

  await prisma.watchModel.update({
    where: { slug },
    data: {
      name: String(donnees.get("nom") ?? "").trim() || undefined,
      tagline: String(donnees.get("accroche") ?? "").trim() || undefined,
      summary: String(donnees.get("resume") ?? "").trim() || undefined,
      basePriceCents: centimes(donnees.get("prix")),
      assemblyDays: Math.max(1, Math.round(nombre("assemblage")) || 14),
      diameterMm: Math.round(nombre("diametre")) || undefined,
      lugToLugMm: nombre("corne") || undefined,
      thicknessMm: nombre("epaisseur") || undefined,
      lugWidthMm: Math.round(nombre("entrecorne")) || undefined,
      waterResistM: Math.round(nombre("etancheite")),
      movementNote: String(donnees.get("mouvement") ?? "").trim() || undefined,
      seoTitle: String(donnees.get("seoTitre") ?? "").trim() || null,
      seoDescription: String(donnees.get("seoDescription") ?? "").trim() || null,
      isPublished: donnees.get("publie") === "on",
    },
  });

  rafraichirVitrine();
  revalidatePath(`/collection/${slug}`);
}

/**
 * Règle de compatibilité.
 *
 * Le message n'est pas décoratif : c'est lui qui s'affiche sous l'option
 * grisée, et la seule chose qui explique au client pourquoi il ne peut pas
 * choisir. Une règle sans message est refusée.
 */
export async function enregistrerRegle(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("regle") ?? "");
  const sujet = String(donnees.get("sujet") ?? "");
  const message = String(donnees.get("message") ?? "").trim();
  const cibles = donnees
    .getAll("cible")
    .map(String)
    .map((c) => c.trim())
    .filter(Boolean);

  if (!message || cibles.length === 0) return;

  const donneesRegle = {
    kind: String(donnees.get("type") ?? "EXIGE_UNE_DE") as RuleKind,
    targetRefs: cibles,
    message,
    isActive: donnees.get("actif") === "on",
  };

  if (id) {
    await prisma.compatibilityRule.update({ where: { id }, data: donneesRegle });
  } else {
    await prisma.compatibilityRule.create({
      data: { ...donneesRegle, subjectOptionId: sujet },
    });
  }

  rafraichirVitrine();
  revalidatePath("/atelier/catalogue/regles");
}

/** Supprime une règle. Le configurateur cesse aussitôt de griser l'option. */
export async function supprimerRegle(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("regle") ?? "");
  await prisma.compatibilityRule.delete({ where: { id } });
  rafraichirVitrine();
  revalidatePath("/atelier/catalogue/regles");
}
