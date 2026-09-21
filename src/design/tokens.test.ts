import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/watch/palette";

/**
 * Garde-fou du design system.
 *
 * Les valeurs ne sont pas recopiées ici : elles sont LUES dans `globals.css`,
 * qui reste la source unique. Changer une teinte sans vérifier son contraste
 * fait donc échouer la suite, au lieu de partir silencieusement en production.
 */
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

function token(nom: string): string {
  const trouve = new RegExp(`--color-${nom}:\\s*(#[0-9a-fA-F]{3,8});`).exec(css);
  if (!trouve?.[1]) throw new Error(`Token introuvable dans globals.css : --color-${nom}`);
  return trouve[1];
}

const AA = 4.5;

describe("palette sur fond clair (papier)", () => {
  it.each([
    ["encre", 11],
    ["encre-douce", AA],
    ["marine", AA],
    ["marine-vive", AA],
    ["or", AA],
    ["sapin", AA],
    ["grenat", AA],
  ])("%s atteint le niveau AA sur le papier et sur son alterné", (nom, minimum) => {
    expect(contrastRatio(token(nom), token("papier"))).toBeGreaterThanOrEqual(minimum);
    expect(contrastRatio(token(nom), token("papier-alt"))).toBeGreaterThanOrEqual(AA);
  });

  it("un bouton plein reste lisible : panneau sur marine", () => {
    expect(contrastRatio(token("panneau"), token("marine"))).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(token("panneau"), token("marine-vive"))).toBeGreaterThanOrEqual(AA);
  });

  it("l'or clair est bien trop faible pour du texte sur papier : décor uniquement", () => {
    expect(contrastRatio(token("or-clair"), token("papier"))).toBeLessThan(3);
  });
});

describe("palette sur fond sombre (nuit)", () => {
  it.each([
    ["nuit-encre", 11],
    ["nuit-douce", AA],
    ["or-clair", AA],
    ["or-pale", AA],
    ["sapin-clair", AA],
    ["grenat-clair", AA],
  ])("%s atteint le niveau AA sur la nuit et sur son panneau", (nom, minimum) => {
    expect(contrastRatio(token(nom), token("nuit"))).toBeGreaterThanOrEqual(minimum);
    expect(contrastRatio(token(nom), token("nuit-panneau"))).toBeGreaterThanOrEqual(AA);
  });

  it("un bouton plein reste lisible : nuit sur or clair", () => {
    expect(contrastRatio(token("nuit"), token("or-clair"))).toBeGreaterThanOrEqual(AA);
  });

  it("la marine disparaît sur la nuit : c'est pourquoi l'accent bascule sur l'or", () => {
    expect(contrastRatio(token("marine"), token("nuit"))).toBeLessThan(3);
  });

  it("le vert sapin normal chute aussi", () => {
    expect(contrastRatio(token("sapin"), token("nuit"))).toBeLessThan(3);
  });
});
