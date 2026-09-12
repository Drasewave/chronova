import { describe, expect, it } from "vitest";
import { getSampleModel, excludedOptionsFor } from "@/lib/data/models";
import { buildConfiguration, defaultConfiguration } from "./configuration";
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
    const prix = computePrice(100000, { finition: "poli", "aiguilles-metal": "dore" });
    expect(prix.baseCents).toBe(100000);
    expect(prix.totalCents).toBe(100000 + 4000 + 5000);
    expect(prix.lines).toHaveLength(2);
  });

  it("ne liste que les choix qui coûtent quelque chose", () => {
    const prix = computePrice(100000, { finition: "brosse", index: "batons" });
    expect(prix.lines).toHaveLength(0);
    expect(prix.totalCents).toBe(100000);
  });

  it("ne facture la gravure que si le texte est renseigné", () => {
    expect(computePrice(100000, { gravure: "   " }).totalCents).toBe(100000);
    expect(computePrice(100000, { gravure: "Pour Camille" }).totalCents).toBe(104500);
  });

  it("reste en centimes entiers après une longue configuration", () => {
    const total = defaultConfiguration(meridien).price.totalCents;
    expect(Number.isInteger(total)).toBe(true);
  });
});

describe("délai d'assemblage", () => {
  it("part du délai du modèle et nomme ce qui l'allonge", () => {
    const delai = computeLeadTime(14, { mouvement: "nh34", gravure: "M.L." });
    expect(delai.days).toBe(14 + 3 + 4);
    expect(delai.reasons.map((r) => r.days).reduce((a, b) => a + b, 0)).toBe(7);
  });

  it("n'ajoute rien quand aucune option ne demande de travail supplémentaire", () => {
    expect(computeLeadTime(14, { finition: "brosse" }).days).toBe(14);
  });
});

describe("règles de compatibilité", () => {
  it("la lunette de plongée exige un boîtier de 40 mm", () => {
    const verdict = evaluateOption("lunette-style:plongee", { taille: "38", "couronne-vissee": "vissee" });
    expect(verdict.selectable).toBe(false);
    expect(verdict.reason).toContain("40 mm");
  });

  it("la lunette de plongée exige aussi une couronne vissée", () => {
    const verdict = evaluateOption("lunette-style:plongee", { taille: "40", "couronne-vissee": "poussoir" });
    expect(verdict.selectable).toBe(false);
    expect(verdict.reason).toContain("couronne vissée");
  });

  it("l'aiguille 24 h nécessite le mouvement GMT", () => {
    expect(evaluateOption("aiguille-24h:fleche", { mouvement: "nh35" })).toMatchObject({
      selectable: false,
      reason: "Nécessite le mouvement GMT NH34.",
    });
    expect(evaluateOption("aiguille-24h:fleche", { mouvement: "nh34" }).selectable).toBe(true);
  });

  it("le NH38 exclut le guichet de date", () => {
    expect(evaluateOption("date:avec", { mouvement: "nh38" }).selectable).toBe(false);
    expect(evaluateOption("date:avec", { mouvement: "nh35" }).selectable).toBe(true);
  });

  it("une teinte de cuir n'est proposée que sur un bracelet cuir", () => {
    expect(evaluateOption("bracelet-teinte:fauve", { "bracelet-type": "nato" }).selectable).toBe(false);
    expect(evaluateOption("bracelet-teinte:fauve", { "bracelet-type": "cuir" }).selectable).toBe(true);
  });

  it("l'émail ne se fait que sur les teintes claires", () => {
    expect(evaluateOption("cadran-finition:emaille", { "cadran-teinte": "noir-mat" }).selectable).toBe(false);
    expect(evaluateOption("cadran-finition:emaille", { "cadran-teinte": "creme" }).selectable).toBe(true);
  });

  it("un modèle n'offre que ses propres diamètres", () => {
    const exclus = excludedOptionsFor(abysse);
    expect(evaluateOption("taille:38", {}, exclus).selectable).toBe(false);
    expect(evaluateOption("taille:40", {}, exclus).selectable).toBe(true);
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
    const apres = normalizeSelections({ ...avant, "lunette-style": "lisse" });
    expect(apres["insert-matiere"]).toBeUndefined();
    expect(apres["insert-teinte"]).toBeUndefined();
  });

  it("choisir le NH38 bascule le cadran sans date", () => {
    const apres = normalizeSelections({ date: "avec", mouvement: "nh38" });
    expect(apres["date"]).toBe("sans");
  });

  it("changer de type de bracelet réajuste la teinte", () => {
    const apres = normalizeSelections({ "bracelet-type": "nato", "bracelet-teinte": "fauve" });
    expect(apres["bracelet-teinte"]).not.toBe("fauve");
    expect(evaluateOption(`bracelet-teinte:${apres["bracelet-teinte"]}`, apres).selectable).toBe(true);
  });

  it("laisse une configuration déjà valide intacte", () => {
    const depart = defaultConfiguration(abysse).selections;
    expect(normalizeSelections(depart, excludedOptionsFor(abysse))).toEqual(depart);
  });

  it("masque les groupes facultatifs sans aucune option possible", () => {
    expect(isGroupVisible("insert-matiere", { "lunette-style": "lisse" })).toBe(false);
    expect(isGroupVisible("insert-matiere", { "lunette-style": "plongee" })).toBe(true);
    expect(isGroupVisible("aiguille-24h", { mouvement: "nh35" })).toBe(false);
  });
});

describe("stock", () => {
  it("signale une référence épuisée", () => {
    expect(resolveStockState("INS-VER")).toBe("bientot");
    expect(restockMessage("INS-VER")).toContain("38 jours");
  });

  it("signale une dernière pièce", () => {
    expect(resolveStockState("CAD-SAU")).toBe("derniere-piece");
  });

  it("compte le réservé comme indisponible", () => {
    expect(resolveStockState("BRA-CAO")).toBe("bientot");
  });

  it("ne bloque rien quand l'option ne consomme aucune pièce", () => {
    expect(resolveStockState(undefined)).toBe("disponible");
  });
});

describe("nomenclature", () => {
  it("traduit une configuration en pièces à sortir du stock", () => {
    const bom = buildBom(abysse.defaultSelections);
    const refs = bom.map((ligne) => ligne.part.ref);
    expect(refs).toContain("BOI-40");
    expect(refs).toContain("CAD-BLE");
    expect(refs).toContain("MOU-NH35");
    expect(refs).toContain("LUN-PLO");
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("chaque ligne rappelle le choix client qui l'a provoquée", () => {
    const ligne = buildBom(abysse.defaultSelections).find((l) => l.part.ref === "CAD-BLE");
    expect(ligne?.becauseOf).toContain("Bleu abysse");
  });

  it("le coût des pièces reste bien en dessous du prix de vente", () => {
    const config = defaultConfiguration(abysse);
    expect(config.partsCostCents).toBeGreaterThan(0);
    expect(config.partsCostCents).toBeLessThan(config.price.totalCents);
  });
});

describe("configuration dans l'URL", () => {
  it("fait un aller-retour sans perte", () => {
    const depart = defaultConfiguration(meridien).selections;
    expect(decodeConfig(encodeConfig(depart))).toEqual(depart);
  });

  it("conserve le texte de gravure, espaces et accents compris", () => {
    const encode = encodeConfig({ gravure: "À Camille, 12 juin" });
    expect(decodeConfig(encode)["gravure"]).toBe("À Camille, 12 juin");
  });

  it("ignore une option disparue du catalogue plutôt que d'échouer", () => {
    expect(decodeConfig("cadran-teinte:turquoise~index:batons")).toEqual({ index: "batons" });
    expect(decodeConfig("groupe-inconnu:valeur")).toEqual({});
    expect(decodeConfig(null)).toEqual({});
  });

  it("tronque une gravure trop longue", () => {
    const trop = "x".repeat(60);
    expect(decodeConfig(`gravure:${trop}`)["gravure"]).toHaveLength(30);
  });
});

describe("rendu déduit des sélections", () => {
  it("l'Abysse 40 part bleu, lunette de plongée, insert céramique", () => {
    const render = resolveRender(abysse.defaultSelections);
    expect(render).toMatchObject({
      caseSize: 40,
      dialColor: "#1E3448",
      bezelStyle: "plongee",
      insertMaterial: "ceramique",
      handShape: "mercedes",
      movement: "NH35",
    });
  });

  it("la Soirée 37 est sans date, sans luminova, fond transparent", () => {
    const render = resolveRender(soiree.defaultSelections);
    expect(render.showDate).toBe(false);
    expect(render.lume).toBe(false);
    expect(render.caseback).toBe("transparent");
    expect(render.handMetal).toBe("bleui");
  });

  it("reporte la gravure sur le rendu", () => {
    expect(resolveRender({ gravure: "Pour Jean" }).engraving).toBe("Pour Jean");
  });
});

describe("configuration complète", () => {
  it("expose un récapitulatif, un prix, un délai et une nomenclature cohérents", () => {
    const config = buildConfiguration(abysse, abysse.defaultSelections);
    expect(config.summary.length).toBeGreaterThan(10);
    expect(config.price.totalCents).toBeGreaterThanOrEqual(abysse.basePriceCents);
    expect(config.leadTime.days).toBeGreaterThanOrEqual(abysse.assemblyDays);
    expect(config.bom.length).toBeGreaterThan(5);
    expect(config.shareParam).toContain("taille:40");
  });

  it("corrige une configuration reçue par lien qui ne tient plus debout", () => {
    const config = buildConfiguration(abysse, {
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
    const partiel = decodeConfig("cadran-teinte:saumon");
    const config = buildConfiguration(abysse, { ...abysse.defaultSelections, ...partiel });
    expect(config.selections["cadran-teinte"]).toBe("saumon");
    expect(config.selections["lunette-style"]).toBe("plongee");
    expect(config.selections["taille"]).toBe("40");
  });
});
