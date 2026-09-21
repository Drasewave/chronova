/**
 * Ajout incrémental des pièces « Vitrine » (septembre 2026) :
 * lunette GMT 24 heures, demi-lunette de jour bicolore, index ronds de plongée.
 *
 * Contrairement à `seed.ts`, ce script n'écrase rien : il crée ce qui manque et
 * ne retouche que ce qu'il a lui-même besoin de changer (les règles d'insert,
 * élargies à la lunette GMT, et les sélections de deux modèles d'exemple). Un
 * libellé ou un prix modifié depuis le CRM est donc conservé. Il peut être
 * relancé sans effet de bord.
 *
 *   npx tsx prisma/ajout-pieces-vitrine.ts
 */
// `tsx` ne charge pas les fichiers .env : on le fait explicitement.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PARTS, RULES, STEPS } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Ce que ce script a le droit de créer — rien d'autre n'est touché. */
const NOUVELLES_PIECES = ["LUN-GMT"];
const NOUVEAUX_GROUPES = ["insert-bicolore"];
const NOUVELLES_OPTIONS = ["lunette-style:gmt", "index:plongee", "insert-bicolore:rouge", "insert-bicolore:bleu-roi"];
const MODELES_MODIFIES = ["abysse-40", "meridien-39"];

async function main() {
  // 1. La pièce de stock, avec son entrée d'inventaire : le stock est un journal.
  for (const ref of NOUVELLES_PIECES) {
    const piece = PARTS.find((p) => p.ref === ref);
    if (!piece) throw new Error(`Pièce absente des fixtures : ${ref}`);
    const existante = await prisma.part.findUnique({ where: { reference: ref } });
    if (existante) {
      console.log(`= pièce ${ref} déjà présente`);
      continue;
    }
    const fournisseur = await prisma.supplier.findUnique({ where: { name: piece.supplier } });
    const creee = await prisma.part.create({
      data: {
        reference: piece.ref,
        name: piece.name,
        category: "LUNETTE",
        supplierId: fournisseur?.id ?? null,
        purchasePriceCents: piece.purchasePriceCents,
        quantityOnHand: piece.quantityOnHand,
        quantityReserved: 0,
        reorderThreshold: piece.reorderThreshold,
        restockDays: piece.restockDays,
        isSample: true,
      } as never,
    });
    await prisma.stockMovement.create({
      data: {
        partId: creee.id,
        type: "ENTREE",
        quantity: piece.quantityOnHand,
        reason: "Inventaire de départ (donnée d'exemple)",
      },
    });
    console.log(`+ pièce ${ref}`);
  }

  // 2. Groupes et options manquants, à la place que leur donnent les fixtures.
  for (const etape of STEPS) {
    const step = await prisma.configStep.findUnique({ where: { key: etape.key } });
    if (!step) continue;

    for (const [indexGroupe, groupe] of etape.groups.entries()) {
      let group = await prisma.optionGroup.findUnique({ where: { key: groupe.key } });
      if (!group && NOUVEAUX_GROUPES.includes(groupe.key)) {
        group = await prisma.optionGroup.create({
          data: {
            key: groupe.key,
            stepId: step.id,
            label: groupe.label,
            help: groupe.help ?? null,
            selection: "UNIQUE",
            isOptional: groupe.optional ?? false,
            sortIndex: indexGroupe,
          } as never,
        });
        console.log(`+ groupe ${groupe.key}`);
      }
      if (!group) continue;

      for (const [indexOption, option] of groupe.options.entries()) {
        const ref = `${groupe.key}:${option.key}`;
        if (!NOUVELLES_OPTIONS.includes(ref)) continue;
        const existante = await prisma.option.findUnique({
          where: { groupId_key: { groupId: group.id, key: option.key } },
        });
        if (existante) {
          console.log(`= option ${ref} déjà présente`);
          continue;
        }
        const piece = option.partRef
          ? await prisma.part.findUnique({ where: { reference: option.partRef } })
          : null;
        await prisma.option.create({
          data: {
            groupId: group.id,
            key: option.key,
            label: option.label,
            description: option.description ?? null,
            colorName: option.colorName ?? null,
            colorHex: option.colorHex ?? null,
            priceDeltaCents: option.priceDeltaCents,
            leadDaysDelta: option.leadDaysDelta ?? null,
            renderPatch: (option.render ?? null) as never,
            partId: piece?.id ?? null,
            sortIndex: indexOption,
            isSample: true,
          } as never,
        });
        console.log(`+ option ${ref}`);
      }
    }
  }

  // 3. Règles : celles des nouvelles options, et l'élargissement des règles
  //    d'insert à la lunette GMT. Une règle n'a pas de clé naturelle : on la
  //    reconnaît à son sujet, sa nature et ses cibles.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));

  for (const regle of RULES) {
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) continue;
    const kind = regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT";
    const concerne =
      NOUVELLES_OPTIONS.includes(regle.subject) || regle.targets.some((t) => t === "lunette-style:gmt");
    if (!concerne) continue;

    const existantes = await prisma.compatibilityRule.findMany({ where: { subjectOptionId, kind: kind as never } });
    const identique = existantes.find(
      (r) => JSON.stringify([...r.targetRefs].sort()) === JSON.stringify([...regle.targets].sort()),
    );
    if (identique) continue;

    // L'ancienne règle d'insert ne citait que la plongée : on l'élargit en place.
    const ancienne = existantes.find(
      (r) => r.targetRefs.length === 1 && r.targetRefs[0] === "lunette-style:plongee",
    );
    if (ancienne && regle.targets.includes("lunette-style:plongee")) {
      await prisma.compatibilityRule.update({
        where: { id: ancienne.id },
        data: { targetRefs: [...regle.targets], message: regle.message },
      });
      console.log(`~ règle élargie : ${regle.subject}`);
    } else {
      await prisma.compatibilityRule.create({
        data: { subjectOptionId, kind: kind as never, targetRefs: [...regle.targets], message: regle.message },
      });
      console.log(`+ règle ${regle.subject} → ${regle.targets.join(", ")}`);
    }
  }

  // 4. Les deux modèles d'exemple qui adoptent les nouvelles pièces.
  for (const slug of MODELES_MODIFIES) {
    const modele = SAMPLE_MODELS.find((m) => m.slug === slug);
    if (!modele) continue;
    const { count } = await prisma.watchModel.updateMany({
      where: { slug, isSample: true },
      data: {
        defaultSelections: modele.defaultSelections as never,
        altSelections: modele.altSelections as never,
      },
    });
    console.log(count ? `~ modèle ${slug}` : `= modèle ${slug} absent ou personnalisé, laissé tel quel`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
