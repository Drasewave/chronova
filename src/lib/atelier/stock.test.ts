import { describe, expect, it } from "vitest";
import { effetMouvement, recomposerStock, type MouvementStock } from "./stock";

/** Le cycle complet d'une pièce, tel que le CRM l'écrit réellement. */
const CYCLE: MouvementStock[] = [
  { type: "ENTREE", quantity: 10 },
  { type: "RESERVATION", quantity: -2 },
  { type: "RESERVATION", quantity: -1 },
  { type: "LIBERATION", quantity: 1 },
  { type: "SORTIE_ASSEMBLAGE", quantity: -2 },
];

describe("recomposerStock", () => {
  it("recompose les deux compteurs depuis le journal", () => {
    expect(recomposerStock(CYCLE)).toEqual({ enRayon: 8, reserve: 0, disponible: 8 });
  });

  it("ne compte pas deux fois une pièce réservée puis montée", () => {
    const etat = recomposerStock([
      { type: "ENTREE", quantity: 5 },
      { type: "RESERVATION", quantity: -1 },
    ]);
    expect(etat).toEqual({ enRayon: 5, reserve: 1, disponible: 4 });

    const apres = recomposerStock([
      { type: "ENTREE", quantity: 5 },
      { type: "RESERVATION", quantity: -1 },
      { type: "SORTIE_ASSEMBLAGE", quantity: -1 },
    ]);
    expect(apres).toEqual({ enRayon: 4, reserve: 0, disponible: 4 });
  });

  it("déduit une perte du rayon sans toucher aux réservations", () => {
    expect(
      recomposerStock([
        { type: "ENTREE", quantity: 4 },
        { type: "RESERVATION", quantity: -2 },
        { type: "PERTE", quantity: -1 },
      ]),
    ).toEqual({ enRayon: 3, reserve: 2, disponible: 1 });
  });

  it("part de zéro sur un journal vide", () => {
    expect(recomposerStock([])).toEqual({ enRayon: 0, reserve: 0, disponible: 0 });
  });
});

describe("effetMouvement", () => {
  it("sépare ce qui quitte le tiroir de ce qui cesse d'être libre", () => {
    expect(effetMouvement({ type: "ENTREE", quantity: 5 })).toEqual({ rayon: 5, libre: 5 });
    expect(effetMouvement({ type: "RESERVATION", quantity: -2 })).toEqual({ rayon: 0, libre: -2 });
    expect(effetMouvement({ type: "LIBERATION", quantity: 2 })).toEqual({ rayon: 0, libre: 2 });
    // La pièce sort du tiroir, mais elle n'était déjà plus libre.
    expect(effetMouvement({ type: "SORTIE_ASSEMBLAGE", quantity: -1 })).toEqual({ rayon: -1, libre: 0 });
    expect(effetMouvement({ type: "PERTE", quantity: -1 })).toEqual({ rayon: -1, libre: -1 });
  });

  it("les colonnes du journal totalisent les compteurs de la pièce", () => {
    const total = CYCLE.reduce(
      (somme, mouvement) => {
        const effet = effetMouvement(mouvement);
        return { rayon: somme.rayon + effet.rayon, libre: somme.libre + effet.libre };
      },
      { rayon: 0, libre: 0 },
    );
    const etat = recomposerStock(CYCLE);
    expect(total).toEqual({ rayon: etat.enRayon, libre: etat.disponible });
  });
});
