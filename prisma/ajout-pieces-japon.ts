/**
 * Ajout incrémental des pièces « Japon » (septembre 2026) : aiguilles flèche,
 * dauphine et cathédrale, carrure coussin, couronne à 4 h, guichet jour-date,
 * cadran soleil profond, réhaut boussole, trois teintes de cadran.
 *
 * Sur le modèle de `ajout-pieces-vitrine.ts`, ce script est STRICTEMENT additif :
 * il crée ce qui manque et ne retouche que ce qu'il a lui-même besoin de
 * changer — la règle de diamètre de la lunette de plongée, élargie au 39 mm
 * (la Corail 39 la porte), et, sur les modèles d'exemple, les seules clés de
 * sélection qu'il possède. Un libellé, un prix ou un texte modifié depuis le CRM
 * est conservé. Il peut être relancé sans effet de bord.
 *
 *   npx tsx prisma/ajout-pieces-japon.ts
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
const NOUVELLES_PIECES = ["CAD-MON", "CAD-GLA", "CAD-ORA", "REH-BOU", "AIG-FLE", "AIG-DAU", "AIG-CAT"];
const NOUVEAUX_GROUPES = ["boitier-forme", "rehaut", "couronne-position"];
const NOUVELLES_OPTIONS = [
  "boitier-forme:rond",
  "boitier-forme:coussin",
  "cadran-teinte:vert-montagne",
  "cadran-teinte:bleu-glacier",
  "cadran-teinte:orange-plongee",
  "cadran-finition:soleil-profond",
  "date:jour-date",
  "rehaut:aucun",
  "rehaut:boussole",
  "aiguilles-forme:fleche",
  "aiguilles-forme:dauphine",
  "aiguilles-forme:cathedrale",
  "couronne-position:3h",
  "couronne-position:4h",
];
/** Règles nouvelles portées par une option qui existait déjà. */
const REGLES_SUR_EXISTANT = ["date:avec→mouvement:vk64"];

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

/**
 * Clés de sélection que ce script possède, par modèle d'exemple. Toute autre
 * clé de la configuration de départ est laissée comme elle est en base.
 */
const CLES_COMMUNES = ["couronne-position", "boitier-forme", "rehaut"];
const CLES_PAR_MODELE: Record<string, string[]> = {
  "abysse-40": ["date", "aiguilles-forme", "couronne-signature"],
  "sentier-38": ["finition", "cadran-teinte", "cadran-finition", "aiguilles-forme", "aiguilles-metal", "verre-forme"],
  "meridien-39": [],
  "soiree-37": ["cadran-teinte", "cadran-finition", "aiguilles-forme", "aiguilles-metal"],
  "rallye-41": ["cadran-teinte", "aiguilles-forme", "lunette-style", "bracelet-type", "bracelet-teinte", "compteurs"],
  "piste-39": [],
  "corail-39": ["index", "date", "aiguilles-forme", "couronne-signature"],
  "lucarne-38": [],
  "circuit-41": ["aiguilles-forme"],
};
/** Modèles dont le second coloris change. */
const SECOND_COLORIS = ["abysse-40", "sentier-38", "meridien-39", "rallye-41"];

/**
 * Textes qu'une nouvelle configuration rendrait faux. Ils ne sont remplacés que
 * s'ils sont encore, mot pour mot, ceux d'origine : un texte réécrit depuis le
 * CRM est laissé tel quel.
 */
const TEXTES_D_ORIGINE: Record<string, { tagline?: string; summary?: string }> = {
  "sentier-38": {
    tagline: "Chiffres arabes, cadran mat, cuir fauve.",
    summary:
      "Une montre de terrain lisible en plein soleil comme dans la pénombre : chiffres arabes pleins, cadran mat sans reflet, aiguilles crayon à large surface luminescente. Le boîtier est microbillé pour ne pas accrocher le soleil.",
  },
  "soiree-37": { tagline: "Cadran émail crème, sans date, cuir chocolat." },
  "piste-39": {
    summary:
      "La version d'entrée de la ligne terrain : mêmes chiffres pleins et mêmes aiguilles crayon à large surface luminescente que la Sentier, sur un boîtier un peu plus compact, avec une sangle NATO qui passe sous le boîtier.",
  },
};

const trie = (objet: Record<string, string>) => JSON.stringify(Object.entries(objet).sort(([a], [b]) => a.localeCompare(b)));

async function main() {
  // 1. Les pièces de stock, avec leur entrée d'inventaire : le stock est un journal.
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

  // 2. Groupes et options manquants, à la place que leur donnent les fixtures.
  //    Les nouveautés sont toujours en fin de groupe : aucun rang existant ne bouge.
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

  // 3. Règles : celles des nouvelles options, l'exclusion date/VK64 qui manquait,
  //    et l'élargissement au 39 mm de la lunette de plongée. Une règle n'a pas de
  //    clé naturelle : on la reconnaît à son sujet, sa nature et ses cibles.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));

  for (const regle of RULES) {
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) continue;
    const kind = regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT";
    const elargie = regle.subject === "lunette-style:plongee" && regle.targets.includes("taille:39");
    const concerne =
      elargie ||
      NOUVELLES_OPTIONS.includes(regle.subject) ||
      regle.targets.some((cible) => REGLES_SUR_EXISTANT.includes(`${regle.subject}→${cible}`));
    if (!concerne) continue;

    const existantes = await prisma.compatibilityRule.findMany({ where: { subjectOptionId, kind: kind as never } });
    const identique = existantes.find(
      (r) => JSON.stringify([...r.targetRefs].sort()) === JSON.stringify([...regle.targets].sort()),
    );
    if (identique) {
      console.log(`= règle ${regle.subject} → ${regle.targets.join(", ")} déjà présente`);
      continue;
    }

    // L'ancienne règle de diamètre ne citait que le 40 mm : on l'élargit en place.
    const ancienne = elargie
      ? existantes.find((r) => r.targetRefs.length === 1 && r.targetRefs[0] === "taille:40")
      : undefined;
    if (ancienne) {
      await prisma.compatibilityRule.update({
        where: { id: ancienne.id },
        data: { targetRefs: [...regle.targets], message: regle.message },
      });
      console.log(`~ règle élargie : ${regle.subject} → ${regle.targets.join(", ")}`);
    } else if (elargie) {
      console.log(`= règle de diamètre de ${regle.subject} personnalisée, laissée telle quelle`);
    } else {
      await prisma.compatibilityRule.create({
        data: { subjectOptionId, kind: kind as never, targetRefs: [...regle.targets], message: regle.message },
      });
      console.log(`+ règle ${regle.subject} → ${regle.targets.join(", ")}`);
    }
  }

  // 4. Modèles d'exemple : on ne pose que les clés que ce script possède, le
  //    reste de la configuration de départ reste celui de la base.
  for (const modele of SAMPLE_MODELS) {
    const cles = CLES_PAR_MODELE[modele.slug];
    if (!cles) continue;
    const enBase = await prisma.watchModel.findFirst({ where: { slug: modele.slug, isSample: true } });
    if (!enBase) {
      console.log(`= modèle ${modele.slug} absent ou personnalisé, laissé tel quel`);
      continue;
    }

    const depart = { ...((enBase.defaultSelections ?? {}) as Record<string, string>) };
    for (const cle of [...CLES_COMMUNES, ...cles]) {
      const valeur = modele.defaultSelections[cle];
      if (valeur === undefined) delete depart[cle];
      else depart[cle] = valeur;
    }
    const second = SECOND_COLORIS.includes(modele.slug)
      ? modele.altSelections
      : ((enBase.altSelections ?? {}) as Record<string, string>);

    const data: Record<string, unknown> = {};
    if (trie(depart) !== trie((enBase.defaultSelections ?? {}) as Record<string, string>)) data.defaultSelections = depart;
    if (trie(second) !== trie((enBase.altSelections ?? {}) as Record<string, string>)) data.altSelections = second;

    const origine = TEXTES_D_ORIGINE[modele.slug];
    if (origine?.tagline && enBase.tagline === origine.tagline && modele.tagline !== origine.tagline) data.tagline = modele.tagline;
    if (origine?.summary && enBase.summary === origine.summary && modele.summary !== origine.summary) data.summary = modele.summary;

    if (Object.keys(data).length === 0) {
      console.log(`= modèle ${modele.slug} déjà à jour`);
      continue;
    }
    await prisma.watchModel.update({ where: { id: enBase.id }, data: data as never });
    console.log(`~ modèle ${modele.slug} (${Object.keys(data).join(", ")})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
