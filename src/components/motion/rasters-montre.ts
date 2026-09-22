"use client";

import { MARGE_POSE, ORDRE_POSES, PAS_POSE, stylePolices, type FabriquePoses } from "./poses-montre";

/* ───────────────────────── Rastérisation des poses ───────────────────────
   Pour UNE platine (une taille d'affichage), transforme les chaînes SVG de la
   fabrique en images :

   1. Rastérisation (fil principal, ~40 ms par pose en production, jamais
      pendant un geste) : la chaîne devient une `<img>` (`decode()`), dessinée
      sur un canevas de travail à la taille d'affichage × densité de pixels
      (plafonds : 2, et `COTE_MAX` px de côté), puis encodée en WebP par
      `toBlob` — l'encodage se fait hors du fil principal. Mesuré : Chromium
      refuse `createImageBitmap` sur un blob SVG, d'où le chemin `<img>` ; et
      `createImageBitmap(img)` y coûte près d'une seconde, d'où le canevas.
   2. Décodage à la demande (hors fil principal, ~25 ms) : `createImageBitmap`
      du blob WebP, dans un anneau de ±`ANNEAU_DEGRES` autour de l'angle
      courant, dans le sens du mouvement d'abord. Au plus `ANNEAU_MAX` bitmaps
      vivent en même temps ; la plus éloignée de l'angle courant est fermée.

   Mémoire : 72 blobs WebP (≈ 50 à 180 Ko chacun selon la taille) et
   `ANNEAU_MAX` × côté² × 4 octets de bitmaps décodées. Sur un bureau à 1440 px
   (côté ≈ 480 px) : ≈ 15 Mo ; au zoom (≈ 850 px) : ≈ 46 Mo ; téléphone ×2
   (≈ 600 à 930 px) : ≈ 23 à 55 Mo. Un navigateur sans WebP (Safari) encode en
   PNG : blobs plus lourds (≈ 0,3 à 1 Mo), même anneau. */

/** Demi-largeur de l'anneau de bitmaps décodées (degrés). */
export const ANNEAU_DEGRES = 30;
/** Bitmaps décodées gardées au plus. */
export const ANNEAU_MAX = 16;
/** Côté maximal d'une bitmap (pixels). */
export const COTE_MAX = 1200;
const DECODAGES_MAX = 2;
const ENCODAGES_MAX = 3;
const QUALITE_WEBP = 0.92;
const JOURS = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

/** Le navigateur sait-il faire tout ce qu'il faut ? Sinon, la platine garde ses poses SVG. */
export function rasterisationPossible(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof HTMLImageElement !== "undefined" &&
    "decode" in HTMLImageElement.prototype &&
    typeof HTMLCanvasElement !== "undefined" &&
    "toBlob" in HTMLCanvasElement.prototype
  );
}

export interface Dessin {
  yaw: number;
  bitmap: ImageBitmap;
}

function mod(valeur: number, base: number): number {
  return ((valeur % base) + base) % base;
}

/** Écart angulaire absolu, ramené dans [0, 180]. */
function distance(a: number, b: number): number {
  return Math.abs(mod(a - b + 180, 360) - 180);
}

/** Lacet de pose le plus proche d'un angle. */
export function poseDe(angle: number): number {
  return mod(Math.round(angle / PAS_POSE) * PAS_POSE, 360);
}

/** Les poses de l'anneau autour d'un angle, de la plus urgente à la moins urgente. */
export function anneauDe(angle: number, sens: number): number[] {
  const centre = poseDe(angle);
  const yaws = [centre];
  const premier = sens < 0 ? -1 : 1;
  for (let d = PAS_POSE; d <= ANNEAU_DEGRES; d += PAS_POSE) {
    yaws.push(mod(centre + premier * d, 360));
    yaws.push(mod(centre - premier * d, 360));
  }
  return [...new Set(yaws)];
}

/** Jour et quantième du guichet, écrits comme le fait l'horloge vivante. */
function dater(fond: string): string {
  const maintenant = new Date();
  const jour = JOURS[maintenant.getDay()] ?? "";
  const quantieme = String(maintenant.getDate());
  return fond
    .replace(/(<text\b[^>]*data-guichet="jour"[^>]*>)[^<]*/, `$1${jour}`)
    .replace(/(<text\b[^>]*data-guichet="quantieme"[^>]*>)[^<]*/, `$1${quantieme}`);
}

export class Rasteriseur {
  /** Côté des bitmaps (pixels), marge comprise. */
  readonly cote: number;
  /** Pendant un geste : aucune rastérisation (fil principal), seulement des décodages. */
  pause = false;
  /** Une bitmap vient d'arriver dans l'anneau. */
  surImage: (() => void) | null = null;

  private readonly fabrique: FabriquePoses;
  private readonly blobs = new Map<number, Blob>();
  private readonly anneau = new Map<number, ImageBitmap>();
  private readonly decodages = new Set<number>();
  /** Poses dessinées dont l'encodage WebP n'est pas revenu : à ne pas refaire. */
  private readonly encodages = new Set<number>();
  private readonly desabonner: () => void;
  private polices: string | null = null;
  private toile: HTMLCanvasElement | null = null;
  private rasterEnCours: number | null = null;
  private angle = 0;
  private sens = 0;
  private detruit = false;
  private octetsBlobs = 0;

  constructor(fabrique: FabriquePoses, cote: number) {
    this.fabrique = fabrique;
    this.cote = Math.max(1, Math.min(COTE_MAX, Math.round(cote)));
    this.desabonner = fabrique.abonner(() => this.planifier());
    void stylePolices().then((style) => {
      if (this.detruit) return;
      this.polices = style;
      this.planifier();
    });
  }

  /** L'angle courant et le sens du mouvement : de quoi décoder l'anneau, dans le bon ordre. */
  demander(angle: number, sens: number) {
    this.angle = mod(angle, 360);
    this.sens = sens;
    this.planifier();
  }

  /** La bitmap décodée la plus proche d'un angle, s'il y en a une. */
  proche(angle: number): Dessin | undefined {
    let meilleur: Dessin | undefined;
    let ecart = Number.POSITIVE_INFINITY;
    for (const [yaw, bitmap] of this.anneau) {
      const d = distance(angle, yaw);
      if (d < ecart) {
        ecart = d;
        meilleur = { yaw, bitmap };
      }
    }
    return meilleur;
  }

  /** Poses rastérisées (blobs) et bitmaps vivantes : de quoi mesurer. */
  memoire() {
    return { cote: this.cote, blobs: this.blobs.size, octetsBlobs: this.octetsBlobs, bitmaps: this.anneau.size, octetsBitmaps: this.anneau.size * this.cote * this.cote * 4 };
  }

  detruire() {
    this.detruit = true;
    this.desabonner();
    for (const bitmap of this.anneau.values()) bitmap.close();
    this.anneau.clear();
    this.blobs.clear();
    this.octetsBlobs = 0;
    this.toile = null;
  }

  private planifier() {
    if (this.detruit) return;
    const voulus = anneauDe(this.angle, this.sens);
    // 1. Décodages : les poses de l'anneau déjà rastérisées, hors fil principal.
    for (const yaw of voulus) {
      if (this.decodages.size >= DECODAGES_MAX) break;
      if (this.anneau.has(yaw) || this.decodages.has(yaw)) continue;
      const blob = this.blobs.get(yaw);
      if (blob) this.decoder(yaw, blob);
    }
    // 2. Rastérisation : une pose à la fois, jamais pendant un geste (sauf quand
    //    rien n'est encore prêt : autant payer ici que dans un repli SVG).
    if (!this.polices || this.rasterEnCours !== null || this.encodages.size >= ENCODAGES_MAX) return;
    if (this.pause && this.anneau.size > 0) return;
    const candidat = [...voulus, ...ORDRE_POSES].find((yaw) => !this.blobs.has(yaw) && !this.encodages.has(yaw) && this.fabrique.pose(yaw) !== undefined);
    if (candidat !== undefined) void this.rasteriser(candidat, this.polices);
  }

  private decoder(yaw: number, blob: Blob) {
    this.decodages.add(yaw);
    createImageBitmap(blob)
      .then((bitmap) => {
        this.decodages.delete(yaw);
        if (this.detruit) {
          bitmap.close();
          return;
        }
        this.deposer(yaw, bitmap);
        this.planifier();
      })
      .catch(() => {
        this.decodages.delete(yaw);
        // Blob illisible : on ne le regardera plus, la pose sera refaite.
        this.blobs.delete(yaw);
        this.planifier();
      });
  }

  /** Entre dans l'anneau ; la bitmap la plus loin de l'angle courant en sort, fermée. */
  private deposer(yaw: number, bitmap: ImageBitmap) {
    this.anneau.get(yaw)?.close();
    this.anneau.set(yaw, bitmap);
    while (this.anneau.size > ANNEAU_MAX) {
      let loin = yaw;
      let ecart = -1;
      for (const autre of this.anneau.keys()) {
        const d = distance(this.angle, autre);
        if (d > ecart) {
          ecart = d;
          loin = autre;
        }
      }
      this.anneau.get(loin)?.close();
      this.anneau.delete(loin);
    }
    // Repère pour les mesures (scripts Playwright).
    performance.mark("rasters-montre:bitmap", { detail: { yaw, cote: this.cote, anneau: this.anneau.size } });
    this.surImage?.();
  }

  private async rasteriser(yaw: number, polices: string) {
    const pose = this.fabrique.pose(yaw);
    if (!pose) return;
    this.rasterEnCours = yaw;
    const c = this.cote;
    const boite = `${-MARGE_POSE} ${-MARGE_POSE} ${1000 + 2 * MARGE_POSE} ${1000 + 2 * MARGE_POSE}`;
    const entete = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${c}" height="${c}" viewBox="${boite}"><style>`;
    const blob = new Blob([entete, polices, "</style>", dater(pose.fond), "</svg>"], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const image = new Image(c, c);
    image.decoding = "async";
    image.src = url;
    try {
      await image.decode();
    } catch {
      URL.revokeObjectURL(url);
      this.rasterEnCours = null;
      return;
    }
    URL.revokeObjectURL(url);
    if (this.detruit) return;
    const toile = (this.toile ??= document.createElement("canvas"));
    if (toile.width !== c) toile.width = c;
    if (toile.height !== c) toile.height = c;
    const contexte = toile.getContext("2d");
    if (!contexte) {
      this.rasterEnCours = null;
      return;
    }
    contexte.clearRect(0, 0, c, c);
    contexte.drawImage(image, 0, 0, c, c);
    // La bitmap tout de suite dans l'anneau si elle y a sa place : la première
    // pose d'un geste n'attend pas son encodage.
    if (distance(this.angle, yaw) <= ANNEAU_DEGRES || this.anneau.size < ANNEAU_MAX) {
      try {
        const bitmap = await createImageBitmap(toile);
        if (this.detruit) bitmap.close();
        else this.deposer(yaw, bitmap);
      } catch {
        /* Le décodage du blob prendra le relais. */
      }
      if (this.detruit) return;
    }
    // `toBlob` fige les pixels à l'appel : le canevas resservira aussitôt.
    this.encodages.add(yaw);
    toile.toBlob(
      (resultat) => {
        this.encodages.delete(yaw);
        if (this.detruit) return;
        if (resultat) {
          this.blobs.set(yaw, resultat);
          this.octetsBlobs += resultat.size;
          performance.mark("rasters-montre:blob", { detail: { yaw, cote: this.cote, octets: resultat.size, type: resultat.type } });
        }
        this.planifier();
      },
      "image/webp",
      QUALITE_WEBP,
    );
    this.rasterEnCours = null;
    this.planifier();
  }
}
