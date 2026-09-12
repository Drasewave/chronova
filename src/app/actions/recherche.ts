"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

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

  const [commandes, clients, pieces, modeles] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ number: contient }, { email: contient }] },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { number: true, status: true, email: true },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: contient }, { email: contient }] },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
    prisma.part.findMany({
      where: { OR: [{ reference: contient }, { name: contient }] },
      take: 5,
      select: { id: true, reference: true, name: true, quantityOnHand: true, quantityReserved: true },
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
      detail: `${commande.status} · ${commande.email}`,
      href: `/atelier/commandes/${commande.number}`,
    })),
    ...clients.map((client) => ({
      groupe: "Clients",
      titre: client.name ?? client.email,
      detail: client.email,
      href: `/atelier/clients/${client.id}`,
    })),
    ...pieces.map((piece) => ({
      groupe: "Stock",
      titre: piece.reference,
      detail: `${piece.name} · ${piece.quantityOnHand - piece.quantityReserved} disponible(s)`,
      href: `/atelier/stock/${piece.id}`,
    })),
    ...modeles.map((modele) => ({
      groupe: "Catalogue",
      titre: modele.name,
      detail: modele.tagline,
      href: `/atelier/catalogue/${modele.slug}`,
    })),
  ];
}
