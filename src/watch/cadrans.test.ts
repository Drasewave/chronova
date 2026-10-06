import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BASE_RENDER } from "../lib/configurateur/resolve";
import { dialLayout } from "./dial-layout";
import type { DialTexture, IndexStyle, WatchRender } from "./types";
import { WatchSvg } from "./watch-svg";

const STYLES: IndexStyle[] = ["batons", "arabes", "plongee", "montagne", "terrain-24h", "romains", "romains-chapitre", "arabes-orientaux", "arabes-chapitre", "sky", "diary", "fantaisie"];
const TEXTURES: DialTexture[] = ["emaille", "soleille", "mat", "soleil-profond", "rayonne"];

function rendre(patch: Partial<WatchRender>, extra: { yaw?: number; detail?: "full" | "compact" } = {}) {
  const render: WatchRender = { ...BASE_RENDER, ...patch, time: { hours: 10, minutes: 10, seconds: 37 } };
  return renderToStaticMarkup(createElement(WatchSvg, { id: "t", render, label: "test", ...extra }));
}

describe("styles de cadran", () => {
  it.each(STYLES)("%s se dessine sans valeur invalide, de face, en vue projetée et en vignette", (indexStyle) => {
    for (const extra of [{}, { yaw: 40 }, { detail: "compact" as const }]) {
      const svg = rendre({ indexStyle }, extra);
      expect(svg).toContain('data-layer="index"');
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it.each(TEXTURES)("la texture %s se dessine", (dialTexture) => {
    expect(rendre({ dialTexture })).not.toMatch(/NaN|undefined/);
  });

  it("le guichet de date n'apparaît que s'il est demandé", () => {
    expect(rendre({ indexStyle: "arabes-orientaux", showDate: true })).toContain("guichet-date");
    expect(rendre({ indexStyle: "arabes-orientaux", showDate: false })).not.toContain("guichet-date");
  });

  it("l'encre des romains laqués suit le catalogue", () => {
    expect(rendre({ indexStyle: "romains-chapitre", indexInk: "#A7232F" })).toContain("#A7232F");
  });

  it("la mise en page du cadran suit le style", () => {
    expect(dialLayout("batons").variant).toBe("standard");
    expect(dialLayout("sky").variant).toBe("sky");
    expect(dialLayout("fantaisie").signature).toBe("aucune");
    expect(dialLayout("arabes-chapitre").minuterie).toBe("chiffree");
  });
});
