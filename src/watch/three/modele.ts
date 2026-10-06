import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, DEFAULT_TIME, POSE_GMT_OFFSET_DEG, R_BEZEL_IN, R_BEZEL_OUT, R_CASE, R_LUG_TIP, SIZE_SCALE, dialScale, handAngles } from "../geometry";
import { LUME_FILL, METALS, mix } from "../palette";
import { LUG_INNER, lugPath } from "../parts/case";
import { D_NOTCH, D_TIP, cushionOutline } from "../parts/cushion";
import { flankLayout } from "../watch-svg";
import type { CaseFinish, HandShape, MetalTone, WatchRender } from "../types";

/* ───────────────────────── Montre 3D procédurale ──────────────────────────
   Reconstruction img2threejs des montres du site (spec et preuves :
   `.img2threejs/object-sculpt-spec.json`). Une seule fabrique, paramétrée par
   `WatchRender` comme le moteur SVG, dont elle reprend les contours (coussin,
   cornes) et les cotes (rayons, échelles de cadran, tailles de boîte).

   Repère : unités du moteur SVG (le boîtier de 40 mm a un rayon de 352, soit
   17,6 unités par mm), origine au centre du plan de joint fond / carrure.
   +X vers 3 h, +Y vers midi, +Z sort du cadran vers l'observateur. (La spec
   décrit le même objet en millimètres, +Y normale du cadran : une rotation.)

   Ce qui est imprimé ou appliqué (cadran, index, guichet, insert de lunette,
   fond gravé) vient des textures de `plaque.ts` ; tout le reste est en volume. */

export const MM = R_CASE / 20;

/** Hauteurs (axe Z), relevées sur la vue de profil. */
const H_CARRURE = 6.4 * MM;
const H_LUNETTE = 1.5 * MM;
const Z_LUNETTE = H_CARRURE + H_LUNETTE;
// Un peu au-dessus du plat de la carrure : le coussin est extrudé plein, et deux
// faces à la même hauteur se disputent les pixels (moirage du cadran).
const Z_CADRAN = H_CARRURE + 0.2 * MM;
const P_FOND = 2.9 * MM;

const RUGOSITE: Record<CaseFinish, number> = { brosse: 0.3, poli: 0.08, microbille: 0.55 };

export interface Montre3D {
  racine: THREE.Group;
  /** Pose les aiguilles à une heure donnée. */
  regler: (heure: { hours: number; minutes: number; seconds: number }) => void;
  /** L'heure est imposée par la configuration : les aiguilles ne bougent pas. */
  heureFigee: boolean;
  liberer: () => void;
}

export interface TexturesMontre {
  /** Plaque de face : cadran, index et insert, repère SVG 1000 × 1000. */
  face: THREE.Texture;
  /** Fond vu de dos, même repère. */
  dos: THREE.Texture;
  /** Relief du brossage rayonnant, même repère (absent hors navigateur). */
  brossage?: THREE.Texture;
}

type Garder = <T extends { dispose: () => void }>(objet: T) => T;

export function creerMontre3D(render: WatchRender, textures: TexturesMontre): Montre3D {
  const jetables = new Set<{ dispose: () => void }>();
  const garder: Garder = (objet) => {
    jetables.add(objet);
    return objet;
  };

  const racine = new THREE.Group();
  racine.name = "montre";
  racine.scale.setScalar(SIZE_SCALE[render.caseSize] ?? 1);

  const flank = flankLayout(render);
  const k = dialScale(render.bezelStyle);
  const rVerre = R_BEZEL_IN * k;
  const chrono = render.movement === "VK64";
  const gmt = render.movement === "NH34";

  // ── Matières ────────────────────────────────────────────────────────────
  // Albédo d'un métal : la teinte médiane de sa rampe. La clarté du dessin SVG
  // vient de ses reflets peints ; ici l'environnement les apporte.
  const metal = (ton: MetalTone, rugosite: number) =>
    garder(new THREE.MeshPhysicalMaterial({ color: mix(METALS[ton].light, METALS[ton].mid, 0.45), metalness: 1, roughness: rugosite }));
  const boitier = metal(render.caseMetal, RUGOSITE[render.caseFinish]);
  const poli = metal(render.caseMetal, 0.08);
  const plaque = garder(new THREE.MeshStandardMaterial({ map: textures.face, roughness: 0.45, metalness: 0 }));
  const fondGrave = garder(new THREE.MeshPhysicalMaterial({ map: textures.dos, roughness: 0.35, metalness: 0.4 }));
  const verre = garder(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.03,
      transparent: true,
      opacity: render.antiGlare ? 0.03 : 0.07,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      depthWrite: false,
    }),
  );

  // ── Carrure, cornes ─────────────────────────────────────────────────────
  if (flank.coussin) {
    // Le grand plat du coussin est brossé en rayons depuis le centre : c'est ce
    // qui accroche la lumière en éventail sur la vue de face.
    const matiere = textures.brossage && render.caseFinish === "brosse" ? garder(boitier.clone()) : boitier;
    if (matiere !== boitier && textures.brossage) {
      matiere.bumpMap = textures.brossage;
      matiere.bumpScale = 0.35;
    }
    const corps = mesh(extruder(cushionOutline(), H_CARRURE - 8, 4), matiere, "carrure");
    corps.position.z = 4;
    racine.add(plan(corps));
  } else {
    racine.add(
      tourner(
        [
          [R_CASE * 0.8, 0],
          [R_CASE - 8, 0],
          [R_CASE, 8],
          [R_CASE, H_CARRURE - 8],
          [R_CASE - 8, H_CARRURE],
          [R_BEZEL_IN, H_CARRURE],
        ],
        boitier,
        "carrure",
      ),
    );
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const corne = mesh(extruder(lugPath(sx, sy), H_CARRURE * 0.62, 5), boitier, "corne");
      corne.position.z = H_CARRURE * 0.3;
      racine.add(plan(corne));
    }
  }

  // ── Fond : bague polie, puis disque gravé (texture de la vue de dos) ─────
  const rFond = (flank.coussin ? 0.84 : 0.86) * R_CASE;
  racine.add(
    tourner(
      [
        [rFond * 0.8, -P_FOND],
        [rFond * 0.92, -P_FOND * 0.9],
        [rFond, -P_FOND * 0.4],
        [rFond, 1],
      ],
      poli,
      "fond",
    ),
  );
  const gravure = mesh(disque(rFond * 0.8 + 1, true), fondGrave, "gravure");
  gravure.position.z = -P_FOND;
  gravure.rotation.y = Math.PI;
  racine.add(gravure);

  // ── Lunette ─────────────────────────────────────────────────────────────
  const aInsert = render.bezelStyle === "plongee" || render.bezelStyle === "gmt" || render.bezelStyle === "tachymetre";
  racine.add(
    tourner(
      [
        [R_BEZEL_IN - 4, H_CARRURE],
        [R_BEZEL_OUT, H_CARRURE],
        [R_BEZEL_OUT + 2, H_CARRURE + 4],
        [R_BEZEL_OUT + 2, Z_LUNETTE - 6],
        [R_BEZEL_OUT - 6, Z_LUNETTE],
        [rVerre, Z_LUNETTE],
        [rVerre, Z_CADRAN],
      ],
      render.bezelStyle === "cannelee" || render.bezelStyle === "lisse" ? poli : boitier,
      "lunette",
    ),
  );
  if (aInsert) {
    const insert = mesh(anneau(rVerre + 3, R_BEZEL_OUT - 9), plaque, "insert");
    insert.position.z = Z_LUNETTE + 0.4;
    racine.add(insert);
  }
  // Moletage d'une lunette tournante, cannelures d'une habillée : des dents
  // instanciées sur le pourtour, un seul appel de dessin.
  if (render.bezelStyle === "plongee" || render.bezelStyle === "gmt" || render.bezelStyle === "cannelee") {
    const cannelee = render.bezelStyle === "cannelee";
    const nombre = cannelee ? 72 : 120;
    const dent = garder(cannelee ? new THREE.BoxGeometry(5, 30, 7) : new THREE.BoxGeometry(4.5, 7, H_LUNETTE - 10));
    const dents = new THREE.InstancedMesh(dent, poli, nombre);
    dents.name = cannelee ? "cannelures" : "moletage";
    const m = new THREE.Matrix4();
    for (let i = 0; i < nombre; i++) {
      const a = (i / nombre) * Math.PI * 2;
      const r = cannelee ? (rVerre + R_BEZEL_OUT) / 2 : R_BEZEL_OUT + 3;
      const z = cannelee ? Z_LUNETTE + 1 : H_CARRURE + H_LUNETTE / 2;
      m.makeRotationZ(-a).setPosition(Math.sin(a) * r, Math.cos(a) * r, z);
      dents.setMatrixAt(i, m);
    }
    racine.add(dents);
  }

  // ── Cadran (plaque imprimée) ────────────────────────────────────────────
  const cadran = mesh(disque(rVerre), plaque, "cadran");
  cadran.position.z = Z_CADRAN;
  racine.add(cadran);

  // ── Aiguilles ───────────────────────────────────────────────────────────
  // Satinées plutôt que miroir : polies, elles reflètent le fond sombre du studio et disparaissent.
  const metalAiguilles = metal(render.handMetal, 0.28);
  const lume = garder(new THREE.MeshStandardMaterial({ color: LUME_FILL, roughness: 0.6, emissive: LUME_FILL, emissiveIntensity: 0.18 }));
  const accent = render.accentHandColor ? garder(new THREE.MeshPhysicalMaterial({ color: render.accentHandColor, roughness: 0.25, clearcoat: 1 })) : metalAiguilles;
  const aiguille = (forme: Forme, z: number, matiere: THREE.Material) => {
    const groupe = new THREE.Group();
    groupe.add(mesh(extruderForme(forme.corps, 2.2), matiere, "aiguille"));
    if (render.lume && forme.lume) {
      const insert = mesh(extruderForme(forme.lume, 0.6), lume, "lume");
      insert.position.z = 2.4;
      groupe.add(insert);
    }
    groupe.position.z = z;
    groupe.scale.set(k, k, 1);
    racine.add(groupe);
    return groupe;
  };
  const heures = aiguille(formeAiguille(render.handShape, "heure"), Z_CADRAN + 5, metalAiguilles);
  const gmtAiguille = gmt ? aiguille(formeGmt(), Z_CADRAN + 8, accent) : null;
  const minutes = aiguille(formeAiguille(render.handShape, "minute"), Z_CADRAN + 11, metalAiguilles);
  const secondes = aiguille(formeSeconde(), Z_CADRAN + 15, chrono ? accent : metalAiguilles);
  const canon = mesh(new THREE.CylinderGeometry(9 * k, 9 * k, 6, 32), poli, "canon");
  canon.rotation.x = Math.PI / 2;
  canon.position.z = Z_CADRAN + 17;
  racine.add(canon);

  // ── Verre ───────────────────────────────────────────────────────────────
  const fleche = render.crystal === "box" ? 2.2 * MM : render.crystal === "bombe" ? 1.4 * MM : 0.3 * MM;
  const flanc = render.crystal === "box" ? 0.9 * MM : 0;
  const pointsVerre: Array<readonly [number, number]> = [[rVerre + 2, Z_LUNETTE - 2]];
  if (flanc) pointsVerre.push([rVerre + 2, Z_LUNETTE + flanc]);
  for (let i = 1; i <= 16; i++) {
    const t = (i / 16) * (Math.PI / 2);
    pointsVerre.push([Math.max(0.001, (rVerre + 2) * Math.cos(t)), Z_LUNETTE + flanc + fleche * Math.sin(t)]);
  }
  const verreMesh = tourner(pointsVerre, verre, "verre");
  verreMesh.renderOrder = 2;
  racine.add(verreMesh);

  // ── Couronnes, poussoirs ───────────────────────────────────────────────
  const metalCouronne = metal(render.crownMetal, 0.16);
  const couronne = (heure: 2 | 3 | 4, taille: number, style: WatchRender["crownStyle"]) => {
    const r = (style === "oignon" ? 4.2 : 3.4) * MM * taille;
    const longueur = (style === "oignon" ? 3.2 : 2.6) * MM * taille;
    const geo = new THREE.CylinderGeometry(r, r, longueur, 72, 1);
    if (style !== "lisse") moleter(geo, r, 0.05);
    const tete = mesh(geo, metalCouronne, "couronne");
    const a = (heure * 30 * Math.PI) / 180;
    // Un coussin enveloppe sa couronne : elle s'y enfonce à demi.
    const depart = flank.coussin ? flank.offsetAt(heure) + R_CASE + 9 - 0.8 * MM : R_CASE;
    const d = depart + longueur / 2;
    tete.position.set(Math.sin(a) * d, Math.cos(a) * d, H_CARRURE * 0.5);
    tete.rotation.z = -a;
    racine.add(tete);
  };
  couronne(flank.crownAt, 1, render.crownStyle);
  if (flank.secondCrownAt) couronne(flank.secondCrownAt, 0.8, "lisse");
  if (chrono) {
    for (const heure of [2, 4] as const) {
      const a = (heure * 30 * Math.PI) / 180;
      const poussoir = mesh(new THREE.CylinderGeometry(1.6 * MM, 1.6 * MM, 3.4 * MM, 32), poli, "poussoir");
      const d = R_CASE + 1.7 * MM;
      poussoir.position.set(Math.sin(a) * d, Math.cos(a) * d, H_CARRURE * 0.5);
      poussoir.rotation.z = -a;
      racine.add(poussoir);
    }
  }

  // ── Bracelet ────────────────────────────────────────────────────────────
  racine.add(bracelet(render, flank.coussin, boitier, poli, garder));

  // ── Heure ───────────────────────────────────────────────────────────────
  const regler = (heure: { hours: number; minutes: number; seconds: number }) => {
    const angles = handAngles(heure);
    const rad = (deg: number) => (-deg * Math.PI) / 180;
    heures.rotation.z = rad(angles.hour);
    minutes.rotation.z = rad(angles.minute);
    // La trotteuse centrale d'un chronographe est arrêtée à midi.
    secondes.rotation.z = chrono ? 0 : rad(angles.second);
    if (gmtAiguille) gmtAiguille.rotation.z = rad(angles.gmt + (render.time ? POSE_GMT_OFFSET_DEG : 0));
  };
  regler(render.time ?? DEFAULT_TIME);

  racine.traverse((objet) => {
    if (objet instanceof THREE.Mesh) jetables.add(objet.geometry);
  });

  return {
    racine,
    regler,
    heureFigee: render.time !== undefined,
    liberer: () => jetables.forEach((objet) => objet.dispose()),
  };
}

// ── Bracelet ──────────────────────────────────────────────────────────────

/**
 * Deux brins qui partent de l'entrecorne, filent droit jusqu'à la pointe des
 * cornes puis s'enroulent vers le bas, comme posés sur un poignet. Acier :
 * maillons instanciés (trois rangs, centre poli ; cinq pour un jubilé).
 * Cuir, caoutchouc, NATO : segments jointifs d'une seule matière.
 */
function bracelet(render: WatchRender, coussin: boolean, brosse: THREE.Material, poli: THREE.Material, garder: Garder): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = "bracelet";
  const acier = render.strapKind === "acier-3-maillons" || render.strapKind === "acier-jubile";
  const largeur = 2 * LUG_INNER - 4;
  const epaisseur = acier ? 3.6 * MM : render.strapKind === "nato" ? 1.4 * MM : 3 * MM;
  const pas = acier ? 4.2 * MM : 5 * MM;
  const segments = acier ? 12 : 10;
  const y0 = coussin ? D_NOTCH : 290;
  const pointe = coussin ? D_TIP : R_LUG_TIP;
  const z0 = H_CARRURE * 0.45;
  // Comme sur la vue de profil du site : les brins plongent dès la sortie des
  // cornes (trois maillons pour tourner d'un quart de tour), puis tombent droit.
  const courbure = (30 * Math.PI) / 180;

  // Pose (centre, inclinaison) et longueur de chaque segment du brin de midi ;
  // celui de 6 h en est le miroir.
  const poses: Array<{ matrice: THREE.Matrix4; longueur: number }> = [
    { matrice: new THREE.Matrix4().makeTranslation(0, (y0 + pointe) / 2, z0), longueur: pointe - y0 + 2 },
  ];
  const tete = new THREE.Vector3(0, pointe, z0);
  let angle = 0;
  for (let i = 0; i < segments; i++) {
    if (i > 0 && angle < Math.PI / 2 - 0.01) angle += courbure;
    const avance = new THREE.Vector3(0, Math.cos(angle), -Math.sin(angle)).multiplyScalar(pas);
    const milieu = tete.clone().addScaledVector(avance, 0.5);
    poses.push({ matrice: new THREE.Matrix4().makeRotationX(-angle).setPosition(milieu), longueur: acier ? pas - 2 : pas + 1 });
    tete.add(avance);
  }
  // Le brin de 6 h : celui de midi tourné d'un demi-tour autour de l'axe du
  // cadran. Surtout pas un miroir : une instance de déterminant négatif garde
  // ses faces à l'envers (three ne corrige l'enroulement que par objet).
  const demiTour = new THREE.Matrix4().makeRotationZ(Math.PI);
  const toutes = poses.flatMap((pose) => [pose, { matrice: demiTour.clone().multiply(pose.matrice), longueur: pose.longueur }]);

  const poser = (maillons: THREE.InstancedMesh, decalageX: number) =>
    toutes.forEach(({ matrice, longueur }, i) => {
      const m = matrice.clone().multiply(new THREE.Matrix4().makeTranslation(decalageX, 0, 0)).multiply(new THREE.Matrix4().makeScale(1, longueur, 1));
      maillons.setMatrixAt(i, m);
    });

  if (acier) {
    const rangs = render.strapKind === "acier-jubile" ? [0.26, 0.12, 0.24, 0.12, 0.26] : [0.33, 0.34, 0.33];
    let x = -largeur / 2;
    rangs.forEach((part, rang) => {
      const l = largeur * part - 2;
      const centre = x + (largeur * part) / 2;
      x += largeur * part;
      const centrePoli = rang % 2 === 1;
      const maillons = new THREE.InstancedMesh(garder(new RoundedBoxGeometry(l, 1, epaisseur, 2, 3)), centrePoli ? poli : brosse, toutes.length);
      maillons.name = "maillons";
      poser(maillons, centre);
      groupe.add(maillons);
    });
    return groupe;
  }

  const matiere = garder(
    new THREE.MeshPhysicalMaterial({
      color: render.strapColor,
      roughness: render.strapKind === "cuir-glace" ? 0.28 : render.strapKind === "caoutchouc" ? 0.7 : render.strapKind === "nato" ? 0.85 : 0.6,
      clearcoat: render.strapKind === "cuir-glace" ? 0.7 : 0,
      sheen: render.strapKind === "nato" ? 0.6 : 0,
      sheenColor: new THREE.Color(render.strapColor),
    }),
  );
  // Un brin souple est une seule bande continue, balayée sur le même trajet que
  // les maillons : des segments juxtaposés y feraient des marches.
  const brin = garder(bande(y0, pointe, z0, pas * segments, largeur, epaisseur));
  const haut = mesh(brin, matiere, "brin");
  const bas = mesh(brin, matiere, "brin");
  bas.rotation.z = Math.PI;
  groupe.add(haut, bas);
  return groupe;
}

/**
 * Bande de section rectangulaire arrondie, balayée de l'entrecorne (y0) à la
 * pointe des cornes, puis sur `longueur` en s'enroulant d'un quart de tour vers
 * le fond, comme les maillons. Largeur selon X, épaisseur selon la normale.
 */
function bande(y0: number, pointe: number, z0: number, longueur: number, largeur: number, epaisseur: number): THREE.BufferGeometry {
  // Section : contour d'un rectangle arrondi, (u selon X, v selon la normale).
  const section: Array<readonly [number, number]> = [];
  const r = epaisseur / 2;
  const demi = largeur / 2 - r;
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI;
    section.push([demi + r * Math.cos(a), r * Math.sin(a)]);
  }
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI / 2 + (i / 8) * Math.PI;
    section.push([-demi + r * Math.cos(a), r * Math.sin(a)]);
  }
  // Trajet : droit jusqu'à la pointe (et un peu au-delà), un quart de tour, puis droit.
  const droit = pointe - y0 + longueur / 12;
  const rayon = longueur / 4 / (Math.PI / 2);
  const total = pointe - y0 + longueur;
  const etapes = 48;
  const ds = total / etapes;
  const centre = new THREE.Vector3(0, y0, z0);
  const positions: number[] = [];
  let angle = 0;
  for (let i = 0; i <= etapes; i++) {
    if (i > 0) {
      const suivant = i * ds > droit ? Math.min(Math.PI / 2, angle + ds / rayon) : angle;
      const moyen = (angle + suivant) / 2;
      centre.y += Math.cos(moyen) * ds;
      centre.z -= Math.sin(moyen) * ds;
      angle = suivant;
    }
    for (const [u, v] of section) positions.push(u, centre.y + Math.sin(angle) * v, centre.z + Math.cos(angle) * v);
  }
  const n = section.length;
  const indices: number[] = [];
  for (let i = 0; i < etapes; i++) {
    for (let j = 0; j < n; j++) {
      const a = i * n + j;
      const b = i * n + ((j + 1) % n);
      indices.push(a, b, a + n, b, b + n, a + n);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ── Aiguilles ─────────────────────────────────────────────────────────────

interface Forme {
  corps: THREE.Shape;
  lume?: THREE.Shape;
}

/**
 * Silhouette d'une aiguille pointant vers midi (+Y), axe à l'origine, aux
 * longueurs du moteur SVG (`parts/hands.tsx`). Stylisée : une plaque extrudée
 * à arêtes adoucies, pas les deux facettes pliées du dessin.
 */
function formeAiguille(style: HandShape, role: "heure" | "minute"): Forme {
  const longueur = role === "heure" ? (style === "fleche" ? 170 : 182) : 248;
  // Largeurs du moteur SVG (`PROPORTIONS` de parts/hands.tsx), ramenées à la
  // plaque pleine : le dessin les élargit de ses facettes et de son ombre.
  const LARGEURS: Record<HandShape, readonly [number, number]> = { glaive: [36, 26], mercedes: [36, 26], crayon: [36, 26], fleche: [62, 34], dauphine: [42, 32], cathedrale: [54, 28] };
  const largeur = LARGEURS[style][role === "heure" ? 0 : 1] * 0.9;
  const w = largeur / 2;
  const queue = 34;
  const corps = new THREE.Shape();
  const lume = new THREE.Shape();
  if (style === "dauphine") {
    corps.moveTo(0, -queue).lineTo(w, 22).lineTo(0, longueur).lineTo(-w, 22).closePath();
    return { corps };
  }
  if (style === "crayon") {
    corps.moveTo(-w * 0.6, -queue).lineTo(w * 0.6, -queue).lineTo(w * 0.6, longueur - 24).lineTo(0, longueur).lineTo(-w * 0.6, longueur - 24).closePath();
    lume.moveTo(-w * 0.45, 36).lineTo(w * 0.45, 36).lineTo(w * 0.45, longueur - 30).lineTo(-w * 0.45, longueur - 30).closePath();
    return { corps, lume };
  }
  if (style === "fleche" && role === "heure") {
    corps.moveTo(-5, -queue).lineTo(5, -queue).lineTo(5, longueur - 64).lineTo(w, longueur - 64).lineTo(0, longueur).lineTo(-w, longueur - 64).lineTo(-5, longueur - 64).closePath();
    lume.moveTo(-w + 8, longueur - 58).lineTo(w - 8, longueur - 58).lineTo(0, longueur - 12).closePath();
    return { corps, lume };
  }
  if (style === "mercedes" && role === "heure") {
    // Tige, puis cercle ajouré dont la pointe repart en flèche.
    corps.moveTo(-3, -queue).lineTo(3, -queue).lineTo(3, longueur - 78).lineTo(w + 4, longueur - 60).lineTo(w, longueur - 34).lineTo(0, longueur).lineTo(-w, longueur - 34).lineTo(-w - 4, longueur - 60).lineTo(-3, longueur - 78).closePath();
    lume.absarc(0, longueur - 56, 13, 0, Math.PI * 2, false);
    return { corps, lume };
  }
  // Glaive, cathédrale (silhouette pleine) et minutes des styles sans forme propre.
  corps.moveTo(-3, -queue).lineTo(3, -queue).lineTo(w, 24).lineTo(w * 0.8, longueur - 30).lineTo(0, longueur).lineTo(-w * 0.8, longueur - 30).lineTo(-w, 24).closePath();
  lume.moveTo(-w * 0.6, 34).lineTo(w * 0.6, 34).lineTo(w * 0.5, longueur - 32).lineTo(0, longueur - 12).lineTo(-w * 0.5, longueur - 32).closePath();
  return { corps, lume };
}

function formeSeconde(): Forme {
  // Trotteuse « sucette » : tige fine, pastille luminescente aux trois quarts.
  const corps = new THREE.Shape();
  corps.moveTo(-2.4, -70).lineTo(2.4, -70).lineTo(2, 186).lineTo(9, 190).lineTo(9, 202).lineTo(1.4, 206).lineTo(1, 262).lineTo(-1, 262).lineTo(-1.4, 206).lineTo(-9, 202).lineTo(-9, 190).lineTo(-2, 186).closePath();
  const lume = new THREE.Shape();
  lume.absarc(0, 196, 6, 0, Math.PI * 2, false);
  return { corps, lume };
}

function formeGmt(): Forme {
  const corps = new THREE.Shape();
  corps.moveTo(-2, -20).lineTo(2, -20).lineTo(2, 180).lineTo(13, 180).lineTo(0, 214).lineTo(-13, 180).lineTo(-2, 180).closePath();
  const lume = new THREE.Shape();
  lume.moveTo(-7, 186).lineTo(7, 186).lineTo(0, 204).closePath();
  return { corps, lume };
}

// ── Outils de géométrie ───────────────────────────────────────────────────

function mesh(geometrie: THREE.BufferGeometry, matiere: THREE.Material, nom: string): THREE.Mesh {
  const objet = new THREE.Mesh(geometrie, matiere);
  objet.name = nom;
  return objet;
}

/**
 * Groupe qui ramène le repère SVG (y vers le bas, centre en 500) dans celui de
 * la montre. Le miroir en Y inverse l'enroulement : three le compense de
 * lui-même pour une matrice de déterminant négatif.
 */
function plan(objet: THREE.Object3D): THREE.Group {
  const groupe = new THREE.Group();
  groupe.scale.set(1, -1, 1);
  groupe.position.set(-C, C, 0);
  groupe.add(objet);
  return groupe;
}

/**
 * Contour SVG `d` en formes three. Les contours du moteur (coussin, cornes)
 * n'emploient que M, L, Q, C et Z en coordonnées absolues : pas besoin d'un
 * analyseur SVG complet (ni du DOM qu'exige `SVGLoader`).
 */
export function formesDe(d: string): THREE.Shape[] {
  const chemin = new THREE.ShapePath();
  const jetons = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  let i = 0;
  const nombre = () => Number(jetons[i++]);
  while (i < jetons.length) {
    const commande = jetons[i++]?.toUpperCase();
    if (commande === "M") chemin.moveTo(nombre(), nombre());
    else if (commande === "L") chemin.lineTo(nombre(), nombre());
    else if (commande === "Q") chemin.quadraticCurveTo(nombre(), nombre(), nombre(), nombre());
    else if (commande === "C") chemin.bezierCurveTo(nombre(), nombre(), nombre(), nombre(), nombre(), nombre());
    else if (commande === "Z") chemin.currentPath?.closePath();
    else throw new Error(`Commande de tracé non prise en charge : ${commande}`);
  }
  return chemin.toShapes();
}

/** Contour SVG `d` extrudé sur `profondeur`, arêtes adoucies. */
function extruder(d: string, profondeur: number, biseau: number): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(formesDe(d), { depth: profondeur, bevelEnabled: biseau > 0, bevelThickness: biseau, bevelSize: biseau, bevelSegments: 3, curveSegments: 24 });
  // Les flancs d'une extrusion sont facettés : on lisse les normales, sauf aux
  // arêtes vives (plus de 30°), qui restent tranchées comme sur un boîtier usiné.
  const lisse = toCreasedNormals(geo, Math.PI / 6);
  geo.dispose();
  return lisse;
}

function extruderForme(forme: THREE.Shape, profondeur: number): THREE.BufferGeometry {
  return new THREE.ExtrudeGeometry(forme, { depth: profondeur, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 1, curveSegments: 16 });
}

/** Pièce de révolution autour de l'axe du cadran, profil en (rayon, z). */
function tourner(profil: ReadonlyArray<readonly [number, number]>, matiere: THREE.Material, nom: string): THREE.Mesh {
  const geo = new THREE.LatheGeometry(
    profil.map(([r, z]) => new THREE.Vector2(r, z)),
    96,
  );
  // LatheGeometry tourne autour de Y, profil en (x, y) : on couche l'axe sur Z.
  geo.rotateX(Math.PI / 2);
  return mesh(geo, matiere, nom);
}

/** UV planaires dans le repère 1000 × 1000 du moteur SVG. */
function uvPlanaires(geo: THREE.BufferGeometry, miroir = false): THREE.BufferGeometry {
  const position = geo.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = 0.5 + (miroir ? -1 : 1) * (position.getX(i) / 1000);
    uv[i * 2 + 1] = 0.5 + position.getY(i) / 1000;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

function disque(rayon: number, miroir = false): THREE.BufferGeometry {
  return uvPlanaires(new THREE.CircleGeometry(rayon, 128), miroir);
}

function anneau(interieur: number, exterieur: number): THREE.BufferGeometry {
  return uvPlanaires(new THREE.RingGeometry(interieur, exterieur, 160, 1));
}

/** Cannelures d'une couronne : le rayon des faces latérales ondule. */
function moleter(geo: THREE.CylinderGeometry, rayon: number, profondeur: number) {
  const position = geo.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    if (Math.hypot(x, z) < rayon * 0.99) continue;
    const f = Math.cos(Math.atan2(z, x) * 24) > 0 ? 1 : 1 - profondeur;
    position.setXYZ(i, x * f, position.getY(i), z * f);
  }
  geo.computeVertexNormals();
}
