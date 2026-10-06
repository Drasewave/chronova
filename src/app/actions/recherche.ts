"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { libelleStatut } from "@/lib/commandes/etapes";

export interface ResultatRecherche {
  groupe: string;
  titre: string;
  detail: string;
  href: string;
}

/**
 * Recherche globale du CRM (Cmd/Ctrl + K).
 *
 * Volontairement limitée à quelques résultats par famille : la palette sert à
 * atteindre une fiche connue en trois frappes, pas à explorer. Chaque appel
 * revérifie le rôle — une action serveur est une porte d'entrée publique,
 * qu'elle soit appelée depuis une page protégée ou non.
 */
export async function rechercheGlobale(requete: string): Promise<ResultatRecherche[]> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return [];

  const q = requete.trim();
  if (q.length < 2) return [];

  const contient = { contains: q, mode: "insensitive" as const };

  const [commandes, pieces, modeles] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ number: contient }, { email: contient }] },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { number: true, status: true, email: true },
    }),
    prisma.part.findMany({
      where: { OR: [{ reference: contient }, { name: contient }] },
      take: 5,
      select: { reference: true, name: true, quantityOnHand: true, quantityReserved: true },
    }),
    prisma.watchModel.findMany({
      where: { OR: [{ name: contient }, { slug: contient }] },
      take: 3,
      select: { slug: true, name: true, tagline: true },
    }),
  ]);

  return [
    ...commandes.map((commande) => ({
      groupe: "Commandes",
      titre: commande.number,
      detail: `${libelleStatut(commande.status)} · ${commande.email}`,
      href: `/atelier/commandes/${commande.number}`,
    })),
    ...pieces.map((piece) => ({
      groupe: "Stock",
      titre: piece.reference,
      detail: `${piece.name} · ${disponibles(piece.quantityOnHand - piece.quantityReserved)}`,
      // La fiche de stock est adressée par RÉFÉRENCE (`/atelier/stock/[reference]`),
      // pas par identifiant de base (audit A-09).
      href: `/atelier/stock/${encodeURIComponent(piece.reference)}`,
    })),
    ...modeles.map((modele) => ({
      groupe: "Catalogue",
      titre: modele.name,
      detail: modele.tagline,
      // Route réelle : `/atelier/catalogue/modeles/[slug]` (audit A-09).
      href: `/atelier/catalogue/modeles/${encodeURIComponent(modele.slug)}`,
    })),
  ];
}

function disponibles(quantite: number): string {
  if (quantite <= 0) return "aucune disponible";
  return quantite === 1 ? "1 disponible" : `${quantite} disponibles`;
}
