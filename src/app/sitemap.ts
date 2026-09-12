import type { MetadataRoute } from "next";
import { getModels } from "@/lib/data/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

/** Pages fixes, de la plus importante à la moins consultée. */
const STATIQUES: { chemin: string; priorite: number; frequence: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { chemin: "/", priorite: 1, frequence: "monthly" },
  { chemin: "/collection", priorite: 0.9, frequence: "weekly" },
  { chemin: "/composer", priorite: 0.9, frequence: "weekly" },
  { chemin: "/l-horloger", priorite: 0.6, frequence: "yearly" },
  { chemin: "/entretien-garantie", priorite: 0.6, frequence: "yearly" },
  { chemin: "/faq", priorite: 0.6, frequence: "monthly" },
  { chemin: "/sur-mesure", priorite: 0.5, frequence: "yearly" },
  { chemin: "/contact", priorite: 0.5, frequence: "yearly" },
  { chemin: "/mentions-legales", priorite: 0.2, frequence: "yearly" },
  { chemin: "/cgv", priorite: 0.2, frequence: "yearly" },
  { chemin: "/confidentialite", priorite: 0.2, frequence: "yearly" },
  { chemin: "/cookies", priorite: 0.2, frequence: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const modeles = await getModels();
  const maintenant = new Date();

  return [
    ...STATIQUES.map((page) => ({
      url: `${BASE}${page.chemin}`,
      lastModified: maintenant,
      changeFrequency: page.frequence,
      priority: page.priorite,
    })),
    // Les configurations partagées vivent dans la chaîne de requête : elles ne
    // sont pas des pages à indexer, seules les fiches modèle le sont.
    ...modeles.flatMap((modele) => [
      {
        url: `${BASE}/collection/${modele.slug}`,
        lastModified: maintenant,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${BASE}/composer/${modele.slug}`,
        lastModified: maintenant,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
    ]),
  ];
}
