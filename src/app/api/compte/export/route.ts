import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Export des données personnelles (droit à la portabilité, article 20 du RGPD).
 *
 * Format JSON, lisible par une machine comme l'exige le texte, et téléchargé
 * directement plutôt qu'envoyé par e-mail : la donnée ne transite nulle part.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Non autorisé", { status: 401 });

  const utilisateur = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      addresses: true,
      consents: true,
      orders: {
        include: { items: true, events: true },
        orderBy: { createdAt: "asc" },
      },
      inquiries: true,
      cases: true,
    },
  });

  const donnees = {
    exporteLe: new Date().toISOString(),
    compte: {
      email: utilisateur.email,
      nom: utilisateur.name,
      telephone: utilisateur.phone,
      tourDePoignetMm: utilisateur.wristSizeMm,
      preferences: utilisateur.preferences,
      lettreDInformation: utilisateur.newsletter,
      creeLe: utilisateur.createdAt,
    },
    adresses: utilisateur.addresses,
    consentements: utilisateur.consents,
    commandes: utilisateur.orders.map((commande) => ({
      numero: commande.number,
      statut: commande.status,
      totalCentimes: commande.totalCents,
      passeeLe: commande.createdAt,
      configurations: commande.items.map((ligne) => ligne.snapshot),
      etapes: commande.events.map((evenement) => ({
        etape: evenement.toStatus,
        date: evenement.createdAt,
      })),
    })),
    demandes: utilisateur.inquiries.map((demande) => ({
      type: demande.type,
      message: demande.message,
      envoyeeLe: demande.createdAt,
    })),
    apresVente: utilisateur.cases,
  };

  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="chronova-mes-donnees.json"`,
      "Cache-Control": "no-store",
    },
  });
}
