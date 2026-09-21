/**
 * Ajout incrémental du calibre NH36 (septembre 2026, suite de l'audit du site).
 *
 * Vérité horlogère : dans la famille NH, le NH35 n'affiche que le quantième ;
 * c'est le NH36 qui porte un disque des jours. Le guichet « Jour et date »
 * était pourtant proposé — et monté sur trois modèles d'exemple — avec le NH35.
 * Ce script crée le calibre (pièce de stock, option, règle « le jour-date exige
 * le NH36 ») et bascule sur NH36 les modèles d'exemple qui portent le jour-date.
 *
 * Sur le modèle de `ajout-pieces-japon-2.ts`, il est STRICTEMENT additif : il
 * crée ce qui manque et ne retouche, sur les lignes existantes, que ce qui vaut
 * encore, mot pour mot, son état d'origine. Un libellé, un texte ou une
 * sélection modifiés depuis le CRM sont conservés. Rien n'est supprimé, aucune
 * commande ni aucun panier n'est touché. Il peut être relancé sans effet de bord.
 *
 *   npx tsx prisma/ajout-calibre-nh36.ts
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

/** Ce que ce script a le droit de créer — rien d'autre n'est créé. */
const NOUVELLES_PIECES = ["MOU-NH36"];
const NOUVELLES_OPTIONS = ["mouvement:nh36"];
/** Règles ajoutées : celles dont le sujet ET les cibles sont listés ici. */
const NOUVELLES_REGLES: Array<{ subject: string; targets: string[] }> = [
  { subject: "date:jour-date", targets: ["mouvement:nh36"] },
];

/**
 * Modèles d'exemple : la seule clé de sélection que ce script possède, avec sa
 * valeur d'avant, et la note de mouvement d'avant. Le calibre n'est basculé que
 * si le modèle porte bien le jour-date en base.
 */
const MODELES: Record<string, { mouvementAvant: string; movementNoteAvant: string }> = {
  "abysse-40": { mouvementAvant: "nh35", movementNoteAvant: "Automatique, 24 rubis, 41 h de réserve de marche." },
  "piste-39": { mouvementAvant: "nh35", movementNoteAvant: "Automatique, 24 rubis, 41 h de réserve de marche." },
  "corail-39": { mouvementAvant: "nh35", movementNoteAvant: "Automatique, 24 rubis, 41 h de réserve de marche." },
};

/**
 * Textes existants que les fixtures corrigent dans la même passe (« méca-quartz »
 * avec son accent, « à la potence », mention du NH36 sous le jour-date, quatre
 * automatiques au lieu de trois). Chacun n'est remplacé que s'il vaut encore
 * son état d'origine.
 */
const INTROS_AVANT: Record<string, string> = {
  aiguilles: "Je les chasse une à une au potence, puis je les vérifie à la loupe.",
  mouvement: "Trois calibres automatiques japonais, tous réparables par n'importe quel horloger.",
};
const DESCRIPTIONS_AVANT: Record<string, string> = {
  "date:jour-date": "Guichet élargi à 3 h : le jour de la semaine, en français, puis le quantième.",
  "mouvement:vk64":
    "Meca-quartz : trotteuse et compteurs entraînés mécaniquement par la couronne, minuterie à quartz. Sans date.",
};
const TEXTES_MODELES_AVANT: Record<string, { summary?: string; movementNote?: string }> = {
  "rallye-41": {
    summary:
      "Un mouvement meca-quartz entraîne la trotteuse et les deux compteurs mécaniquement depuis la couronne ; la minuterie reste au quartz, sans date. Cadran blanc cassé à compteurs noirs, lunette fixe à échelle tachymétrique, poussoirs à piston à 2 h et 4 h sur un boîtier de 41 mm.",
    movementNote: "Chronographe meca-quartz, trotteuse et compteurs mécaniques, minuterie à quartz.",
  },
  "circuit-41": {
    summary:
      "Même base meca-quartz que la Rallye, dans la livrée inverse : cadran bleu nuit soleillé, compteurs clairs à haut contraste, lunette fixe à échelle tachymétrique et bracelet acier.",
    movementNote: "Chronographe meca-quartz, trotteuse et compteurs mécaniques, minuterie à quartz.",
  },
};

const CATEGORIES: Record<string, string> = {
  boitier: "BOITIER",
  cadran: "CADRAN",
  aiguilles: "AIGUILLES",
  lunette: "LUNETTE",
  insert: "INSERT",
  couronne: "COURONNE",
  bracelet: "BRACELET",
  verre: "VERRE",
  mouvement: "MOUVEMENT",
  fond: "FOND",
  divers: "DIVERS",
};

const memesCibles = (a: readonly string[], b: readonly string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

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
        category: CATEGORIES[piece.category] ?? "DIVERS",
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

  // 2. L'option, à la place que lui donnent les fixtures : en fin de groupe,
  //    aucun rang existant ne bouge.
  for (const etape of STEPS) {
    for (const groupe of etape.groups) {
      for (const [indexOption, option] of groupe.options.entries()) {
        const ref = `${groupe.key}:${option.key}`;
        if (!NOUVELLES_OPTIONS.includes(ref)) continue;
        const group = await prisma.optionGroup.findUnique({ where: { key: groupe.key } });
        if (!group) throw new Error(`Groupe absent de la base : ${groupe.key}`);
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

  // 3. La règle. Une règle n'a pas de clé naturelle : on la reconnaît à son
  //    sujet, sa nature et ses cibles. Les exclusions existantes (NH38, VK64)
  //    restent : elles donnent au client de ces calibres la raison qui le concerne.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));

  for (const regle of RULES) {
    if (!NOUVELLES_REGLES.some((n) => n.subject === regle.subject && memesCibles(n.targets, regle.targets))) continue;
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) throw new Error(`Option sujet absente de la base : ${regle.subject}`);
    const kind = regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT";
    const existantes = await prisma.compatibilityRule.findMany({ where: { subjectOptionId, kind: kind as never } });
    if (existantes.some((r) => memesCibles(r.targetRefs, regle.targets))) {
      console.log(`= règle ${regle.subject} → ${regle.targets.join(", ")} déjà présente`);
      continue;
    }
    await prisma.compatibilityRule.create({
      data: { subjectOptionId, kind: kind as never, targetRefs: [...regle.targets], message: regle.message },
    });
    console.log(`+ règle ${regle.subject} → ${regle.targets.join(", ")}`);
  }

  // 4. Modèles d'exemple qui portent le jour-date : calibre et note de mouvement,
  //    seulement là où la base porte encore la valeur d'avant.
  for (const modele of SAMPLE_MODELS) {
    const origine = MODELES[modele.slug];
    const textesAvant = TEXTES_MODELES_AVANT[modele.slug];
    if (!origine && !textesAvant) continue;
    const enBase = await prisma.watchModel.findFirst({ where: { slug: modele.slug, isSample: true } });
    if (!enBase) {
      console.log(`= modèle ${modele.slug} absent ou personnalisé, laissé tel quel`);
      continue;
    }
    const data: Record<string, unknown> = {};

    if (origine) {
      const actuel = (enBase.defaultSelections ?? {}) as Record<string, string>;
      const cible = modele.defaultSelections["mouvement"];
      if (actuel["mouvement"] === cible) {
        // déjà basculé
      } else if (actuel["date"] !== "jour-date") {
        console.log(`  · ${modele.slug} : ne porte plus le jour-date en base, calibre laissé tel quel`);
      } else if (actuel["mouvement"] !== origine.mouvementAvant) {
        console.log(`  · ${modele.slug} : « mouvement » personnalisé (${actuel["mouvement"]}), laissé tel quel`);
      } else if (cible) {
        data.defaultSelections = { ...actuel, mouvement: cible };
      }
      // La note ne suit que si le calibre est (ou devient) le NH36.
      const calibreFinal = ((data.defaultSelections as Record<string, string> | undefined) ?? actuel)["mouvement"];
      if (calibreFinal === cible && enBase.movementNote === origine.movementNoteAvant && modele.movementNote !== origine.movementNoteAvant) {
        data.movementNote = modele.movementNote;
      }
    }

    for (const champ of ["summary", "movementNote"] as const) {
      const avant = textesAvant?.[champ];
      if (avant && enBase[champ] === avant && modele[champ] !== avant) data[champ] = modele[champ];
    }

    if (Object.keys(data).length === 0) {
      console.log(`= modèle ${modele.slug} déjà à jour`);
      continue;
    }
    await prisma.watchModel.update({ where: { id: enBase.id }, data: data as never });
    console.log(`~ modèle ${modele.slug} (${Object.keys(data).join(", ")})`);
  }

  // 5. Textes du catalogue corrigés dans la même passe, sous la même garde.
  for (const etape of STEPS) {
    const avant = INTROS_AVANT[etape.key];
    if (avant && etape.intro !== avant) {
      const { count } = await prisma.configStep.updateMany({ where: { key: etape.key, intro: avant }, data: { intro: etape.intro } });
      console.log(count ? `~ étape ${etape.key} (intro)` : `= étape ${etape.key} : intro déjà à jour ou personnalisée`);
    }
    for (const groupe of etape.groups) {
      for (const option of groupe.options) {
        const ref = `${groupe.key}:${option.key}`;
        const descriptionAvant = DESCRIPTIONS_AVANT[ref];
        if (!descriptionAvant || !option.description || option.description === descriptionAvant) continue;
        const { count } = await prisma.option.updateMany({
          where: { key: option.key, group: { key: groupe.key }, isSample: true, description: descriptionAvant },
          data: { description: option.description },
        });
        console.log(count ? `~ option ${ref} (description)` : `= option ${ref} : description déjà à jour ou personnalisée`);
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
