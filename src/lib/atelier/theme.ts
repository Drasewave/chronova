/**
 * Thème du CRM.
 *
 * Le choix voyage dans un cookie plutôt que dans localStorage : le serveur peut
 * donc rendre le bon thème dès le premier octet, sans script de démarrage ni
 * éclair blanc au chargement. Le site public, lui, ne lit aucun cookie et reste
 * statique.
 */
export const COOKIE_THEME = "chronova-theme";

export type ThemeAtelier = "light" | "night";

/** Clair par défaut : l'établi est éclairé, le sombre reste une option. */
export function lireTheme(valeur: string | undefined): ThemeAtelier {
  return valeur === "night" ? "night" : "light";
}

/** Un an, sur tout le site, sans usage tiers : pas de consentement requis. */
export function ecrireThemeCookie(theme: ThemeAtelier) {
  document.cookie = `${COOKIE_THEME}=${theme};path=/;max-age=31536000;samesite=lax`;
}
