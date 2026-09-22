import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CYCLOPS_SCALE } from "./parts/crystal";
import type { WatchRender } from "./types";
import { WatchSvg } from "./watch-svg";

/**
 * Loupe de quantième : « sur certaines montres les aiguilles passent sous la
 * date ». La lentille est dessinée après les aiguilles (elle est collée sur le
 * verre) ; elle doit donc reprendre, grossis, le guichet PUIS les aiguilles —
 * jamais redessiner un quantième par-dessus elles.
 */
const gmtALoupe: WatchRender = {
  caseSize: 39,
  caseFinish: "brosse",
  caseMetal: "acier",
  bezelStyle: "gmt",
  insertColor: "#17191C",
  insertColor2: "#5A5F66",
  insertMaterial: "ceramique",
  dialColor: "#1A1C1F",
  dialTexture: "soleille",
  indexStyle: "plongee",
  handShape: "fleche",
  handMetal: "acier",
  lume: true,
  crownStyle: "signee",
  crownMetal: "acier",
  strapKind: "acier-jubile",
  strapColor: "#888888",
  crystal: "plat",
  cyclops: true,
  antiGlare: true,
  movement: "NH34",
  accentHandColor: "#C8102E",
  caseback: "plein",
  waterResistM: 100,
  // 14 h 15 min 15 s : minute et trotteuse sur le guichet de 3 h.
  time: { hours: 14, minutes: 15, seconds: 15 },
};

function rendre(render: WatchRender, detail: "full" | "compact" = "full"): string {
  return renderToStaticMarkup(createElement(WatchSvg, { id: "t", render, detail, label: "test" }));
}

describe("loupe de quantième", () => {
  const svg = rendre(gmtALoupe);
  const iGuichet = svg.indexOf('id="t-guichet"');
  const iAiguilles = svg.indexOf('id="t-aiguilles"');
  const iLoupe = svg.indexOf('data-layer="loupe"');
  const iUseGuichet = svg.indexOf('href="#t-guichet"');
  const iUseAiguilles = svg.indexOf('href="#t-aiguilles"');

  it("dessine le guichet, puis les aiguilles, puis la loupe", () => {
    expect(iGuichet).toBeGreaterThan(-1);
    expect(iAiguilles).toBeGreaterThan(iGuichet);
    expect(iLoupe).toBeGreaterThan(iAiguilles);
  });

  it("la loupe reprend le guichet puis les aiguilles, grossis autour du centre du guichet", () => {
    expect(iUseGuichet).toBeGreaterThan(iLoupe);
    expect(iUseAiguilles).toBeGreaterThan(iUseGuichet);
    const use = svg.slice(iUseAiguilles, svg.indexOf(">", iUseAiguilles));
    expect(use).toContain(`scale(${CYCLOPS_SCALE})`);
    expect(use).toContain("translate(698 500)");
  });

  it("ne redessine aucun quantième par-dessus les aiguilles", () => {
    // Un seul texte `data-guichet="quantieme"` : celui du guichet. La copie de
    // la loupe passe par `<use>`, donc suit l'horloge vivante sans doublon.
    expect(svg.match(/data-guichet="quantieme"/g)).toHaveLength(1);
    expect(svg.match(/id="t-aiguilles"/g)).toHaveLength(1);
  });

  it("n'existe que si l'option est choisie", () => {
    expect(rendre({ ...gmtALoupe, cyclops: false })).not.toContain('data-layer="loupe"');
    // Sur un jour-date, la loupe ne couvrirait que la moitié du guichet : jamais dessinée.
    expect(rendre({ ...gmtALoupe, movement: "NH36", dateWindow: "jour-date" })).not.toContain('data-layer="loupe"');
  });
});

describe("ordre des calques sous le verre", () => {
  it("l'aiguille des minutes passe sur les compteurs du chronographe", () => {
    const svg = rendre({ ...gmtALoupe, movement: "VK64", bezelStyle: "tachymetre", cyclops: false, subdialColor: "#15171A" });
    expect(svg.indexOf('data-layer="compteurs"')).toBeLessThan(svg.indexOf('data-aiguille="minute"'));
    expect(svg.indexOf('data-layer="aiguilles"')).toBeLessThan(svg.indexOf('data-layer="verre"'));
  });

  it("le guichet jour-date est dessiné avant les aiguilles", () => {
    const svg = rendre({ ...gmtALoupe, movement: "NH36", dateWindow: "jour-date", cyclops: false });
    expect(svg.indexOf('data-layer="guichet-date"')).toBeLessThan(svg.indexOf('data-layer="aiguilles"'));
  });
});

describe("budget de nœuds", () => {
  const compter = (svg: string) => (svg.match(/<[a-zA-Z]/g) ?? []).length;
  it("un rendu plein reste sous 2 400 nœuds, une vignette sous 900", () => {
    expect(compter(rendre(gmtALoupe))).toBeLessThan(2400);
    expect(compter(rendre(gmtALoupe, "compact"))).toBeLessThan(900);
  });
});
