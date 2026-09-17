"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { envoyerCourriel } from "@/lib/email";
import type { CaseStatus, InquiryStatus } from "@/generated/prisma/enums";

async function exigerAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session.user;
}

/* ─────────────────────────────── Clients ─────────────────────────────── */

/**
 * Champs de la fiche client tenus par l'atelier.
 *
 * Le nom, l'e-mail et le téléphone appartiennent au client et se modifient
 * depuis son compte : les toucher ici reviendrait à réécrire ses données à sa
 * place. L'horloger ne renseigne que ce qu'il observe — tour de poignet,
 * préférences, notes.
 */
export async function enregistrerFicheClient(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("client") ?? "");
  const poignet = Number(donnees.get("poignet"));

  await prisma.user.update({
    where: { id },
    data: {
      wristSizeMm: Number.isFinite(poignet) && poignet > 0 ? Math.round(poignet) : null,
      preferences: String(donnees.get("preferences") ?? "").trim() || null,
      crmNotes: String(donnees.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath(`/atelier/clients/${id}`);
}

/** Étiquettes d'un client : « fidèle », « presse », « à rappeler »… */
export async function changerEtiquettes(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("client") ?? "");
  const choisies = donnees.getAll("etiquette").map(String);

  await prisma.user.update({
    where: { id },
    data: { tags: { set: choisies.map((tagId) => ({ id: tagId })) } },
  });

  revalidatePath(`/atelier/clients/${id}`);
}

/** Note interne, jamais visible par le client. */
export async function ajouterNoteClient(donnees: FormData): Promise<void> {
  const admin = await exigerAdmin();
  const id = String(donnees.get("client") ?? "");
  const corps = String(donnees.get("note") ?? "").trim();
  if (!corps) return;

  await prisma.internalNote.create({ data: { userId: id, body: corps, actorId: admin.id } });
  revalidatePath(`/atelier/clients/${id}`);
}

/**
 * Effacement des données personnelles (article 17 du RGPD).
 *
 * Les commandes restent : la loi comptable impose de les conserver dix ans.
 * C'est le lien vers la personne qui est coupé — nom, e-mail, téléphone,
 * adresses, notes. L'opération est irréversible et doit rester exceptionnelle,
 * d'où la confirmation exigée dans le formulaire.
 */
export async function anonymiserClient(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("client") ?? "");
  if (String(donnees.get("confirmation") ?? "") !== "ANONYMISER") return;

  const client = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (client.role === "ADMIN") throw new Error("Un compte d'atelier ne s'anonymise pas.");

  await prisma.$transaction([
    prisma.address.deleteMany({ where: { userId: id } }),
    prisma.internalNote.deleteMany({ where: { userId: id } }),
    prisma.session.deleteMany({ where: { userId: id } }),
    prisma.user.update({
      where: { id },
      data: {
        // L'adresse reste unique en base tout en ne désignant plus personne.
        email: `anonyme+${id}@supprime.invalid`,
        name: null,
        phone: null,
        preferences: null,
        crmNotes: null,
        newsletter: false,
        anonymizedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/atelier/clients");
  revalidatePath(`/atelier/clients/${id}`);
}

/* ─────────────────────────────── Demandes ────────────────────────────── */

/**
 * Passe une demande de « nouveau » à « lu ».
 *
 * Appelée depuis l'écran ouvert, jamais pendant le rendu : le préchargement des
 * liens par Next viderait sinon la boîte de réception tout seul.
 */
export async function marquerDemandeLue(id: string): Promise<void> {
  await exigerAdmin();
  await prisma.inquiry.updateMany({
    where: { id, status: "NOUVEAU" },
    data: { status: "LU" },
  });
  revalidatePath("/atelier/demandes");
}

/** Avance une demande dans l'entonnoir, sans rien envoyer au client. */
export async function changerStatutDemande(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("demande") ?? "");
  const statut = String(donnees.get("statut") ?? "") as InquiryStatus;

  await prisma.inquiry.update({ where: { id }, data: { status: statut } });
  revalidatePath("/atelier/demandes");
  revalidatePath(`/atelier/demandes/${id}`);
}

/**
 * Réponse à une demande.
 *
 * L'e-mail part depuis l'atelier et la demande passe « en cours » : deux gestes
 * qui vont toujours ensemble, donc un seul bouton.
 */
export async function repondreDemande(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("demande") ?? "");
  const message = String(donnees.get("message") ?? "").trim();
  if (!message) return;

  const demande = await prisma.inquiry.findUniqueOrThrow({ where: { id } });

  await envoyerCourriel({
    to: demande.email,
    subject: `Votre message à l'atelier Chronova`,
    text: message,
  });

  await prisma.$transaction([
    prisma.inquiry.update({ where: { id }, data: { status: "EN_COURS" } }),
    prisma.internalNote.create({
      data: { userId: demande.userId, body: `Réponse envoyée :\n\n${message}` },
    }),
  ]);

  revalidatePath(`/atelier/demandes/${id}`);
}

/**
 * Devis à partir d'une demande sur mesure.
 *
 * Les lignes sont figées dans le devis : un changement de tarif plus tard ne
 * doit pas réécrire ce qui a été proposé au client.
 */
export async function creerDevis(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("demande") ?? "");
  const intitules = donnees.getAll("intitule").map(String);
  const montants = donnees.getAll("montant").map((m) => Number(String(m).replace(",", ".")));

  const lignes = intitules
    .map((intitule, index) => ({
      intitule: intitule.trim(),
      montantCents: Math.round((montants[index] ?? 0) * 100),
    }))
    .filter((ligne) => ligne.intitule && ligne.montantCents > 0);
  if (lignes.length === 0) return;

  const total = lignes.reduce((somme, ligne) => somme + ligne.montantCents, 0);
  const compte = await prisma.quote.count();
  const validite = Number(donnees.get("validite")) || 30;

  await prisma.$transaction([
    prisma.quote.create({
      data: {
        reference: `DEV-${new Date().getFullYear()}-${String(compte + 1).padStart(4, "0")}`,
        inquiryId: id,
        lines: lignes as never,
        totalCents: total,
        validUntil: new Date(Date.now() + validite * 24 * 60 * 60 * 1000),
        status: "BROUILLON",
      },
    }),
    prisma.inquiry.update({ where: { id }, data: { status: "DEVIS_ENVOYE" } }),
  ]);

  revalidatePath(`/atelier/demandes/${id}`);
}

/** Suit la réponse du client à un devis. */
export async function changerStatutDevis(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("devis") ?? "");
  const statut = String(donnees.get("statut") ?? "");
  if (!["ENVOYE", "ACCEPTE", "REFUSE", "EXPIRE"].includes(statut)) return;

  const devis = await prisma.quote.update({
    where: { id },
    data: { status: statut as never },
  });

  if (statut === "ACCEPTE") {
    await prisma.inquiry.update({ where: { id: devis.inquiryId }, data: { status: "CONVERTI" } });
  }

  revalidatePath(`/atelier/demandes/${devis.inquiryId}`);
}

/* ────────────────────────────── Après-vente ──────────────────────────── */

/** Ouvre un dossier : garantie, révision ou réparation. */
export async function ouvrirDossier(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const numero = String(donnees.get("commande") ?? "").trim();
  const description = String(donnees.get("description") ?? "").trim();
  if (!description) return;

  const commande = numero
    ? await prisma.order.findUnique({ where: { number: numero }, select: { id: true, userId: true } })
    : null;

  const compte = await prisma.serviceCase.count();
  await prisma.serviceCase.create({
    data: {
      reference: `SAV-${new Date().getFullYear()}-${String(compte + 1).padStart(4, "0")}`,
      type: String(donnees.get("type") ?? "REPARATION") as never,
      description,
      orderId: commande?.id ?? null,
      userId: commande?.userId ?? null,
    },
  });

  revalidatePath("/atelier/sav");
}

/** Avance un dossier et consigne ce qui a été constaté puis fait. */
export async function enregistrerDossier(donnees: FormData): Promise<void> {
  await exigerAdmin();
  const id = String(donnees.get("dossier") ?? "");
  const statut = String(donnees.get("statut") ?? "") as CaseStatus;
  const cout = Number(String(donnees.get("cout") ?? "").replace(",", "."));
  const clos = statut === "TERMINE" || statut === "RENVOYE";

  await prisma.serviceCase.update({
    where: { id },
    data: {
      status: statut,
      diagnosis: String(donnees.get("diagnostic") ?? "").trim() || null,
      resolution: String(donnees.get("resolution") ?? "").trim() || null,
      costCents: Number.isFinite(cout) && cout > 0 ? Math.round(cout * 100) : null,
      closedAt: clos ? new Date() : null,
    },
  });

  revalidatePath("/atelier/sav");
  revalidatePath("/atelier");
}

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
  await exigerAdmin();
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
      const objet = { ...(valeur as Record<string, unknown>) };
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
  revalidatePath("/mentions-legales");
  revalidatePath("/cgv");
}

/** Sujet et corps d'un e-mail automatique. */
export async function enregistrerGabarit(donnees: FormData): Promise<void> {
  await exigerAdmin();
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
