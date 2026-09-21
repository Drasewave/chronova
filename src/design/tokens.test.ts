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
    ["bleu", AA],
    ["bleu-vif", AA],
    ["sapin", AA],
    ["grenat", AA],
  ])("%s atteint le niveau AA sur le papier et sur son alterné", (nom, minimum) => {
    expect(contrastRatio(token(nom), token("papier"))).toBeGreaterThanOrEqual(minimum);
    expect(contrastRatio(token(nom), token("papier-alt"))).toBeGreaterThanOrEqual(AA);
  });

  it("un bouton plein reste lisible : blanc sur bleu, au repos comme au survol", () => {
    expect(contrastRatio(token("panneau"), token("bleu"))).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(token("panneau"), token("bleu-vif"))).toBeGreaterThanOrEqual(AA);
  });

  it("l'aplat bleu se détache du blanc et de son alterné (WCAG 1.4.11, 3:1)", () => {
    expect(contrastRatio(token("bleu"), token("papier"))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(token("bleu"), token("papier-alt"))).toBeGreaterThanOrEqual(3);
  });

  it("le bleu clair est trop faible pour du texte sur blanc : réservé au noir", () => {
    expect(contrastRatio(token("bleu-clair"), token("papier"))).toBeLessThan(AA);
  });
});

describe("palette sur fond sombre (nuit)", () => {
  it.each([
    ["nuit-encre", 11],
    ["nuit-douce", AA],
    ["bleu-clair", AA],
    ["bleu-pale", AA],
    ["sapin-clair", AA],
    ["grenat-clair", AA],
  ])("%s atteint le niveau AA sur la nuit et sur son panneau", (nom, minimum) => {
    expect(contrastRatio(token(nom), token("nuit"))).toBeGreaterThanOrEqual(minimum);
    expect(contrastRatio(token(nom), token("nuit-panneau"))).toBeGreaterThanOrEqual(AA);
  });

  it("un bouton plein reste lisible : nuit sur bleu clair", () => {
    expect(contrastRatio(token("nuit"), token("bleu-clair"))).toBeGreaterThanOrEqual(AA);
  });

  it("le bleu profond disparaît sur le noir : c'est pourquoi l'accent y passe au bleu clair", () => {
    expect(contrastRatio(token("bleu"), token("nuit"))).toBeLessThan(3);
  });

  it("le vert sapin normal passe aussi sous le seuil de lecture", () => {
    expect(contrastRatio(token("sapin"), token("nuit"))).toBeLessThan(AA);
  });
});
