import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";

/**
 * Export CSV des commandes, pour la comptabilité.
 *
 * Les routes d'API ne traversent pas le gabarit de `/atelier` : le rôle est
 * donc revérifié ici, sinon l'adresse serait ouverte à tout compte connecté.
 *
 * Les montants sortent en euros avec un point décimal et sans séparateur de
 * milliers : c'est ce qu'un tableur attend, même en français.
 */
const COLONNES = [
  "numero",
  "passee_le",
  "client",
  "email",
  "montre",
  "etape",
  "total_eur",
  "cout_pieces_eur",
  "marge_eur",
  "exemple",
] as const;

/** Une cellule CSV : guillemets doublés, champ entouré si besoin. */
function cellule(valeur: string | number): string {
  const texte = String(valeur);
  return /[";\n]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

const euros = (centimes: number) => (centimes / 100).toFixed(2);

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non autorisé", { status: 401 });
  if (session.user.role !== "ADMIN") return new Response("Introuvable", { status: 404 });

  const commandes = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true } } },
  });

  const lignes = commandes.map((commande) => {
    const coutPieces = commande.items.reduce(
      (somme, ligne) => somme + ligne.partsCostCents * ligne.quantity,
      0,
    );
    const vente = commande.items.reduce(
      (somme, ligne) => somme + ligne.unitPriceCents * ligne.quantity,
      0,
    );
    return [
      commande.number,
      formatDate(commande.createdAt) ?? "",
      commande.user?.name ?? "",
      commande.email,
      (commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "",
      libelleStatut(commande.status),
      euros(commande.totalCents),
      euros(coutPieces),
      euros(vente - coutPieces),
      commande.isSample ? "oui" : "non",
    ].map(cellule).join(";");
  });

  // Le BOM UTF-8 évite qu'Excel affiche « Expédiée » en mojibake.
  const csv = "﻿" + [COLONNES.join(";"), ...lignes].join("\r\n") + "\r\n";
  const jour = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chronova-commandes-${jour}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
