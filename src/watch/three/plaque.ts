"use client";

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Defs } from "../parts/defs";
import { BackView } from "../parts/back";
import { PlaqueCadranSvg } from "../watch-svg";
import type { WatchRender } from "../types";

/* ───────────────────────── Plaque imprimée en texture ─────────────────────
   Le cadran, ses index et l'insert de lunette ne sont pas remodelés en 3D : le
   moteur SVG du site les dessine déjà pour chaque configuration. On rend
   `PlaqueCadranSvg` dans une racine React détachée, on embarque les polices du
   site (une image SVG n'a pas accès aux @font-face de la page), puis on
   rastérise sur un canevas qui devient la texture du cadran et de la lunette. */

const JOURS = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

let polices: Promise<string> | null = null;

/** Les @font-face du site, fichiers inlinés en base64. Calculé une fois par page. */
function stylePolices(): Promise<string> {
  if (polices) return polices;
  polices = (async () => {
    const calcule = getComputedStyle(document.documentElement);
    const piles = { "--font-title": calcule.getPropertyValue("--font-title").trim(), "--font-ui": calcule.getPropertyValue("--font-ui").trim() };
    const familles = new Set([...nomsDe(piles["--font-title"]), ...nomsDe(piles["--font-ui"])]);
    const regles: { css: string; src: string; base: string }[] = [];
    for (const feuille of document.styleSheets) {
      let liste: CSSRuleList;
      try {
        liste = feuille.cssRules;
      } catch {
        continue; // feuille d'une autre origine : illisible, et sans police du site
      }
      for (const regle of liste) {
        if (!(regle instanceof CSSFontFaceRule)) continue;
        const famille = nomsDe(regle.style.getPropertyValue("font-family"))[0];
        if (!famille || !familles.has(famille) || !latine(regle.style.getPropertyValue("unicode-range"))) continue;
        regles.push({ css: regle.cssText, src: regle.style.getPropertyValue("src"), base: feuille.href ?? document.baseURI });
      }
    }
    const fichiers = new Map<string, Promise<string | null>>();
    let texte = "";
    for (const regle of regles) {
      let css = regle.css;
      for (const [, brut] of regle.src.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
        if (!brut || brut.startsWith("data:")) continue;
        const absolue = new URL(brut, regle.base).href;
        let lecture = fichiers.get(absolue);
        if (!lecture) {
          lecture = fetch(absolue)
            .then((reponse) => (reponse.ok ? reponse.arrayBuffer() : null))
            .then((tampon) => (tampon ? `data:font/woff2;base64,${base64(tampon)}` : null))
            .catch(() => null);
          fichiers.set(absolue, lecture);
        }
        const donnees = await lecture;
        if (donnees) css = css.replace(brut, donnees);
      }
      texte += `${css}\n`;
    }
    return `${texte}svg{--font-title:${piles["--font-title"]};--font-ui:${piles["--font-ui"]}}`;
  })();
  return polices;
}

function nomsDe(pile: string): string[] {
  return pile
    .split(",")
    .map((nom) => nom.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function latine(plage: string): boolean {
  return !plage || /U\+0{0,2}0?0-|U\+0000\b/i.test(plage);
}

function base64(tampon: ArrayBuffer): string {
  const octets = new Uint8Array(tampon);
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode.apply(null, Array.from(octets.subarray(i, i + 0x8000)));
  return btoa(binaire);
}

/** Jour et quantième du guichet, écrits comme le fait l'horloge vivante. */
function dater(svg: string): string {
  const maintenant = new Date();
  return svg
    .replace(/(<text\b[^>]*data-guichet="jour"[^>]*>)[^<]*/, `$1${JOURS[maintenant.getDay()] ?? ""}`)
    .replace(/(<text\b[^>]*data-guichet="quantieme"[^>]*>)[^<]*/, `$1${maintenant.getDate()}`);
}

/** Plaque de face, ou fond vu de dos (sans bracelet ni couronne). */
export type Plaque = "face" | "dos";

function element(plaque: Plaque, id: string, render: WatchRender) {
  if (plaque === "face") return createElement(PlaqueCadranSvg, { id, render });
  return createElement(
    "svg",
    { viewBox: "0 0 1000 1000", xmlns: "http://www.w3.org/2000/svg" },
    createElement(Defs, { uid: id, render, detail: "full" }),
    createElement(BackView, { uid: id, render }),
  );
}

/** Balisage d'une plaque pour une configuration, rendu hors du document. */
function balisage(plaque: Plaque, id: string, render: WatchRender): string {
  const conteneur = document.createElement("div");
  const racine = createRoot(conteneur);
  flushSync(() => racine.render(element(plaque, id, render)));
  const svg = conteneur.innerHTML;
  racine.unmount();
  return svg;
}

/**
 * Canevas carré `cote` × `cote` portant la plaque imprimée. Le repère est celui
 * du moteur SVG : le pixel (0, 0) est le coin haut-gauche du cadre 1000 × 1000.
 */
export async function rasteriserPlaque(plaque: Plaque, id: string, render: WatchRender, cote: number): Promise<HTMLCanvasElement> {
  const style = await stylePolices();
  const svg = dater(balisage(plaque, id, render)).replace(
    /^<svg\b[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${cote}" height="${cote}" viewBox="0 0 1000 1000"><style>${style}</style>`,
  );
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image(cote, cote);
    image.src = url;
    await image.decode();
    const toile = document.createElement("canvas");
    toile.width = cote;
    toile.height = cote;
    toile.getContext("2d")?.drawImage(image, 0, 0, cote, cote);
    return toile;
  } finally {
    URL.revokeObjectURL(url);
  }
}
