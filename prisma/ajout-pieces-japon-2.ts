/**
 * Ajout incrémental des pièces « Japon », seconde passe (septembre 2026) : lunette
 * tachymètre, loupe de quantième, verre box, couronne oignon, cuir glacé, index
 * de montagne et de terrain, index dorés, secteur rouge de l'insert de plongée,
 * demi-lunette grise du GMT, aiguille de fonction laquée, cadran argent.
 *
 * Sur le modèle de `ajout-pieces-japon.ts`, ce script est STRICTEMENT additif :
 * il crée ce qui manque (pièces de stock et leur mouvement d'entrée, groupes,
 * options, règles) et ne retouche, sur les modèles d'exemple, que les clés de
 * sélection qu'il possède — et seulement si elles valent encore ce qu'elles
 * valaient avant lui. Un libellé, un prix, un texte ou une sélection modifiés
 * depuis le CRM sont conservés. Il peut être relancé sans effet de bord.
 *
 *   npx tsx prisma/ajout-pieces-japon-2.ts
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
const NOUVELLES_PIECES = ["CAD-ARG", "IDX-MON", "LUN-TAC", "COU-OIG", "BRA-GLA", "VER-BOX", "VER-LOU"];
const NOUVEAUX_GROUPES = ["index-metal", "insert-secteur", "loupe", "aiguille-fonction-teinte"];
const NOUVELLES_OPTIONS = [
  "cadran-teinte:argent",
  "index:montagne",
  "index:terrain-24h",
  "index-metal:dore",
  "lunette-style:tachymetre",
  "insert-bicolore:gris",
  "insert-secteur:rouge",
  "couronne-signature:oignon",
  "bracelet-type:cuir-glace",
  "bracelet-teinte:glace-noir",
  "bracelet-teinte:glace-brun",
  "verre-forme:box",
  "loupe:sans",
  "loupe:avec",
  "aiguille-fonction-teinte:rouge",
];

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
 * État d'origine des modèles d'exemple, tel que l'a laissé la première passe :
 * les textes que la nouvelle configuration rend faux, les clés de sélection que
 * ce script possède avec leur valeur d'avant (`null` : clé absente), et le
 * second coloris d'avant. Rien n'est remplacé qui ne soit encore, mot pour mot,
 * dans cet état : ce qui a été réécrit depuis le CRM est laissé tel quel.
 */
interface Origine {
  textes: { tagline?: string; summary?: string; movementNote?: string };
  cles: Record<string, string | null>;
  alt: Record<string, string> | null;
}
const ORIGINE: Record<string, Origine> = {
  "abysse-40": {
    "textes": {
      "tagline": "Lunette 120 clics, insert céramique, 200 mètres.",
      "summary": "Un boîtier de plongée classique : lunette unidirectionnelle à 120 crans, couronne vissée, protège-couronne venus de matière avec le flanc. L'insert céramique garde sa teinte au soleil, contrairement à l'aluminium."
    },
    "cles": {
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "orange-plongee",
      "cadran-finition": "mat",
      "insert-matiere": "aluminium",
      "insert-teinte": "noir"
    }
  },
  "sentier-38": {
    "textes": {
      "tagline": "Chiffres arabes, réhaut boussole, cuir fauve.",
      "summary": "Une montre de montagne : chiffres arabes pleins sur un cadran vert soleillé, aiguilles cathédrale dorées à segments luminescents, et un réhaut boussole qu'une seconde couronne, à 4 h, fait tourner pour s'orienter au soleil."
    },
    "cles": {
      "finition": "brosse",
      "index": "arabes",
      "bracelet-teinte": "fauve",
      "loupe": null,
      "index-metal": null
    },
    "alt": {
      "cadran-teinte": "creme",
      "bracelet-teinte": "chocolat"
    }
  },
  "meridien-39": {
    "textes": {
      "tagline": "Deuxième fuseau, échelle 24 h, mouvement NH34.",
      "summary": "Une aiguille supplémentaire fait un tour de cadran en vingt-quatre heures et se règle indépendamment. L'échelle imprimée sur le réhaut reste lisible sans lunette tournante."
    },
    "cles": {
      "finition": "poli",
      "index": "batons",
      "aiguilles-forme": "glaive",
      "lunette-style": "cannelee",
      "couronne-signature": "signee",
      "couronne-position": "3h",
      "verre-forme": "bombe",
      "cadran-teinte": "gris-ardoise",
      "loupe": null,
      "insert-matiere": null,
      "insert-teinte": null,
      "insert-bicolore": null,
      "aiguille-fonction-teinte": null
    },
    "alt": {
      "cadran-teinte": "noir-mat",
      "cadran-finition": "mat",
      "index": "plongee",
      "aiguilles-forme": "fleche",
      "lunette-style": "gmt",
      "insert-matiere": "aluminium",
      "insert-teinte": "bleu-nuit",
      "insert-bicolore": "rouge",
      "couronne-position": "4h"
    }
  },
  "soiree-37": {
    "textes": {
      "tagline": "Cadran soleil profond bleu glacier, sans date, cuir chocolat.",
      "summary": "Le cadran reste nu : aucun guichet de date, peu de texte, des index appliqués et une minuterie fine. Le boîtier poli passe sous une manchette de chemise.",
      "movementNote": "Automatique, date masquée, fond saphir."
    },
    "cles": {
      "date": "sans",
      "couronne-signature": "signee",
      "bracelet-type": "cuir",
      "verre-forme": "bombe",
      "bracelet-teinte": "chocolat",
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "saumon",
      "aiguilles-metal": "dore",
      "couronne-metal": "dore",
      "bracelet-teinte": "cuir-noir"
    }
  },
  "rallye-41": {
    "textes": {
      "tagline": "Deux compteurs, poussoirs sur le flanc, cadran panda.",
      "summary": "Un mouvement meca-quartz entraîne la trotteuse et les deux compteurs mécaniquement depuis la couronne ; la minuterie reste au quartz, sans date. Boîtier épaissi à 41 mm pour loger le module, poussoirs de part et d'autre de la couronne."
    },
    "cles": {
      "lunette-style": "lisse",
      "couronne-signature": "signee",
      "loupe": null,
      "aiguille-fonction-teinte": null
    },
    "alt": {
      "cadran-teinte": "noir-mat",
      "compteurs": "panda",
      "bracelet-type": "caoutchouc",
      "bracelet-teinte": "caoutchouc-noir"
    }
  },
  "piste-39": {
    "textes": {
      "tagline": "Chiffres arabes, cadran noir mat, NATO marine.",
      "summary": "La version d'entrée de la ligne terrain : chiffres arabes pleins, cadran mat sans reflet et aiguilles crayon à large surface luminescente, sur un boîtier microbillé, avec une sangle NATO qui passe sous le boîtier."
    },
    "cles": {
      "index": "arabes",
      "date": "avec",
      "aiguilles-forme": "crayon",
      "couronne-position": "3h",
      "bracelet-teinte": "nato-marine",
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "gris-ardoise",
      "bracelet-teinte": "nato-sable"
    }
  },
  "corail-39": {
    "textes": {
      "tagline": "Insert céramique vert forêt, boîtier compact, 200 mètres.",
      "summary": "Le même cahier des charges que l'Abysse dans un boîtier plus discret : lunette unidirectionnelle 120 clics, insert céramique, bracelet caoutchouc vulcanisé. Je l'ai conçue pour les petits poignets, avec le même équipement de plongée."
    },
    "cles": {
      "cadran-finition": "soleille",
      "bracelet-type": "caoutchouc",
      "verre-forme": "bombe",
      "cadran-teinte": "vert-sauge",
      "insert-matiere": "ceramique",
      "insert-teinte": "vert-foret",
      "bracelet-teinte": "caoutchouc-noir",
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "noir-mat",
      "insert-teinte": "noir",
      "bracelet-type": "nato",
      "bracelet-teinte": "nato-kaki"
    }
  },
  "lucarne-38": {
    "textes": {
      "tagline": "Cœur ouvert sur le balancier, sans date, cuir chocolat.",
      "summary": "Une ouverture à 9 h laisse voir le balancier battre. Cadran crème soleillé, aiguilles glaive dorées, fond saphir : une habillée qui montre un peu de mécanique sans devenir une montre-outil."
    },
    "cles": {
      "aiguilles-forme": "glaive",
      "aiguilles-metal": "dore",
      "couronne-signature": "lisse",
      "couronne-metal": "dore",
      "bracelet-type": "cuir",
      "cadran-teinte": "creme",
      "bracelet-teinte": "chocolat",
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "gris-ardoise",
      "aiguilles-metal": "acier",
      "couronne-metal": "acier",
      "bracelet-teinte": "cuir-noir"
    }
  },
  "circuit-41": {
    "textes": {
      "tagline": "Compteurs inversés, lunette cannelée, caoutchouc bleu.",
      "summary": "Même base meca-quartz que la Rallye, dans une livrée plus sombre : cadran gris ardoise mat, compteurs inversés à haut contraste, lunette cannelée et bracelet caoutchouc bleu nuit."
    },
    "cles": {
      "cadran-finition": "mat",
      "lunette-style": "cannelee",
      "couronne-signature": "signee",
      "bracelet-type": "caoutchouc",
      "cadran-teinte": "gris-ardoise",
      "bracelet-teinte": "caoutchouc-bleu",
      "compteurs": "inverse",
      "loupe": null
    },
    "alt": {
      "cadran-teinte": "noir-mat",
      "compteurs": "panda",
      "bracelet-teinte": "caoutchouc-noir"
    }
  }
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
  //    Les options nouvelles sont en fin de groupe : aucun rang existant ne bouge.
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

  // 3. Règles portées par les nouvelles options. Une règle n'a pas de clé
  //    naturelle : on la reconnaît à son sujet, sa nature et ses cibles.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));

  for (const regle of RULES) {
    if (!NOUVELLES_OPTIONS.includes(regle.subject)) continue;
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) continue;
    const kind = regle.kind === "exige-une-de" ? "EXIGE_UNE_DE" : "EXCLUT";
    const existantes = await prisma.compatibilityRule.findMany({ where: { subjectOptionId, kind: kind as never } });
    const identique = existantes.find(
      (r) => JSON.stringify([...r.targetRefs].sort()) === JSON.stringify([...regle.targets].sort()),
    );
    if (identique) {
      console.log(`= règle ${regle.subject} → ${regle.targets.join(", ")} déjà présente`);
      continue;
    }
    await prisma.compatibilityRule.create({
      data: { subjectOptionId, kind: kind as never, targetRefs: [...regle.targets], message: regle.message },
    });
    console.log(`+ règle ${regle.subject} → ${regle.targets.join(", ")}`);
  }

  // 4. Modèles d'exemple : on ne pose que les clés que ce script possède, et
  //    seulement là où la base porte encore la valeur d'avant.
  for (const modele of SAMPLE_MODELS) {
    const origine = ORIGINE[modele.slug];
    if (!origine) continue;
    const enBase = await prisma.watchModel.findFirst({ where: { slug: modele.slug, isSample: true } });
    if (!enBase) {
      console.log(`= modèle ${modele.slug} absent ou personnalisé, laissé tel quel`);
      continue;
    }

    const actuel = (enBase.defaultSelections ?? {}) as Record<string, string>;
    const depart = { ...actuel };
    for (const [cle, avant] of Object.entries(origine.cles)) {
      const cible = modele.defaultSelections[cle];
      const enPlace = actuel[cle] ?? null;
      if (enPlace === (cible ?? null)) continue;
      if (enPlace !== avant) {
        console.log(`  · ${modele.slug} : « ${cle} » personnalisée (${enPlace}), laissée telle quelle`);
        continue;
      }
      if (cible === undefined) delete depart[cle];
      else depart[cle] = cible;
    }

    const data: Record<string, unknown> = {};
    if (trie(depart) !== trie(actuel)) data.defaultSelections = depart;

    const secondActuel = (enBase.altSelections ?? {}) as Record<string, string>;
    if (origine.alt && trie(secondActuel) === trie(origine.alt)) data.altSelections = modele.altSelections;
    else if (origine.alt && trie(secondActuel) !== trie(modele.altSelections)) {
      console.log(`  · ${modele.slug} : second coloris personnalisé, laissé tel quel`);
    }

    for (const champ of ["tagline", "summary", "movementNote"] as const) {
      const avant = origine.textes[champ];
      if (avant && enBase[champ] === avant && modele[champ] !== avant) data[champ] = modele[champ];
    }

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
