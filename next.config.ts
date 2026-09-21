import type { NextConfig } from "next";

const DEV = process.env.NODE_ENV !== "production";

/**
 * Politique de sécurité du contenu (audit A-11).
 *
 * Le site ne charge RIEN d'externe : polices auto-hébergées par `next/font`,
 * montres en SVG en ligne, aucun traceur, et le paiement Stripe est une
 * redirection vers Checkout (pas de Stripe.js dans la page). Tout est donc
 * `'self'`.
 *
 * `script-src` garde `'unsafe-inline'` : Next injecte des scripts en ligne (flux
 * RSC, amorçage), le gabarit racine aussi (rideau d'intro, JSON-LD). La variante
 * stricte à nonce impose le rendu dynamique de TOUTES les pages (un nonce par
 * requête) ; or les pages vitrines pèsent plusieurs Mo de SVG et ne tiennent que
 * parce qu'elles sont mises en cache. On garde donc le cache, et la CSP verrouille
 * tout le reste : origines des scripts, `object-src`, `base-uri`, `form-action`,
 * `frame-ancestors` (clickjacking du CRM et du panier), connexions sortantes.
 *
 * Pas de `upgrade-insecure-requests` : l'instance de démonstration est servie en
 * HTTP sur le tailnet, la directive y casserait toutes les ressources. À ajouter
 * le jour où le site n'est servi qu'en HTTPS.
 *
 * En développement : `'unsafe-eval'` (React s'en sert pour les piles d'erreurs)
 * et les WebSockets du rechargement à chaud.
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // `https:` : les photos d'atelier et de commandes pourront venir d'un stockage externe.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${DEV ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  // Le départ au paiement redirige vers Stripe Checkout.
  "form-action 'self' https://checkout.stripe.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

const EN_TETES_SECURITE = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Doublon de `frame-ancestors` pour les navigateurs anciens.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // HSTS : production seulement (en local, il collerait `localhost` en HTTPS pendant
  // deux ans). Les navigateurs l'ignorent tant que le site est servi en HTTP.
  ...(DEV ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const config: NextConfig = {
  reactStrictMode: true,
  // Inutile de dire à tout le monde quel serveur tourne (audit A-11).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: EN_TETES_SECURITE }];
  },
  // Le serveur de développement bloque par défaut les ressources internes
  // demandées depuis une autre origine que localhost ; les outils de capture
  // d'écran s'y connectent en 127.0.0.1, et le tailnet en 100.114.166.76.
  allowedDevOrigins: ["127.0.0.1", "100.114.166.76"],
  images: {
    // Les photos réelles arriveront plus tard ; on prévoit déjà les formats modernes.
    formats: ["image/avif", "image/webp"],
  },
  // Le site est entièrement en français : on le déclare une fois pour toutes.
  env: { NEXT_PUBLIC_LOCALE: "fr-FR" },
};

export default config;
