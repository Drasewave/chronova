import type { MetalTone } from "./types";

/**
 * Rampes métalliques. Ce ne sont pas des couleurs d'interface mais des
 * matières : elles restent chaudes pour s'accorder au crème du site, et
 * n'atteignent jamais le blanc ni le noir purs.
 */
export interface MetalRamp {
  /** Arête la plus éclairée. */
  light: string;
  mid: string;
  /** Creux, sous la lumière rasante. */
  dark: string;
  /** Filet de contour. */
  edge: string;
}

export const METALS: Record<MetalTone, MetalRamp> = {
  acier: { light: "#DCD5C6", mid: "#B0A899", dark: "#7A7367", edge: "#615A4F" },
  dore: { light: "#E3C795", mid: "#C09755", dark: "#8A6A33", edge: "#6B5127" },
  noir: { light: "#585047", mid: "#3D372F", dark: "#2A251F", edge: "#211E1B" },
  bleui: { light: "#6E80A0", mid: "#3F4F6C", dark: "#26324A", edge: "#1C253A" },
};

/** Teinte du luminova au repos : un vert-crème, pas un vert fluo. */
export const LUME_FILL = "#D8DCC2";
export const LUME_EDGE = "#A9AE90";

/** Mélange deux couleurs hexadécimales. `amount` = part de `b`. */
export function mix(a: string, b: string, amount: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const ch = (i: 0 | 1 | 2) => Math.round(pa[i] + (pb[i] - pa[i]) * amount);
  return `#${[ch(0), ch(1), ch(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function shade(hex: string, amount: number): string {
  return mix(hex, "#211E1B", amount);
}

export function tint(hex: string, amount: number): string {
  return mix(hex, "#F5F0E8", amount);
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
