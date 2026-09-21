import { describe, expect, it } from "vitest";
import { bornerQuantite, lireQuantite } from "./quantite";

describe("quantité du panier (audit A-02)", () => {
  it("n'interprète pas un champ vide ou nul comme une suppression", () => {
    for (const saisie of ["", " ", "0", "00", "-2", "1,5", "1.5", "abc", "1e3", "99999"]) {
      expect(lireQuantite(saisie), saisie).toBeUndefined();
    }
  });

  it("accepte 1 à 9 et borne au-delà", () => {
    expect(lireQuantite("1")).toBe(1);
    expect(lireQuantite(" 4 ")).toBe(4);
    expect(lireQuantite("9")).toBe(9);
    expect(lireQuantite("12")).toBe(9);
  });

  it("ne descend jamais sous 1 dans le panier", () => {
    expect(bornerQuantite(0, 3)).toBe(3);
    expect(bornerQuantite(-2, 3)).toBe(3);
    expect(bornerQuantite(Number.NaN, 3)).toBe(3);
    expect(bornerQuantite(Number(""), 3)).toBe(3);
    expect(bornerQuantite(2.7, 3)).toBe(2);
    expect(bornerQuantite(40, 3)).toBe(9);
  });
});
