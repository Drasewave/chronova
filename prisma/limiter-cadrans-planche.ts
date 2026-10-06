/**
 * Limite le choix de cadran à ceux de la planche de référence (octobre 2026).
 *
 * L'étape « Cadran » ne propose plus qu'un groupe, `cadran`, dont chaque option
 * est un cadran photographié complet (famille d'index, teinte, finition, métal).
 * Les anciens groupes (`cadran-teinte`, `cadran-finition`, `index`, `index-metal`,
 * `index-encre`) restent en base mais n'ont plus aucune option active et sont
 * rendus facultatifs : le configurateur les masque, et les commandes passées qui
 * y renvoient gardent leurs lignes. Les modèles d'exemple passent à un cadran de
 * la planche.
 *
 * Additif et relançable, comme les autres scripts d'ajout :
 *
 *   npx tsx prisma/limiter-cadrans-planche.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { CADRANS } from "@/lib/data/cadrans";
import { PARTS, RULES, STEPS } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const ANCIENS_GROUPES = ["cadran-teinte", "cadran-finition", "index", "index-metal", "index-encre"];

/** Anciens textes des modèles d'exemple → nouveaux (sous-chaînes, appliquées à l'accroche et au résumé). */
const TEXTES: Record<string, [string, string][]> = {
  "sentier-38": [
    ["Cadran vert, chiffres dorés appliqués, réhaut boussole, cuir chocolat.", "Chiffres romains dorés sur cadran champagne, aiguilles cathédrale, cuir chocolat."],
    [
      "Une montre de montagne : chiffres dorés appliqués aux heures paires et index en pointe sur un cadran vert soleillé, aiguilles cathédrale dorées à segments luminescents, et un réhaut boussole qu'une seconde couronne, à 4 h, fait tourner pour s'orienter au soleil.",
      "Une montre de montagne habillée : chiffres romains dorés appliqués aux heures paires et bâtons fins aux heures impaires sur un cadran champagne soleillé, aiguilles cathédrale dorées à segments luminescents, boîtier poli.",
    ],
  ],
  "soiree-37": [
    ["Cadran soleil profond bleu glacier, verre box, couronne oignon, cuir glacé.", "Chiffres romains sur cadran blanc, index or, verre box, couronne oignon, cuir glacé."],
    [
      "Un cadran bleu glacier au soleillage gaufré, qui passe du clair au presque noir quand le poignet tourne, sous un saphir box très bombé. Index bâtons facettés et aiguilles dauphine polis, sans luminova, quantième encadré à 3 h, couronne oignon et cuir glacé.",
      "Un cadran blanc à chiffres romains dorés, sous un saphir box très bombé. Aiguilles dauphine polies, sans luminova, quantième encadré à 3 h, couronne oignon et cuir glacé.",
    ],
  ],
  "rallye-41": [
    ["Cadran panda, lunette tachymètre, poussoirs à piston, trotteuse rouge.", "Cadran gris à bâtons fins, lunette tachymètre, poussoirs à piston, trotteuse rouge."],
    ["Cadran blanc cassé à compteurs noirs, lunette fixe", "Cadran gris à bâtons fins et compteurs noirs, lunette fixe"],
  ],
  "piste-39": [
    ["Double échelle 12/24 h, cadran noir mat, couronne à 4 h, NATO kaki.", "Bâtons fins sur cadran bleu, couronne à 4 h, NATO kaki."],
    [
      "douze grands chiffres luminescents doublés d'une petite échelle de 13 à 24, cadran mat sans reflet, aiguilles flèche",
      "cadran bleu à bâtons fins et minuterie fine, aiguilles flèche",
    ],
  ],
  "corail-39": [["cadran noir mat, jour-date", "cadran à chiffres romains or rose, jour-date"]],
  "abysse-40": [["aiguilles flèche et guichet jour-date.", "aiguilles flèche, cadran bleu à chiffres arabes orientaux et guichet jour-date."]],
  "lucarne-38": [
    ["Cœur ouvert sur le balancier, cadran argent soleillé, sans date, cuir glacé.", "Cœur ouvert sur le balancier, chiffres romains sur cadran bleu nuit, sans date, cuir glacé."],
    ["Cadran argent soleillé, index facettés et aiguilles dauphine, fond saphir", "Cadran bleu nuit à chiffres romains, aiguilles dauphine, fond saphir"],
  ],
  "circuit-41": [
    ["Cadran bleu nuit, compteurs clairs, lunette tachymètre, acier.", "Cadran bleu nuit à bâtons fins, compteurs clairs, lunette tachymètre, acier."],
    ["cadran bleu nuit soleillé, compteurs clairs", "cadran bleu nuit à bâtons fins, compteurs clairs"],
  ],
  "meridien-39": [["Deuxième fuseau, lunette 24 h bicolore, aiguille GMT rouge, mouvement NH34.", "Deuxième fuseau, disque 24 h, lunette 24 h bicolore, aiguille GMT rouge, mouvement NH34."]],
};

const remplace = (texte: string, paires: [string, string][]) => paires.reduce((t, [a, b]) => t.replace(a, b), texte);

async function main() {
  // 1. Une pièce de stock par cadran.
  for (const c of CADRANS) {
    const ref = `CAD-${c.key.toUpperCase()}`;
    const piece = PARTS.find((p) => p.ref === ref);
    if (!piece) throw new Error(`Pièce absente des fixtures : ${ref}`);
    if (await prisma.part.findUnique({ where: { reference: ref } })) continue;
    const fournisseur = await prisma.supplier.findUnique({ where: { name: piece.supplier } });
    const creee = await prisma.part.create({
      data: {
        reference: piece.ref,
        name: piece.name,
        category: "CADRAN",
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
      data: { partId: creee.id, type: "ENTREE", quantity: piece.quantityOnHand, reason: "Inventaire de départ (donnée d'exemple)" },
    });
    console.log(`+ pièce ${ref}`);
  }

  // 2. Le groupe `cadran` et ses options, en tête de l'étape.
  const etape = STEPS.find((e) => e.key === "cadran");
  const groupeFixture = etape?.groups.find((g) => g.key === "cadran");
  const step = await prisma.configStep.findUnique({ where: { key: "cadran" } });
  if (!etape || !groupeFixture || !step) throw new Error("Étape ou groupe `cadran` introuvable.");

  let groupe = await prisma.optionGroup.findUnique({ where: { key: "cadran" } });
  if (!groupe) {
    groupe = await prisma.optionGroup.create({
      data: { key: "cadran", stepId: step.id, label: groupeFixture.label, help: groupeFixture.help ?? null, selection: "UNIQUE", isOptional: false, sortIndex: -1 } as never,
    });
    console.log("+ groupe cadran");
  }
  for (const [rang, option] of groupeFixture.options.entries()) {
    if (await prisma.option.findUnique({ where: { groupId_key: { groupId: groupe.id, key: option.key } } })) continue;
    const piece = option.partRef ? await prisma.part.findUnique({ where: { reference: option.partRef } }) : null;
    await prisma.option.create({
      data: {
        groupId: groupe.id,
        key: option.key,
        label: option.label,
        description: option.description ?? null,
        colorName: option.colorName ?? null,
        colorHex: option.colorHex ?? null,
        priceDeltaCents: option.priceDeltaCents,
        renderPatch: (option.render ?? null) as never,
        partId: piece?.id ?? null,
        sortIndex: rang,
        isSample: true,
      } as never,
    });
    console.log(`+ option cadran:${option.key}`);
  }

  // 3. Les anciens groupes ne proposent plus rien (leurs lignes restent, inactives).
  for (const cle of ANCIENS_GROUPES) {
    const g = await prisma.optionGroup.findUnique({ where: { key: cle } });
    if (!g) continue;
    const { count } = await prisma.option.updateMany({ where: { groupId: g.id, isActive: true }, data: { isActive: false } });
    if (!g.isOptional) await prisma.optionGroup.update({ where: { id: g.id }, data: { isOptional: true } });
    if (count) console.log(`~ groupe ${cle} : ${count} option(s) désactivée(s)`);
  }

  // 4. Règles des cadrans.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));
  for (const regle of RULES) {
    if (!regle.subject.startsWith("cadran:")) continue;
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) continue;
    const kind = regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT";
    const existantes = await prisma.compatibilityRule.findMany({ where: { subjectOptionId, kind: kind as never } });
    if (existantes.some((r) => JSON.stringify([...r.targetRefs].sort()) === JSON.stringify([...regle.targets].sort()))) continue;
    await prisma.compatibilityRule.create({ data: { subjectOptionId, kind: kind as never, targetRefs: [...regle.targets], message: regle.message } });
    console.log(`+ règle ${regle.subject} → ${regle.targets.join(", ")}`);
  }

  // 5. Modèles d'exemple : un cadran de la planche, textes mis à jour s'ils sont encore d'origine.
  for (const modele of SAMPLE_MODELS) {
    const enBase = await prisma.watchModel.findFirst({ where: { slug: modele.slug, isSample: true } });
    if (!enBase) {
      console.log(`= modèle ${modele.slug} absent ou personnalisé, laissé tel quel`);
      continue;
    }
    const aplatir = (depart: Record<string, string>, voulu: Record<string, string>) => {
      const out = { ...depart };
      for (const cle of ANCIENS_GROUPES) delete out[cle];
      out.cadran = voulu.cadran as string;
      return out;
    };
    const defaut = aplatir((enBase.defaultSelections ?? {}) as Record<string, string>, modele.defaultSelections);
    const second = aplatir((enBase.altSelections ?? {}) as Record<string, string>, modele.altSelections);
    // La Sentier perdait son réhaut boussole : aucun cadran de l'atelier n'y tient.
    if (modele.slug === "sentier-38") defaut.rehaut = "aucun";

    const data: Record<string, unknown> = { defaultSelections: defaut, altSelections: second };
    const paires = TEXTES[modele.slug];
    if (paires) {
      const tagline = remplace(enBase.tagline, paires);
      const summary = remplace(enBase.summary, paires);
      if (tagline !== enBase.tagline) data.tagline = tagline;
      if (summary !== enBase.summary) data.summary = summary;
    }
    await prisma.watchModel.update({ where: { id: enBase.id }, data: data as never });
    console.log(`~ modèle ${modele.slug} → cadran ${defaut.cadran} / ${second.cadran}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
