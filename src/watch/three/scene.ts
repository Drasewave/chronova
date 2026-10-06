"use client";

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { creerMontre3D, type Montre3D } from "./modele";
import { rasteriserPlaque, type Plaque } from "./plaque";
import type { WatchRender, WatchView } from "../types";

/* ───────────────────────── Scène de la montre 3D ──────────────────────────
   Un rendu à la demande : rien ne tourne tant que rien ne bouge. Une image
   par seconde pour les aiguilles, des images en continu seulement pendant un
   geste, une transition de vue ou l'inertie qui suit un lâcher. Hors écran,
   plus rien du tout. */

/** Orientation de la montre pour chaque vue, caméra fixe sur +Z. */
const VUES: Record<WatchView, THREE.Quaternion> = {
  // De face, un léger trois-quarts : assez pour lire le volume, pas assez
  // pour perdre le cadran.
  face: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0.16, 0, "YXZ")),
  // De profil côté couronne, cadran vers le haut : la vue de profil du site,
  // à peine plongeante pour qu'on devine le galbe du verre.
  profil: new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.1)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)),
  dos: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, Math.PI - 0.16, 0, "YXZ")),
};

/**
 * Demi-hauteur cadrée, en unités. Plus large que le cadre 1000 × 1000 du SVG :
 * la perspective grossit ce qui avance vers l'objectif (verre, lunette), et la
 * montre doit garder la taille du dessin qu'elle remplace.
 */
const DEMI_CADRE = 600;
const FOV = 22;

export interface SceneMontre {
  vue: (vue: WatchView) => void;
  configuration: (render: WatchRender) => Promise<void>;
  detruire: () => void;
}

export interface OptionsScene {
  vue: WatchView;
  /** Glisser pour tourner la montre. */
  interactif: boolean;
}

/**
 * Monte la scène sur `toile`. Rejette si WebGL manque : l'appelant garde alors
 * le dessin SVG, qui est de toute façon affiché tant que la 3D n'est pas prête.
 */
export async function monterScene(toile: HTMLCanvasElement, id: string, render: WatchRender, options: OptionsScene): Promise<SceneMontre> {
  const tactile = window.matchMedia("(pointer: coarse)").matches;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true, alpha: true, powerPreference: "high-performance" });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, tactile ? 1.5 : 2));
  rendu.toneMapping = THREE.ACESFilmicToneMapping;
  rendu.toneMappingExposure = 0.9;
  rendu.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(rendu);
  const studio = new RoomEnvironment();
  const environnement = pmrem.fromScene(studio, 0.04).texture;
  studio.dispose();
  pmrem.dispose();
  scene.environment = environnement;
  // Le studio de `RoomEnvironment` est très clair : à pleine intensité l'acier
  // vire au blanc. Un studio photo garde des zones sombres dans les reflets.
  scene.environmentIntensity = 0.55;
  // La lumière du site vient du haut-gauche (ombres des SVG) : une boîte à
  // lumière principale au même endroit, pour les arêtes et les aiguilles.
  const cle = new THREE.DirectionalLight(0xffffff, 1.4);
  cle.position.set(-600, 900, 1400);
  scene.add(cle);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);
  camera.position.set(0, 0, DEMI_CADRE / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));

  const pivot = new THREE.Group();
  scene.add(pivot);
  const cote = tactile ? 1024 : 2048;
  const brossage = texturesBrossage();
  let montre: Montre3D | null = null;
  let textures: THREE.Texture[] = [];
  let detruit = false;

  // ── Orientation : vue choisie, plus le geste en cours ────────────────────
  const cible = VUES[options.vue].clone();
  const geste = { lacet: 0, tangage: 0, vitesse: 0, actif: false };
  const courante = cible.clone();
  const voulue = new THREE.Quaternion();
  const axeY = new THREE.Vector3(0, 1, 0);
  const axeX = new THREE.Vector3(1, 0, 0);
  const tangage = new THREE.Quaternion();
  pivot.quaternion.copy(courante);

  let visible = true;
  let trame = 0;
  const demander = () => {
    if (!trame && visible && !detruit) trame = requestAnimationFrame(image);
  };
  const image = () => {
    trame = 0;
    let encore = false;
    if (!geste.actif) {
      // Inertie du lacet, retour doux du tangage.
      if (Math.abs(geste.vitesse) > 0.0004 && !reduit) {
        geste.lacet += geste.vitesse;
        geste.vitesse *= 0.92;
        encore = true;
      } else geste.vitesse = 0;
      if (Math.abs(geste.tangage) > 0.001) {
        geste.tangage *= reduit ? 0 : 0.86;
        encore = true;
      }
    }
    voulue.setFromAxisAngle(axeY, geste.lacet).multiply(tangage.setFromAxisAngle(axeX, geste.tangage)).multiply(cible);
    if (reduit || geste.actif) courante.copy(voulue);
    else courante.slerp(voulue, 0.14);
    if (courante.angleTo(voulue) > 0.001) encore = true;
    pivot.quaternion.copy(courante);
    rendu.render(scene, camera);
    if (encore) demander();
  };

  // ── Heure vivante : une image par seconde ────────────────────────────────
  const tic = () => {
    if (!montre || montre.heureFigee) return;
    const maintenant = new Date();
    montre.regler({ hours: maintenant.getHours(), minutes: maintenant.getMinutes(), seconds: maintenant.getSeconds() });
    demander();
  };
  const horloge = window.setInterval(tic, 1000);

  // Deux choix rapprochés dans le configurateur : seule la dernière configuration gagne.
  let jeton = 0;
  const charger = async (configuration: WatchRender) => {
    const mien = ++jeton;
    const [face, dos] = await Promise.all(
      (["face", "dos"] as Plaque[]).map(async (plaque) => {
        const texture = new THREE.CanvasTexture(await rasteriserPlaque(plaque, `${id}-${plaque}`, configuration, plaque === "face" ? cote : cote / 2));
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = rendu.capabilities.getMaxAnisotropy();
        return texture;
      }),
    );
    if (detruit || mien !== jeton || !face || !dos) {
      face?.dispose();
      dos?.dispose();
      return;
    }
    const suivante = creerMontre3D(configuration, { face, dos, brossage });
    if (montre) {
      pivot.remove(montre.racine);
      montre.liberer();
    }
    textures.forEach((texture) => texture.dispose());
    textures = [face, dos];
    montre = suivante;
    pivot.add(montre.racine);
    tic();
    demander();
  };

  // ── Taille et visibilité ────────────────────────────────────────────────
  const ajuster = () => {
    const { clientWidth: l, clientHeight: h } = toile;
    if (!l || !h) return;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    // Toujours tout le cadre : sur un écran plus haut que large, on recule.
    const demiHauteur = l < h ? (DEMI_CADRE * h) / l : DEMI_CADRE;
    camera.position.z = demiHauteur / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.updateProjectionMatrix();
    demander();
  };
  const taille = new ResizeObserver(ajuster);
  taille.observe(toile);
  const regard = new IntersectionObserver(([entree]) => {
    visible = entree?.isIntersecting ?? true;
    if (visible) {
      tic();
      demander();
    }
  });
  regard.observe(toile);
  ajuster();

  // ── Geste : glisser horizontalement fait tourner la montre ──────────────
  // `touch-action: pan-y` laisse le défilement vertical au navigateur sur
  // téléphone : seul un glisser horizontal tourne la montre.
  let dernier: { x: number; y: number; t: number } | null = null;
  const bas = (event: PointerEvent) => {
    if (!options.interactif || (event.pointerType === "mouse" && event.button !== 0)) return;
    dernier = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    geste.actif = true;
    geste.vitesse = 0;
    toile.setPointerCapture(event.pointerId);
  };
  const deplace = (event: PointerEvent) => {
    if (!dernier) return;
    const dx = event.clientX - dernier.x;
    const dy = event.clientY - dernier.y;
    const pas = (Math.PI * 1.4) / Math.max(320, toile.clientWidth);
    geste.lacet += dx * pas;
    geste.vitesse = (dx * pas * 16) / Math.max(1, event.timeStamp - dernier.t);
    if (event.pointerType === "mouse") geste.tangage = THREE.MathUtils.clamp(geste.tangage + dy * pas, -0.5, 0.5);
    dernier = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    demander();
  };
  const haut = (event: PointerEvent) => {
    if (!dernier) return;
    dernier = null;
    geste.actif = false;
    if (toile.hasPointerCapture(event.pointerId)) toile.releasePointerCapture(event.pointerId);
    demander();
  };
  toile.style.touchAction = options.interactif ? "pan-y" : "";
  toile.addEventListener("pointerdown", bas);
  toile.addEventListener("pointermove", deplace);
  toile.addEventListener("pointerup", haut);
  toile.addEventListener("pointercancel", haut);

  const detruire = () => {
    detruit = true;
    cancelAnimationFrame(trame);
    window.clearInterval(horloge);
    taille.disconnect();
    regard.disconnect();
    toile.removeEventListener("pointerdown", bas);
    toile.removeEventListener("pointermove", deplace);
    toile.removeEventListener("pointerup", haut);
    toile.removeEventListener("pointercancel", haut);
    montre?.liberer();
    textures.forEach((texture) => texture.dispose());
    brossage.dispose();
    environnement.dispose();
    rendu.dispose();
  };

  try {
    await charger(render);
  } catch (erreur) {
    detruire();
    throw erreur;
  }

  return {
    vue: (vue) => {
      cible.copy(VUES[vue]);
      // Changer de vue repart de la vue elle-même, pas du lacet laissé par un geste.
      geste.lacet = 0;
      geste.tangage = 0;
      geste.vitesse = 0;
      demander();
    },
    configuration: charger,
    detruire,
  };
}

/**
 * Brossage rayonnant : de fins traits clairs et sombres partant du centre, en
 * carte de relief. Repère du moteur SVG (UV des capots d'extrusion en unités
 * 0–1000, ramenées à 0–1 par `repeat`). Tirage déterministe : même grain à
 * chaque chargement.
 */
function texturesBrossage(): THREE.Texture {
  const cote = 1024;
  const toile = document.createElement("canvas");
  toile.width = cote;
  toile.height = cote;
  const ctx = toile.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, cote, cote);
    let graine = 7;
    const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647);
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 5000; i++) {
      const a = hasard() * Math.PI * 2;
      const clair = hasard() > 0.5;
      ctx.strokeStyle = `rgba(${clair ? 255 : 0},${clair ? 255 : 0},${clair ? 255 : 0},${0.04 + hasard() * 0.1})`;
      ctx.beginPath();
      ctx.moveTo(cote / 2 + Math.cos(a) * cote * 0.05, cote / 2 + Math.sin(a) * cote * 0.05);
      ctx.lineTo(cote / 2 + Math.cos(a) * cote * 0.72, cote / 2 + Math.sin(a) * cote * 0.72);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(toile);
  texture.repeat.set(1 / 1000, 1 / 1000);
  return texture;
}
