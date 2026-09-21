import { describe, expect, it } from "vitest";
import { cadrageCadran, cadrageCouronne, cadrageIndex, cadrageLunette } from "./cadrages";
import type { WatchRender } from "@/watch/types";

const BASE: WatchRender = {
  caseSize: 40,
  caseFinish: "brosse",
  caseMetal: "acier",
  bezelStyle: "lisse",
  dialColor: "#123",
  dialTexture: "soleille",
  indexStyle: "batons",
  handShape: "glaive",
  handMetal: "acier",
  lume: true,
  crownStyle: "signee",
  crownMetal: "acier",
  strapKind: "acier-3-maillons",
  strapColor: "#999",
  crystal: "plat",
  antiGlare: true,
  movement: "NH35",
  caseback: "plein",
};

const lire = (crop: string) => {
  const [x, y, largeur, hauteur] = crop.split(" ").map(Number) as [number, number, number, number];
  return { x, y, largeur, hauteur, cx: x + largeur / 2, cy: y + hauteur / 2 };
};

describe("cadrages calculés des gros plans", () => {
  const variantes: WatchRender[] = [
    BASE,
    { ...BASE, caseSize: 37 },
    { ...BASE, caseSize: 41, bezelStyle: "tachymetre", movement: "VK64" },
    { ...BASE, bezelStyle: "plongee", caseShape: "coussin", crownAt: 4 },
    { ...BASE, caseSize: 39, bezelStyle: "gmt", crownAt: 4 },
  ];

  it("reste carré et dans le cadre du dessin, pour chaque forme de montre", () => {
    for (const render of variantes) {
      for (const crop of [cadrageIndex(render), cadrageLunette(render), cadrageCouronne(render), cadrageCadran(render)]) {
        const f = lire(crop);
        expect(f.largeur).toBe(f.hauteur);
        expect(f.x).toBeGreaterThanOrEqual(0);
        expect(f.y).toBeGreaterThanOrEqual(0);
        expect(f.x + f.largeur).toBeLessThanOrEqual(1000);
        expect(f.y + f.hauteur).toBeLessThanOrEqual(1000);
      }
    }
  });

  it("suit la couronne : à 3 h elle est à hauteur du centre, à 4 h plus bas", () => {
    const a3h = lire(cadrageCouronne(BASE));
    const a4h = lire(cadrageCouronne({ ...BASE, crownAt: 4 }));
    expect(a3h.cy).toBeCloseTo(500, 0);
    expect(a4h.cy).toBeGreaterThan(a3h.cy + 100);
    expect(a4h.cx).toBeLessThan(a3h.cx);
  });

  it("va chercher la couronne plus loin sur une carrure coussin", () => {
    const rond = lire(cadrageCouronne({ ...BASE, crownAt: 4 }));
    const coussin = lire(cadrageCouronne({ ...BASE, crownAt: 4, caseShape: "coussin" }));
    expect(coussin.cx).toBeGreaterThan(rond.cx);
  });

  it("resserre le plan du cadran sous une lunette à insert", () => {
    expect(lire(cadrageCadran({ ...BASE, bezelStyle: "plongee" })).largeur).toBeLessThan(lire(cadrageCadran(BASE)).largeur);
  });

  it("centre le plan du cadran", () => {
    const f = lire(cadrageCadran(BASE));
    expect(f.cx).toBeCloseTo(500, 1);
    expect(f.cy).toBeCloseTo(500, 1);
  });
});
