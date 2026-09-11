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

describe("palette sur fond crème", () => {
  const paper = token("paper");

  it.each([
    ["ink", 11],
    ["ink-soft", AA],
    ["brass", AA],
    ["brass-deep", AA],
    ["sage", AA],
    ["rust", AA],
  ])("%s atteint le niveau AA", (nom, minimum) => {
    expect(contrastRatio(token(nom), paper)).toBeGreaterThanOrEqual(minimum);
  });

  it("un bouton plein reste lisible : crème sur laiton", () => {
    expect(contrastRatio(token("paper"), token("brass"))).toBeGreaterThanOrEqual(AA);
  });

  it("le laiton clair est bien trop faible pour du texte : décor uniquement", () => {
    expect(contrastRatio(token("brass-light"), paper)).toBeLessThan(3);
  });
});

describe("palette sur fond nuit", () => {
  const night = token("night");

  it.each([
    ["night-ink", 11],
    ["night-soft", AA],
    ["brass-light", AA],
    ["sage-light", AA],
    ["rust-light", AA],
  ])("%s atteint le niveau AA", (nom, minimum) => {
    expect(contrastRatio(token(nom), night)).toBeGreaterThanOrEqual(minimum);
  });

  it("le laiton normal chute sous le seuil : c'est pourquoi l'accent bascule en mode sombre", () => {
    expect(contrastRatio(token("brass"), night)).toBeLessThan(3);
  });

  it("le vert sauge normal chute aussi", () => {
    expect(contrastRatio(token("sage"), night)).toBeLessThan(3);
  });
});

describe("interdits de la direction artistique", () => {
  it("aucun blanc pur ni noir pur dans la palette", () => {
    const teintes = /--color-[a-z-]+:\s*(#[0-9a-fA-F]{6});/g;
    const trouvees = [...css.matchAll(teintes)].map((m) => m[1]?.toLowerCase());
    expect(trouvees.length).toBeGreaterThan(10);
    expect(trouvees).not.toContain("#ffffff");
    expect(trouvees).not.toContain("#000000");
  });
});
