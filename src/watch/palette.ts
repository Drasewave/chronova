import type { MetalTone } from "./types";

/**
 * Rampes métalliques. Ce ne sont pas des couleurs d'interface mais des
 * matières photographiées en studio : l'acier est froid et neutre, et sa
 * dynamique est large — un poli passe du quasi-blanc au quasi-noir selon ce
 * qu'il reflète. C'est cet écart qui fait lire « métal » plutôt que « gris ».
 */
export interface MetalRamp {
  /** Éclat spéculaire : le reflet direct de la boîte à lumière. */
  hi: string;
  /** Arête la plus éclairée. */
  light: string;
  mid: string;
  /** Creux, sous la lumière rasante. */
  dark: string;
  /** Filet de contour, et reflet du fond noir du studio. */
  edge: string;
}

export const METALS: Record<MetalTone, MetalRamp> = {
  acier: { hi: "#FFFFFF", light: "#E9ECEF", mid: "#A9AFB6", dark: "#565C64", edge: "#23272C" },
  dore: { hi: "#FFF6DA", light: "#F1D48F", mid: "#C99A45", dark: "#7C5A22", edge: "#3E2B0E" },
  noir: { hi: "#AEB3BA", light: "#676C73", mid: "#33373C", dark: "#17191C", edge: "#08090A" },
  bleui: { hi: "#C9D8F5", light: "#7D93C4", mid: "#3A4E82", dark: "#1B2748", edge: "#0C1226" },
};

/** Les deux extrêmes neutres du rendu : l'ombre du studio et sa lumière. */
export const INK = "#0E1013";
export const PAPER = "#F6F8FA";

/** Teinte du luminova au repos : un vert-crème, pas un vert fluo. */
export const LUME_FILL = "#E4E9D2";
export const LUME_EDGE = "#A4AB8C";

/**
 * Couleur d'un métal pour une luminance reçue de 0 (reflet du noir) à 1 (éclat).
 * Cinq paliers plutôt qu'un simple mélange : la teinte d'un or sombre n'est pas
 * celle d'un or clair assombri.
 */
export function rampAt(ramp: MetalRamp, t: number): string {
  const stops = [ramp.edge, ramp.dark, ramp.mid, ramp.light, ramp.hi];
  const x = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i] as string, stops[i + 1] as string, x - i);
}

/** Mélange deux couleurs hexadécimales. `amount` = part de `b`. */
export function mix(a: string, b: string, amount: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const ch = (i: 0 | 1 | 2) => Math.round(pa[i] + (pb[i] - pa[i]) * amount);
  return `#${[ch(0), ch(1), ch(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function shade(hex: string, amount: number): string {
  return mix(hex, INK, amount);
}

export function tint(hex: string, amount: number): string {
  return mix(hex, PAPER, amount);
}

/**
 * Éclaircit sans délaver : les canaux sont multipliés, pas tirés vers le blanc.
 * Un bleu soleillé reste bleu dans ses rayons clairs.
 */
export function glow(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const k = 1 + amount;
  const lift = 18 * amount;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * k + lift)));
  return `#${[ch(r), ch(g), ch(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Luminance relative WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Rapport de contraste WCAG entre deux couleurs (1 à 21).
 *
 * Sert aussi côté CRM : quand l'horloger saisit la teinte d'une nouvelle option,
 * on peut l'avertir si le texte posé dessus deviendrait illisible.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [clair, sombre] = la > lb ? [la, lb] : [lb, la];
  return (clair + 0.05) / (sombre + 0.05);
}

/** Un cadran clair a besoin d'index et d'aiguilles sombres, et inversement. */
export function isLight(hex: string): boolean {
  return relativeLuminance(hex) > 0.32;
}

function lin(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}
