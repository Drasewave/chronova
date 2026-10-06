import { describe, expect, it } from "vitest";
import { SAMPLE_MODELS, getSampleModel, excludedOptionsFor } from "@/lib/data/models";
import { SAMPLE_CATALOGUE as catalogue } from "@/lib/data/catalogue";
import { buildConfiguration, defaultConfiguration, prixAPartirDeCents, prixPlancherCents } from "./configuration";
import { buildBom, partsCost } from "./bom";
import { computeLeadTime, computePrice } from "./price";
import { evaluateOption, isGroupVisible, normalizeSelections } from "./rules";
import { resolveRender } from "./resolve";
import { resolveStockState, restockMessage } from "./stock";
import { decodeConfig, encodeConfig } from "./url";
import type { Selections } from "./types";

const abysse = getSampleModel("abysse-40")!;
const meridien = getSampleModel("meridien-39")!;
const soiree = getSampleModel("soiree-37")!;

describe("prix", () => {
  it("additionne le prix de base et les suppléments choisis", () => {
    const prix = computePrice(catalogue, 100000, { finition: "poli", "aiguilles-metal": "dore" });
    expect(prix.baseCents).toBe(100000);
    expect(prix.totalCents).toBe(100000 + 4000 + 5000);
    expect(prix.lines).toHaveLength(2);
  });

  it("ne liste que les choix qui coûtent quelque chose", () => {
    const prix = computePrice(catalogue, 100000, { finition: "brosse", date: "avec" });
    expect(prix.lines).toHaveLength(0);
    expect(prix.totalCents).toBe(100000);
  });

  it("ne facture la gravure que si le texte est renseigné", () => {
    expect(computePrice(catalogue, 100000, { gravure: "   " }).totalCents).toBe(100000);
    expect(computePrice(catalogue, 100000, { gravure: "Pour Camille" }).totalCents).toBe(104500);
  });

  it("reste en centimes entiers après une longue configuration", () => {
    const total = defaultConfiguration(catalogue, meridien).price.totalCents;
    expect(Number.isInteger(total)).toBe(true);
  });
});

describe("délai d'assemblage", () => {
  it("part du délai du modèle et nomme ce qui l'allonge", () => {
    const delai = computeLeadTime(catalogue, 14, { mouvement: "nh34", gravure: "M.L." });
    expect(delai.days).toBe(14 + 3 + 4);
    expect(delai.reasons.map((r) => r.days).reduce((a, b) => a + b, 0)).toBe(7);
  });

  it("n'ajoute rien quand aucune option ne demande de travail supplémentaire", () => {
    expect(computeLeadTime(catalogue, 14, { finition: "brosse" }).days).toBe(14);
  });
});

describe("règles de compatibilité", () => {
  it("la lunette de plongée exige un boîtier de 40 mm", () => {
    const verdict = evaluateOption(catalogue, "lunette-style:plongee", { taille: "38", "couronne-vissee": "vissee" });
    expect(verdict.selectable).toBe(false);
    expect(verdict.reason).toContain("40 mm");
  });

  it("la lunette de plongée exige aussi une couronne vissée", () => {
    const verdict = evaluateOption(catalogue, "lunette-style:plongee", { taille: "40", "couronne-vissee": "poussoir" });
    expect(verdict.selectable).toBe(false);
    expect(verdict.reason).toContain("couronne vissée");
  });

  it("l'aiguille 24 h nécessite le mouvement GMT", () => {
    expect(evaluateOption(catalogue, "aiguille-24h:fleche", { mouvement: "nh35" })).toMatchObject({
      selectable: false,
      reason: "Nécessite le mouvement GMT NH34.",
    });
    expect(evaluateOption(catalogue, "aiguille-24h:fleche", { mouvement: "nh34" }).selectable).toBe(true);
  });

  it("le NH38 exclut le guichet de date", () => {
    expect(evaluateOption(catalogue, "date:avec", { mouvement: "nh38" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "date:avec", { mouvement: "nh35" }).selectable).toBe(true);
  });

  it("une teinte de cuir n'est proposée que sur un bracelet cuir", () => {
    expect(evaluateOption(catalogue, "bracelet-teinte:fauve", { "bracelet-type": "nato" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "bracelet-teinte:fauve", { "bracelet-type": "cuir" }).selectable).toBe(true);
  });

  it("le disque 24 heures ne se pose pas sous un guichet jour-date élargi", () => {
    expect(evaluateOption(catalogue, "cadran:sky-noir-or", { date: "jour-date" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "cadran:sky-noir-or", { date: "avec" }).selectable).toBe(true);
  });

  it("le réhaut boussole resserre les index : aucun cadran de l'atelier ne s'y pose", () => {
    expect(evaluateOption(catalogue, "cadran:romains-or-rose", { rehaut: "boussole" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "cadran:romains-or-rose", { rehaut: "aucun" }).selectable).toBe(true);
  });

  it("le jour-date suit le quantième : ni NH38 ni VK64", () => {
    expect(evaluateOption(catalogue, "date:jour-date", { mouvement: "nh38" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "date:jour-date", { mouvement: "vk64" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "date:avec", { mouvement: "vk64" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "date:jour-date", { mouvement: "nh36" }).selectable).toBe(true);
  });

  it("le jour-date exige le NH36 : NH35 et NH34 n'ont que le quantième", () => {
    for (const calibre of ["nh35", "nh34"]) {
      const verdict = evaluateOption(catalogue, "date:jour-date", { mouvement: calibre });
      expect(verdict.selectable).toBe(false);
      expect(verdict.reason).toContain("NH36");
    }
    // NH38 et VK64 gardent leur propre raison : ils n'ont pas de quantième du tout.
    expect(evaluateOption(catalogue, "date:jour-date", { mouvement: "nh38" }).reason).toContain("NH38");
    expect(evaluateOption(catalogue, "date:jour-date", { mouvement: "vk64" }).reason).toContain("VK64");
    // Le NH36 accepte aussi un quantième seul (disque des jours masqué) ou un cadran sans date.
    expect(evaluateOption(catalogue, "date:avec", { mouvement: "nh36" }).selectable).toBe(true);
    expect(evaluateOption(catalogue, "date:sans", { mouvement: "nh36" }).selectable).toBe(true);
  });

  it("quitter le NH36 ramène le guichet au quantième seul, et le rendu suit", () => {
    const depart = { ...abysse.defaultSelections };
    expect(depart.mouvement).toBe("nh36");
    const apres = normalizeSelections(catalogue, { ...depart, mouvement: "nh35" });
    expect(apres.date).toBe("avec");
    expect(resolveRender(catalogue, depart)).toMatchObject({ movement: "NH36", dateWindow: "jour-date" });
    expect(resolveRender(catalogue, apres).movement).toBe("NH35");
  });

  it("aucun modèle d'exemple n'affiche le jour sans le calibre qui le donne", () => {
    for (const modele of SAMPLE_MODELS) {
      for (const selections of [modele.defaultSelections, { ...modele.defaultSelections, ...modele.altSelections }]) {
        if (selections.date === "jour-date") expect(selections.mouvement, modele.slug).toBe("nh36");
      }
    }
  });

  it("la carrure coussin n'existe qu'en 40 mm", () => {
    expect(evaluateOption(catalogue, "boitier-forme:coussin", { taille: "39" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "boitier-forme:coussin", { taille: "40" }).selectable).toBe(true);
  });

  it("le réhaut boussole garde 4 h pour sa couronne", () => {
    expect(evaluateOption(catalogue, "rehaut:boussole", { "couronne-position": "4h" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "rehaut:boussole", { "couronne-position": "3h" }).selectable).toBe(true);
    expect(evaluateOption(catalogue, "couronne-position:4h", { mouvement: "vk64" }).selectable).toBe(false);
  });

  it("un modèle n'offre que ses propres diamètres", () => {
    const exclus = excludedOptionsFor(abysse);
    expect(evaluateOption(catalogue, "taille:38", {}, exclus).selectable).toBe(false);
    expect(evaluateOption(catalogue, "taille:40", {}, exclus).selectable).toBe(true);
  });
});

describe("remise d'aplomb après un changement", () => {
  it("repasser la lunette en lisse retire l'insert", () => {
    const avant: Selections = {
      taille: "40",
      "couronne-vissee": "vissee",
      "lunette-style": "plongee",
      "insert-matiere": "ceramique",
      "insert-teinte": "bleu-nuit",
    };
    const apres = normalizeSelections(catalogue, { ...avant, "lunette-style": "lisse" });
    expect(apres["insert-matiere"]).toBeUndefined();
    expect(apres["insert-teinte"]).toBeUndefined();
  });

  it("choisir le NH38 bascule le cadran sans date", () => {
    const apres = normalizeSelections(catalogue, { date: "avec", mouvement: "nh38" });
    expect(apres["date"]).toBe("sans");
  });

  it("changer de type de bracelet réajuste la teinte", () => {
    const apres = normalizeSelections(catalogue, { "bracelet-type": "nato", "bracelet-teinte": "fauve" });
    expect(apres["bracelet-teinte"]).not.toBe("fauve");
    expect(evaluateOption(catalogue, `bracelet-teinte:${apres["bracelet-teinte"]}`, apres).selectable).toBe(true);
  });

  it("laisse une configuration déjà valide intacte", () => {
    const depart = defaultConfiguration(catalogue, abysse).selections;
    expect(normalizeSelections(catalogue, depart, excludedOptionsFor(abysse))).toEqual(depart);
  });

  it("masque les groupes facultatifs sans aucune option possible", () => {
    expect(isGroupVisible(catalogue, "insert-matiere", { "lunette-style": "lisse" })).toBe(false);
    expect(isGroupVisible(catalogue, "insert-matiere", { "lunette-style": "plongee" })).toBe(true);
    expect(isGroupVisible(catalogue, "aiguille-24h", { mouvement: "nh35" })).toBe(false);
  });
});

describe("stock", () => {
  it("signale une référence épuisée", () => {
    expect(resolveStockState(catalogue, "INS-VER")).toBe("bientot");
    expect(restockMessage(catalogue, "INS-VER")).toContain("38 jours");
  });

  it("signale une dernière pièce", () => {
    expect(resolveStockState(catalogue, "CAD-ROMAINS-OR-ROSE")).toBe("derniere-piece");
  });

  it("compte le réservé comme indisponible", () => {
    expect(resolveStockState(catalogue, "BRA-CAO")).toBe("bientot");
  });

  it("ne bloque rien quand l'option ne consomme aucune pièce", () => {
    expect(resolveStockState(catalogue, undefined)).toBe("disponible");
  });
});

describe("nomenclature", () => {
  it("traduit une configuration en pièces à sortir du stock", () => {
    const bom = buildBom(catalogue, abysse.defaultSelections);
    const refs = bom.map((ligne) => ligne.part.ref);
    expect(refs).toContain("BOI-40");
    expect(refs).toContain("CAD-ARABES-CHAPITRE-BLEU");
    expect(refs).toContain("MOU-NH36");
    expect(refs).toContain("LUN-PLO");
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("chaque ligne rappelle le choix client qui l'a provoquée", () => {
    const ligne = buildBom(catalogue, abysse.defaultSelections).find((l) => l.part.ref === "CAD-ARABES-CHAPITRE-BLEU");
    expect(ligne?.becauseOf).toContain("Bleu");
  });

  it("le coût des pièces reste bien en dessous du prix de vente", () => {
    const config = defaultConfiguration(catalogue, abysse);
    expect(config.partsCostCents).toBeGreaterThan(0);
    expect(config.partsCostCents).toBeLessThan(config.price.totalCents);
  });
});

describe("configuration dans l'URL", () => {
  it("fait un aller-retour sans perte", () => {
    const depart = defaultConfiguration(catalogue, meridien).selections;
    expect(decodeConfig(catalogue, encodeConfig(depart))).toEqual(depart);
  });

  it("conserve le texte de gravure, espaces et accents compris", () => {
    const encode = encodeConfig({ gravure: "À Camille, 12 juin" });
    expect(decodeConfig(catalogue, encode)["gravure"]).toBe("À Camille, 12 juin");
  });

  it("ignore une option disparue du catalogue plutôt que d'échouer", () => {
    expect(decodeConfig(catalogue, "cadran:fuchsia-fluo~finition:brosse")).toEqual({ finition: "brosse" });
    expect(decodeConfig(catalogue, "groupe-inconnu:valeur")).toEqual({});
    expect(decodeConfig(catalogue, null)).toEqual({});
  });

  it("tronque une gravure trop longue", () => {
    const trop = "x".repeat(60);
    expect(decodeConfig(catalogue, `gravure:${trop}`)["gravure"]).toHaveLength(30);
  });
});

describe("lien partagé abîmé (audit A-10)", () => {
  const ENTREES_HOSTILES: unknown[] = [
    "taille:%E0%A4%A",
    "taille:%",
    "%E0%A4%A:40",
    "gravure:%ZZ",
    "taille:40~index:%C3",
    "~~~",
    ":::",
    "taille",
    "taille:",
    ":40",
    "\u0000",
    "taille:40".repeat(2000),
    ["taille:40", "index:batons"],
    { taille: "40" },
    42,
    true,
    undefined,
    null,
    "",
    "__proto__:polluted",
    "constructor:prototype",
  ];

  it("ne lève jamais, quelle que soit l'entrée", () => {
    for (const entree of ENTREES_HOSTILES) {
      expect(() => decodeConfig(catalogue, entree)).not.toThrow();
    }
  });

  it("ignore la paire fautive et garde le reste du lien", () => {
    expect(decodeConfig(catalogue, "taille:%E0%A4%A")).toEqual({});
    expect(decodeConfig(catalogue, "taille:%E0%A4%A~finition:brosse")).toEqual({ finition: "brosse" });
    expect(decodeConfig(catalogue, "gravure:%ZZ~finition:brosse")).toEqual({ finition: "brosse" });
  });

  it("retombe sur la configuration de départ du modèle", () => {
    for (const entree of ENTREES_HOSTILES) {
      const config = buildConfiguration(catalogue, abysse, {
        ...abysse.defaultSelections,
        ...decodeConfig(catalogue, entree),
      });
      expect(config.price.totalCents).toBeGreaterThanOrEqual(abysse.basePriceCents);
      expect(Object.getPrototypeOf(config.selections)).toBe(Object.prototype);
    }
    const abime = buildConfiguration(catalogue, abysse, {
      ...abysse.defaultSelections,
      ...decodeConfig(catalogue, "taille:%E0%A4%A"),
    });
    expect(abime.selections).toEqual(defaultConfiguration(catalogue, abysse).selections);
  });
});

describe("rendu déduit des sélections", () => {
  it("l'Abysse 40 part bleu, lunette de plongée, insert céramique", () => {
    const render = resolveRender(catalogue, abysse.defaultSelections);
    expect(render).toMatchObject({
      caseSize: 40,
      dialColor: "#1E48C8",
      indexStyle: "arabes-chapitre",
      bezelStyle: "plongee",
      insertMaterial: "ceramique",
      handShape: "fleche",
      movement: "NH36",
    });
  });

  it("l'Abysse 40 est une plongeuse japonaise : coussin, couronne à 4 h, jour-date", () => {
    const render = resolveRender(catalogue, abysse.defaultSelections);
    expect(render).toMatchObject({
      caseShape: "coussin",
      crownAt: 4,
      showDate: true,
      dateWindow: "jour-date",
      indexStyle: "arabes-chapitre",
      crownStyle: "lisse",
    });
  });

  it("une configuration sans les nouveaux choix garde le rendu d'avant", () => {
    const render = resolveRender(catalogue, { cadran: "romains-blanc-argent", date: "avec" });
    expect(render.caseShape).toBeUndefined();
    expect(render.crownAt).toBeUndefined();
    expect(render.dateWindow).toBeUndefined();
    expect(render.innerRing).toBeUndefined();
  });

  it("la Soirée 37 est une habillée : quantième, sans luminova, verre box, couronne oignon, cuir glacé", () => {
    const render = resolveRender(catalogue, soiree.defaultSelections);
    expect(render.showDate).toBe(true);
    expect(render.lume).toBe(false);
    expect(render.caseback).toBe("transparent");
    expect(render.handShape).toBe("dauphine");
    expect(render).toMatchObject({ indexStyle: "romains", indexMetal: "dore" });
    expect(render).toMatchObject({ crystal: "box", crownStyle: "oignon", strapKind: "cuir-glace" });
  });

  it("le Méridien 39 est un GMT sport : lunette 24 h bicolore, aiguille rouge, loupe, couronne à 4 h", () => {
    const meridien = SAMPLE_MODELS.find((m) => m.slug === "meridien-39");
    if (!meridien) throw new Error("fixture absente");
    expect(resolveRender(catalogue, meridien.defaultSelections)).toMatchObject({
      bezelStyle: "gmt",
      insertColor2: "#5E6369",
      accentHandColor: "#C8202B",
      cyclops: true,
      crownAt: 4,
      movement: "NH34",
    });
  });

  it("la Rallye 41 porte la lunette tachymètre, réservée au chronographe", () => {
    const rallye = SAMPLE_MODELS.find((m) => m.slug === "rallye-41");
    if (!rallye) throw new Error("fixture absente");
    expect(resolveRender(catalogue, rallye.defaultSelections)).toMatchObject({ bezelStyle: "tachymetre", movement: "VK64" });
    expect(evaluateOption(catalogue, "lunette-style:tachymetre", { mouvement: "nh35" }).selectable).toBe(false);
  });

  it("la loupe exige un quantième seul sous un saphir plat", () => {
    expect(evaluateOption(catalogue, "loupe:avec", { date: "jour-date", "verre-forme": "plat" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "loupe:avec", { date: "avec", "verre-forme": "bombe" }).selectable).toBe(false);
    expect(evaluateOption(catalogue, "loupe:avec", { date: "avec", "verre-forme": "plat" }).selectable).toBe(true);
  });

  it("sans les nouveaux choix, ni loupe, ni teinte d'aiguille, ni métal d'index", () => {
    const render = resolveRender(catalogue, {});
    expect(render.cyclops).toBeUndefined();
    expect(render.accentHandColor).toBeUndefined();
    expect(render.indexMetal).toBeUndefined();
    expect(render.waterResistM).toBeUndefined();
  });

  it("reporte la gravure sur le rendu", () => {
    expect(resolveRender(catalogue, { gravure: "Pour Jean" }).engraving).toBe("Pour Jean");
  });
});

describe("modèles d'exemple", () => {
  it.each(SAMPLE_MODELS.map((m) => [m.slug, m] as const))(
    "%s : la configuration de départ et le second coloris respectent les règles",
    (_slug, modele) => {
      const exclus = excludedOptionsFor(modele);
      const depart = modele.defaultSelections;
      const second = { ...modele.defaultSelections, ...modele.altSelections };
      expect(normalizeSelections(catalogue, depart, exclus)).toEqual(depart);
      expect(normalizeSelections(catalogue, second, exclus)).toEqual(second);
    },
  );
});

describe("configuration complète", () => {
  it("expose un récapitulatif, un prix, un délai et une nomenclature cohérents", () => {
    const config = buildConfiguration(catalogue, abysse, abysse.defaultSelections);
    expect(config.summary.length).toBeGreaterThan(10);
    expect(config.price.totalCents).toBeGreaterThanOrEqual(abysse.basePriceCents);
    expect(config.leadTime.days).toBeGreaterThanOrEqual(abysse.assemblyDays);
    expect(config.bom.length).toBeGreaterThan(5);
    expect(config.shareParam).toContain("taille:40");
  });

  it("corrige une configuration reçue par lien qui ne tient plus debout", () => {
    const config = buildConfiguration(catalogue, abysse, {
      ...abysse.defaultSelections,
      taille: "38",
      mouvement: "nh38",
    });
    expect(config.selections["taille"]).toBe("40");
    expect(config.selections["date"]).toBe("sans");
  });
});

describe("lien partagé", () => {
  it("le lien prime sur la configuration signature, qui comble les trous", () => {
    const partiel = decodeConfig(catalogue, "cadran:romains-or-rose");
    const config = buildConfiguration(catalogue, abysse, { ...abysse.defaultSelections, ...partiel });
    expect(config.selections["cadran"]).toBe("romains-or-rose");
    expect(config.selections["lunette-style"]).toBe("plongee");
    expect(config.selections["taille"]).toBe("40");
  });
});

describe("prix « à partir de » (audit A-08)", () => {
  it("est atteignable : une configuration commandable existe à ce prix, pour chaque modèle", () => {
    for (const modele of SAMPLE_MODELS) {
      expect(prixPlancherCents(catalogue, modele), modele.slug).toBe(prixAPartirDeCents(modele));
    }
  });

  it("ne dépasse jamais le prix de la configuration de départ", () => {
    for (const modele of SAMPLE_MODELS) {
      expect(prixAPartirDeCents(modele)).toBeLessThanOrEqual(defaultConfiguration(catalogue, modele).price.totalCents);
    }
  });
});
