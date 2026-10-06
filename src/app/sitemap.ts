import type { MetadataRoute } from "next";
import { gammesAvecModeles } from "@/lib/content/gammes";
import { getModels } from "@/lib/data/queries";
import { prisma } from "@/lib/db";
import { SITE as BASE } from "@/lib/env";

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
  { chemin: "/cgu", priorite: 0.2, frequence: "yearly" },
  { chemin: "/confidentialite", priorite: 0.2, frequence: "yearly" },
  { chemin: "/cookies", priorite: 0.2, frequence: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const modeles = await getModels();
  // Date réelle de dernière modification des fiches ; les autres pages n'en ont
  // pas de fiable, le champ est omis plutôt que d'annoncer « maintenant ».
  const modifies = new Map(
    (await prisma.watchModel.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } })).map(
      (m) => [m.slug, m.updatedAt],
    ),
  );

  return [
    ...STATIQUES.map((page) => ({
      url: `${BASE}${page.chemin}`,
      changeFrequency: page.frequence,
      priority: page.priorite,
    })),
    // Une page par gamme, tant qu'elle a au moins un modèle publié.
    ...gammesAvecModeles(modeles).map((gamme) => ({
      url: `${BASE}${gamme.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    // Les configurations partagées vivent dans la chaîne de requête : elles ne
    // sont pas des pages à indexer, seules les fiches modèle le sont.
    ...modeles.flatMap((modele) => [
      {
        url: `${BASE}/collection/${modele.slug}`,
        lastModified: modifies.get(modele.slug),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${BASE}/composer/${modele.slug}`,
        lastModified: modifies.get(modele.slug),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      },
    ]),
  ];
}
