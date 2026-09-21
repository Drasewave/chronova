import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

// Le CRM, le compte client, le panier et le tunnel de commande n'ont rien à
// faire dans un index, quel que soit le robot.
const PRIVE = ["/atelier", "/compte", "/panier", "/commande", "/connexion", "/api/"];

/**
 * Robots des assistants et moteurs IA, nommés pour que le choix soit explicite
 * et réversible : l'atelier veut être lu et cité. Pour en exclure un (par
 * exemple les robots d'entraînement GPTBot, CCBot, Google-Extended), le sortir
 * de cette liste et lui donner une règle `disallow: "/"`.
 */
const ROBOTS_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "MistralAI-User",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVE },
      { userAgent: ROBOTS_IA, allow: "/", disallow: PRIVE },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
