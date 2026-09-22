import { beforeAll, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SAMPLE_CATALOGUE } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import type { WatchRender } from "../types";
import { WatchSvg } from "../watch-svg";
import { pose } from "./geometry3d";

const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const DETAILS = ["full", "compact"] as const;
/** Bornes du poids d'un rendu (éléments SVG, `<defs>` compris). */
const NOEUDS_MAX = { full: 2600, compact: 900 } as const;

const nodes = (svg: string) => (svg.match(/<[a-zA-Z]/g) ?? []).length;
const ids = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1] as string);

/** Un rendu par montre, lacet et niveau de détail, fait une fois pour tous les tests. */
const cache = new Map<string, string>();
function rendre(id: string, render: WatchRender, yaw: number, detail: "full" | "compact"): string {
  const cle = `${id}/${yaw}/${detail}`;
  let svg = cache.get(cle);
  if (svg === undefined) {
    svg = renderToStaticMarkup(createElement(WatchSvg, { id, render, yaw, detail, label: `${id} ${yaw}` }));
    cache.set(cle, svg);
  }
  return svg;
}

const montres = SAMPLE_MODELS.flatMap((modele) => [
  { nom: `${modele.slug} (défaut)`, uid: `${modele.slug}-a`, render: defaultConfiguration(SAMPLE_CATALOGUE, modele).render },
  { nom: `${modele.slug} (variante)`, uid: `${modele.slug}-b`, render: altConfiguration(SAMPLE_CATALOGUE, modele).render },
]);

describe("pose", () => {
  it("place les quatre vues cardinales", () => {
    expect(pose(0)).toMatchObject({ s: 0, c: 1, front: true, side: 1 });
    expect(pose(90)).toMatchObject({ s: 1, c: 0, front: true, side: 1 });
    expect(pose(180)).toMatchObject({ s: 0, c: -1, front: false });
    expect(pose(270)).toMatchObject({ s: -1, c: 0, side: -1 });
    expect(pose(-90).theta).toBe(270);
    expect(pose(405).theta).toBe(45);
  });

  it("ne rend jamais une échelle nulle ou négative aux dessins à plat", () => {
    for (let yaw = 0; yaw < 360; yaw += 5) expect(pose(yaw).cf).toBeGreaterThanOrEqual(0.02);
  });
});

describe("vue projetée", () => {
  beforeAll(() => {
    for (const montre of montres) for (const yaw of ANGLES) for (const detail of DETAILS) rendre(montre.uid, montre.render, yaw, detail);
  }, 120_000);

  it("rend les neuf modèles et leur variante sous huit lacets, sans exception", () => {
    for (const montre of montres) {
      for (const yaw of ANGLES) {
        for (const detail of DETAILS) {
          expect(() => rendre(montre.uid, montre.render, yaw, detail), `${montre.nom} à ${yaw}° (${detail})`).not.toThrow();
        }
      }
    }
  });

  it("préfixe tous ses identifiants par `uid`, sans doublon", () => {
    for (const montre of montres) {
      for (const yaw of ANGLES) {
        const svg = rendre(montre.uid, montre.render, yaw, "full");
        const liste = ids(svg);
        expect(liste.length, `${montre.nom} à ${yaw}°`).toBeGreaterThan(0);
        expect(new Set(liste).size, `${montre.nom} à ${yaw}° : identifiants dupliqués`).toBe(liste.length);
        for (const id of liste) expect(id.startsWith(`${montre.uid}-`), `${montre.nom} : ${id}`).toBe(true);
      }
    }
  });

  it("garde les groupes d'aiguilles vivantes tant que le cadran est visible", () => {
    for (const montre of montres) {
      for (const yaw of [0, 45, 90, 270, 315]) {
        const svg = rendre(montre.uid, montre.render, yaw, "full");
        expect(svg, `${montre.nom} à ${yaw}°`).toContain('data-layer="aiguilles"');
        expect(svg, `${montre.nom} à ${yaw}°`).toContain('data-heure="vivante"');
        for (const role of ["heure", "minute", "seconde"]) expect(svg, `${montre.nom} à ${yaw}° : ${role}`).toContain(`data-aiguille="${role}"`);
      }
      for (const yaw of [135, 180, 225]) {
        expect(rendre(montre.uid, montre.render, yaw, "full"), `${montre.nom} à ${yaw}° : de dos, pas d'aiguilles`).not.toContain("data-aiguille=");
      }
    }
  });

  it("borne le nombre de nœuds", () => {
    for (const montre of montres) {
      for (const yaw of ANGLES) {
        for (const detail of DETAILS) {
          const total = nodes(rendre(montre.uid, montre.render, yaw, detail));
          expect(total, `${montre.nom} à ${yaw}° (${detail}) : ${total} nœuds`).toBeLessThanOrEqual(NOEUDS_MAX[detail]);
        }
      }
    }
  });

  it("est déterministe : deux rendus identiques", () => {
    const montre = montres[0]!;
    expect(rendre(montre.uid, montre.render, 45, "full")).toBe(rendre(montre.uid, montre.render, 45, "full"));
  });

  it("à 0° reprend le cadran et les aiguilles de la vue de face à l'identique", () => {
    for (const montre of montres.slice(0, 6)) {
      const face = renderToStaticMarkup(createElement(WatchSvg, { id: montre.uid, render: montre.render, label: "face" }));
      const projetee = rendre(montre.uid, montre.render, 0, "full");
      for (const couche of ["cadran", "aiguilles", "lunette"]) {
        const extrait = new RegExp(`<g[^>]*data-layer="${couche}"[\\s\\S]*?</g>`).exec(face)?.[0];
        expect(extrait, `${montre.nom} : couche ${couche}`).toBeTruthy();
        expect(projetee, `${montre.nom} : couche ${couche} à 0°`).toContain(extrait!.slice(0, 400));
      }
    }
  });
});
