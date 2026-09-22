"use client";

import { startTransition, useLayoutEffect, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WatchSvg } from "@/watch/watch-svg";
import type { WatchRender, WatchView } from "@/watch/types";

/* ─────────────────────────── Fabrique de poses ───────────────────────────
   La platine tournante (`platine-montre.tsx`) ne monte plus un dessin SVG à
   chaque pose : elle affiche des poses RASTÉRISÉES. La fabrique produit, pour
   une montre donnée, la chaîne SVG de chaque pose (lacet de 0 à 355° par pas de
   5°, 72 par tour), rendue UNE fois dans une racine React détachée du document
   — jamais dans le DOM visible —, puis sérialisée.

   Chaque pose est scindée en deux chaînes :
   - `fond` : tout le dessin SAUF les aiguilles, le verre et les pièces de flanc
     qui passent devant. C'est cette chaîne qui devient une image (`<img>`,
     puis bitmap) ; elle ne dépend pas de l'heure.
   - `vivant` : les aiguilles (groupe `data-layer="aiguilles"`), le verre (et sa
     loupe) et les pièces de flanc devant, avec leurs transformations
     projetées et les définitions qu'ils référencent. Posé DANS le document
     par-dessus la bitmap, ce petit SVG (quelques dizaines de nœuds) est adopté
     par l'horloge vivante (`src/watch/horloge-vivante.tsx`) : les aiguilles
     battent pendant la rotation, et l'heure est exacte quand on repasse au
     dessin vivant — aucun saut d'aiguille au départ ni à l'arrivée.

   Génération progressive par priorité (vues cardinales, puis les 45°, les 15°,
   les 5°), en transitions React (rendu concurrent, qui cède la main toutes les
   quelques millisecondes) et petites tâches ; démarrée quand une platine la
   demande (visible, ou première intention), suspendue quand plus aucune ne
   l'attend. Cache partagé par empreinte de `render` entre les platines d'une
   même page (configurateur + zoom) ; un autre `render` est une autre fabrique.

   Dans une `<img>`, ni les variables CSS ni les polices du document ne sont
   disponibles : `stylePolices()` inline une fois pour toutes les `@font-face`
   des polices du site (fichiers woff2 latins en `data:`) et résout
   `--font-title` / `--font-ui`. Ce bloc est partagé, jamais recopié dans les
   chaînes : il est ajouté au moment de fabriquer le blob de chaque image. */

/** Pas angulaire des poses (degrés). */
export const PAS_POSE = 5;
/** Préfixe des `id` internes des chaînes (`pose-…`) ; la platine le remplace par le sien. */
export const ID_POSE = "pose";
/**
 * Marge, dans le repère 1000 × 1000, ajoutée autour du dessin quand on le
 * rastérise : le dessin déborde du cadre (bracelet, ombre : bbox mesurée
 * d'environ -125 à 1095), et le SVG vivant est affiché avec `overflow: visible`.
 */
export const MARGE_POSE = 150;

export interface Pose {
  yaw: number;
  /** Contenu (enfants de `<svg>`) du dessin sans ses calques vivants. */
  fond: string;
  /** Contenu du calque vivant : aiguilles, verre, pièces de flanc devant, et leurs `defs`. */
  vivant: string;
}

/** Ordre de génération : les vues cardinales d'abord, puis de plus en plus fin. */
export const ORDRE_POSES: readonly number[] = (() => {
  const ordre: number[] = [];
  for (const pas of [90, 45, 15, PAS_POSE]) for (let yaw = 0; yaw < 360; yaw += pas) if (!ordre.includes(yaw)) ordre.push(yaw);
  return ordre;
})();

const VUES: readonly WatchView[] = ["face", "profil", "dos", "profil"];

/** Vue cardinale la plus proche d'un lacet, pour `WatchSvg` (sans effet sur le dessin projeté). */
function vueDe(yaw: number): WatchView {
  return VUES[((Math.round(yaw / 90) % 4) + 4) % 4] ?? "face";
}

/** Empreinte stable d'un `render` : clés triées, quel que soit l'ordre d'écriture. */
export function empreinte(render: WatchRender): string {
  return JSON.stringify(render, Object.keys(render).sort());
}

/* ───────────────────────────── Extraction ─────────────────────────────── */

const CALQUES_VIVANTS = '[data-layer="aiguilles"], [data-layer="verre-3d"]';
const PIECES_FLANC = '[data-layer="couronne"], [data-layer="poussoir"], [data-layer="protege-couronne"]';
const ATTRIBUTS_REFERENCE = ["fill", "stroke", "filter", "clip-path", "mask", "href", "xlink:href", "style"];
const ATTRIBUTS_RACINE = ["class", "role", "aria-label", "aria-hidden", "focusable"];
const MARQUE = "data-pose-vivant";

const serialiseur = typeof XMLSerializer === "undefined" ? null : new XMLSerializer();

function serialiserEnfants(racine: Element): string {
  if (!serialiseur) return "";
  let texte = "";
  for (const enfant of racine.childNodes) texte += serialiseur.serializeToString(enfant);
  return texte;
}

/** Les `id` référencés par un sous-arbre (`url(#…)`, `href="#…"`). */
function referencesDe(racine: Element, vers: Set<string>) {
  const elements = [racine, ...racine.querySelectorAll("*")];
  for (const el of elements) {
    for (const nom of ATTRIBUTS_REFERENCE) {
      const valeur = el.getAttribute(nom);
      if (!valeur) continue;
      if (nom === "href" || nom === "xlink:href") {
        if (valeur.startsWith("#")) vers.add(valeur.slice(1));
        continue;
      }
      for (const m of valeur.matchAll(/url\(\s*["']?#([^"')]+)["']?\s*\)/g)) if (m[1]) vers.add(m[1]);
    }
  }
}

/**
 * Sépare un dessin en son fond et son calque vivant. Le fond est le dessin
 * complet moins les calques vivants ; le calque vivant garde, pour chacun, la
 * chaîne de ses ancêtres (transformations projetées, découpe de l'ouverture de
 * lunette) et reçoit dans un `<defs>` tout ce qu'il référence (dégradés,
 * filtres, découpes, groupe du guichet repris par la loupe).
 */
function extraire(svg: SVGSVGElement): { fond: string; vivant: string } {
  const racines = new Set<Element>(svg.querySelectorAll(CALQUES_VIVANTS));
  // Pièces de flanc DEVANT : celles qui suivent la dernière bague du boîtier.
  const bagues = svg.querySelectorAll('[data-layer$="-flanc"]');
  const derniereBague = bagues[bagues.length - 1];
  for (const piece of svg.querySelectorAll(PIECES_FLANC)) {
    if (!derniereBague || derniereBague.compareDocumentPosition(piece) & Node.DOCUMENT_POSITION_FOLLOWING) racines.add(piece);
  }
  for (const racine of racines) racine.setAttribute(MARQUE, "");

  const fond = svg.cloneNode(true) as SVGSVGElement;
  for (const el of fond.querySelectorAll(`[${MARQUE}]`)) el.remove();
  for (const nom of ATTRIBUTS_RACINE) fond.removeAttribute(nom);

  // Le calque vivant : les racines, leurs ancêtres, rien d'autre.
  const garder = new Set<Element>();
  for (const racine of racines) {
    let e: Element | null = racine.parentElement;
    while (e && e !== svg) {
      garder.add(e);
      e = e.parentElement;
    }
  }
  const vivant = svg.cloneNode(false) as SVGSVGElement;
  for (const nom of ATTRIBUTS_RACINE) vivant.removeAttribute(nom);
  const copier = (source: Element, cible: Element) => {
    for (const enfant of source.children) {
      if (racines.has(enfant)) {
        const copie = enfant.cloneNode(true) as Element;
        copie.removeAttribute(MARQUE);
        cible.appendChild(copie);
      } else if (garder.has(enfant)) {
        const copie = enfant.cloneNode(false) as Element;
        cible.appendChild(copie);
        copier(enfant, copie);
      }
    }
  };
  copier(svg, vivant);
  for (const racine of racines) racine.removeAttribute(MARQUE);

  // Les définitions référencées, cherchées dans le dessin complet, de proche en proche.
  const presents = new Set<string>();
  for (const el of vivant.querySelectorAll("[id]")) presents.add(el.id);
  const voulues = new Set<string>();
  referencesDe(vivant, voulues);
  const defs = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs");
  const attente = [...voulues];
  while (attente.length) {
    const id = attente.pop() as string;
    if (presents.has(id)) continue;
    presents.add(id);
    const source = svg.querySelector(`[id="${CSS.escape(id)}"]`);
    if (!source) continue;
    const copie = source.cloneNode(true) as Element;
    copie.removeAttribute(MARQUE);
    defs.appendChild(copie);
    const suite = new Set<string>();
    referencesDe(copie, suite);
    for (const autre of suite) if (!presents.has(autre)) attente.push(autre);
  }
  if (defs.childElementCount) vivant.insertBefore(defs, vivant.firstChild);

  return { fond: serialiserEnfants(fond), vivant: serialiserEnfants(vivant) };
}

/* ───────────────────────────── Polices ────────────────────────────────── */

let polices: Promise<string> | null = null;

function nomsDe(pile: string): string[] {
  return pile
    .split(",")
    .map((nom) => nom.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** Plage Unicode qui couvre le latin de base (ou pas de plage du tout). */
function latine(plage: string): boolean {
  return !plage || /U\+0{0,2}0?0-|U\+0000\b/i.test(plage);
}

function base64(tampon: ArrayBuffer): string {
  const octets = new Uint8Array(tampon);
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode.apply(null, Array.from(octets.subarray(i, i + 0x8000)));
  return btoa(binaire);
}

/**
 * Le `<style>` à inliner dans chaque image : les `@font-face` des polices du
 * site (latin de base, en `data:`) et les variables `--font-title` / `--font-ui`
 * résolues. Calculé une fois par page, partagé entre toutes les platines.
 */
export function stylePolices(): Promise<string> {
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

/* ───────────────────────────── Fabrique ───────────────────────────────── */

export interface FabriquePoses {
  readonly cle: string;
  readonly render: WatchRender;
  pose(yaw: number): Pose | undefined;
  /** Nombre de poses prêtes (sur `ORDRE_POSES.length`). */
  readonly nombre: number;
  readonly complete: boolean;
  /** Appelé à chaque pose prête ; renvoie de quoi se désabonner. */
  abonner(surPose: (pose: Pose) => void): () => void;
  /** Passe ces lacets en tête de la génération (voisinage de l'angle courant). */
  prioriser(yaws: number[]): void;
}

/** Ce qu'une platine tient : la fabrique, et le droit de la faire travailler. */
export interface BailPoses {
  readonly fabrique: FabriquePoses;
  /** La platine est visible (ou on y touche) : la génération tourne. */
  activer(): void;
  /** Hors écran : la génération se met en pause dès la pose en cours. */
  suspendre(): void;
  /** Démontage ou changement d'options : la fabrique s'arrête quand plus personne ne la tient. */
  rendre(): void;
}

/** Instant du dernier commit : la sonde prévient la fabrique que le DOM est à jour. */
function Sonde({ cle, surCommit, children }: { cle: number; surCommit: (cle: number) => void; children: ReactNode }) {
  useLayoutEffect(() => {
    surCommit(cle);
  }, [cle, surCommit]);
  return children;
}

const DELAI_OUBLI_MS = 15_000;
const FABRIQUES_MAX = 3;

class Fabrique implements FabriquePoses {
  readonly cle: string;
  readonly render: WatchRender;
  private readonly poses = new Map<number, Pose>();
  private readonly abonnes = new Set<(pose: Pose) => void>();
  private ordre = [...ORDRE_POSES];
  private conteneur: HTMLDivElement | null = null;
  private racine: Root | null = null;
  private enCours: number | null = null;
  private actifs = 0;
  private baux = 0;
  private oubli = 0;
  private finie = false;
  private tache = 0;

  constructor(render: WatchRender) {
    this.render = render;
    this.cle = empreinte(render);
  }

  get nombre() {
    return this.poses.size;
  }
  /** Plus aucune platine ne la tient. */
  get libre() {
    return this.baux === 0;
  }
  get complete() {
    return this.poses.size >= ORDRE_POSES.length;
  }
  pose(yaw: number) {
    return this.poses.get(yaw);
  }
  abonner(surPose: (pose: Pose) => void) {
    this.abonnes.add(surPose);
    return () => {
      this.abonnes.delete(surPose);
    };
  }
  prioriser(yaws: number[]) {
    const tete = yaws.filter((yaw) => !this.poses.has(yaw) && this.ordre.includes(yaw));
    if (!tete.length) return;
    this.ordre = [...tete, ...this.ordre.filter((yaw) => !tete.includes(yaw))];
  }

  bail(): BailPoses {
    this.baux += 1;
    if (this.oubli) {
      window.clearTimeout(this.oubli);
      this.oubli = 0;
    }
    let actif = false;
    let rendu = false;
    return {
      fabrique: this,
      activer: () => {
        if (rendu || actif) return;
        actif = true;
        this.actifs += 1;
        this.planifier();
      },
      suspendre: () => {
        if (!actif) return;
        actif = false;
        this.actifs -= 1;
      },
      rendre: () => {
        if (rendu) return;
        rendu = true;
        if (actif) {
          actif = false;
          this.actifs -= 1;
        }
        this.baux -= 1;
        if (this.baux === 0) this.oubli = window.setTimeout(() => oublier(this), DELAI_OUBLI_MS);
      },
    };
  }

  /** Une pose à la fois, quand quelqu'un l'attend ; rien ne bloque plus de quelques millisecondes. */
  private planifier() {
    if (this.finie || this.enCours !== null || this.tache || this.actifs === 0) return;
    const prochain = this.ordre.find((yaw) => !this.poses.has(yaw));
    if (prochain === undefined) return;
    this.tache = window.setTimeout(() => {
      this.tache = 0;
      if (this.finie || this.actifs === 0 || this.enCours !== null) return;
      this.rendre(prochain);
    }, 0);
  }

  private rendre(yaw: number) {
    if (!this.racine) {
      this.conteneur = document.createElement("div");
      this.racine = createRoot(this.conteneur);
    }
    this.enCours = yaw;
    const racine = this.racine;
    // Rendu concurrent : React cède la main toutes les quelques millisecondes,
    // le commit est bref (mise à jour d'attributs sur l'arbre déjà en place).
    startTransition(() => {
      racine.render(
        <Sonde cle={yaw} surCommit={this.surCommit}>
          <WatchSvg id={ID_POSE} render={this.render} view={vueDe(yaw)} yaw={yaw} label="" />
        </Sonde>,
      );
    });
  }

  private readonly surCommit = (yaw: number) => {
    if (this.finie || this.enCours !== yaw) return;
    // L'extraction dans sa propre tâche : le commit de React reste court.
    this.tache = window.setTimeout(() => {
      this.tache = 0;
      if (this.finie || this.enCours !== yaw) return;
      const svg = this.conteneur?.querySelector("svg");
      this.enCours = null;
      if (svg) {
        const pose = { yaw, ...extraire(svg) };
        this.poses.set(yaw, pose);
        // Repère pour les mesures (scripts Playwright) : une pose de plus.
        performance.mark("poses-montre:pose", { detail: { yaw, fond: pose.fond.length, vivant: pose.vivant.length } });
        for (const surPose of this.abonnes) surPose(pose);
      }
      if (this.complete) this.arreter();
      else this.planifier();
    }, 0);
  };

  /** Libère la racine React ; les poses déjà faites restent. */
  private arreter() {
    if (this.tache) window.clearTimeout(this.tache);
    this.tache = 0;
    this.enCours = null;
    const racine = this.racine;
    this.racine = null;
    this.conteneur = null;
    if (racine) window.setTimeout(() => racine.unmount(), 0);
  }

  detruire() {
    this.finie = true;
    this.arreter();
    this.poses.clear();
    this.abonnes.clear();
  }
}

const fabriques = new Map<string, Fabrique>();

function oublier(fabrique: Fabrique) {
  fabriques.delete(fabrique.cle);
  fabrique.detruire();
}

/**
 * Prend un bail sur la fabrique de cette montre (créée au besoin, partagée
 * avec les autres platines de la page). Rendre tous les baux la laisse vivre
 * encore quelques secondes — le temps d'un aller-retour vers un gros plan —,
 * et le nombre de fabriques gardées est borné.
 */
export function prendreFabrique(render: WatchRender): BailPoses {
  const cle = empreinte(render);
  let fabrique = fabriques.get(cle);
  if (!fabrique) {
    // Les fabriques que plus personne ne tient s'en vont d'abord.
    if (fabriques.size >= FABRIQUES_MAX) {
      for (const autre of fabriques.values()) {
        if (autre.libre) {
          oublier(autre);
          break;
        }
      }
    }
    fabrique = new Fabrique(render);
    fabriques.set(cle, fabrique);
  }
  return fabrique.bail();
}
