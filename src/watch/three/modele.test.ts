import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { BASE_RENDER } from "../../lib/configurateur/resolve";
import { R_CASE, R_LUG_TIP } from "../geometry";
import { cushionOutline } from "../parts/cushion";
import type { WatchRender } from "../types";
import { MM, creerMontre3D, formesDe } from "./modele";

const textures = { face: new THREE.Texture(), dos: new THREE.Texture() };

function construire(patch: Partial<WatchRender> = {}) {
  const montre = creerMontre3D({ ...BASE_RENDER, ...patch }, textures);
  montre.racine.updateMatrixWorld(true);
  return montre;
}

function boite(objet: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(objet, true);
}

function triangles(racine: THREE.Object3D): number {
  let total = 0;
  racine.traverse((objet) => {
    if (!(objet instanceof THREE.Mesh)) return;
    const geo = objet.geometry as THREE.BufferGeometry;
    const n = (geo.index?.count ?? geo.getAttribute("position").count) / 3;
    total += n * (objet instanceof THREE.InstancedMesh ? objet.count : 1);
  });
  return total;
}

describe("montre 3D", () => {
  it("lit les contours du moteur SVG sans DOM", () => {
    const formes = formesDe(cushionOutline());
    expect(formes).toHaveLength(1);
    const xs = formes[0]!.getPoints().map((p) => p.x);
    expect(Math.min(...xs)).toBeLessThan(500 - 380);
    expect(Math.max(...xs)).toBeGreaterThan(500 + 380);
  });

  it.each(["acier-3-maillons", "cuir", "nato"] as const)("le bracelet %s part des cornes et s'enroule vers le fond", (strapKind) => {
    const { racine } = construire({ strapKind });
    const b = boite(racine.getObjectByName("bracelet")!);
    // Attaché : il passe sous la pointe des cornes, des deux côtés.
    expect(b.max.y).toBeGreaterThan(R_LUG_TIP);
    expect(b.min.y).toBeLessThan(-R_LUG_TIP);
    // Enroulé : les brins descendent sous le fond, côté poignet…
    expect(b.min.z).toBeLessThan(-6 * MM);
    // … au lieu de filer à plat le long de l'axe 12 h – 6 h.
    expect(b.max.y).toBeLessThan(R_LUG_TIP + 30 * MM);
  });

  it.each([3, 4] as const)("la couronne à %s h touche le flanc", (crownAt) => {
    for (const caseShape of ["rond", "coussin"] as const) {
      const { racine } = construire({ crownAt, caseShape });
      const centre = boite(racine.getObjectByName("couronne")!).getCenter(new THREE.Vector3());
      const distance = Math.hypot(centre.x, centre.y);
      expect(distance).toBeGreaterThan(R_CASE * 0.95);
      expect(distance).toBeLessThan(R_CASE * 1.25);
    }
  });

  it("les aiguilles tournent sous le verre, au-dessus du cadran", () => {
    for (const crystal of ["plat", "bombe", "box"] as const) {
      const { racine } = construire({ crystal });
      const verre = boite(racine.getObjectByName("verre")!);
      const cadran = boite(racine.getObjectByName("cadran")!);
      racine.traverse((objet) => {
        if (objet.name !== "aiguille") return;
        const b = boite(objet);
        expect(b.min.z).toBeGreaterThan(cadran.max.z);
        expect(b.max.z).toBeLessThan(verre.max.z);
      });
    }
  });

  it("met les aiguilles à l'heure", () => {
    const montre = construire();
    montre.regler({ hours: 3, minutes: 0, seconds: 0 });
    const heures = montre.racine.getObjectsByProperty("name", "aiguille")[0]!.parent!;
    expect(heures.rotation.z).toBeCloseTo(-Math.PI / 2);
  });

  it("tient le budget de la spec (60 000 triangles)", () => {
    const variantes: Partial<WatchRender>[] = [
      {},
      { strapKind: "acier-jubile", bezelStyle: "plongee", caseShape: "coussin" },
      { movement: "VK64", bezelStyle: "tachymetre", strapKind: "cuir" },
    ];
    for (const patch of variantes) expect(triangles(construire(patch).racine)).toBeLessThan(60_000);
  });
});
