import { describe, expect, it } from "vitest";
import { avecArticle, deLa } from "./articles";
import { SAMPLE_MODELS } from "@/lib/data/models";

describe("article devant un nom de modèle", () => {
  it("élide devant une voyelle, accentuée ou non", () => {
    expect(avecArticle("Abysse 40")).toBe("l'Abysse 40");
    expect(avecArticle("Écume 38")).toBe("l'Écume 38");
    expect(deLa("Abysse 40")).toBe("de l'Abysse 40");
  });

  it("garde « la » devant une consonne", () => {
    expect(avecArticle("Soirée 37")).toBe("la Soirée 37");
    expect(deLa("Corail 39")).toBe("de la Corail 39");
  });

  it("distingue le h muet du h aspiré", () => {
    expect(avecArticle("Horizon 39")).toBe("l'Horizon 39");
    expect(avecArticle("Houle 40")).toBe("la Houle 40");
  });

  it("ne produit jamais « la A… » ni « l'C… » sur les modèles du catalogue", () => {
    for (const modele of SAMPLE_MODELS) {
      expect(avecArticle(modele.name)).not.toMatch(/^la [AÀÂEÉÈÊIÎOÔUÙÛY]/i);
      expect(avecArticle(modele.name)).not.toMatch(/^l'[BCDFGJKLMNPQRSTVWXZ]/i);
    }
  });
});
