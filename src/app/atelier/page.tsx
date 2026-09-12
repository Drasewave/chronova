import Link from "next/link";
import { BarresHorizontales, Chiffre, HistogrammeMois, Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { ETAPES_CLIENT, formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Tableau de bord" };

/** Le tableau de bord lit l'état courant : jamais de cache. */
export const dynamic = "force-dynamic";

const JOUR = 24 * 60 * 60 * 1000;

export default async function TableauDeBord() {
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);

  const [aFaire, parEtape, moisCourant, moisPrecedent, pieces, demandes, historique, sav] =
    await Promise.all([
      // Ce qui doit avancer cette semaine : tout ce qui est déjà en atelier, plus
      // ce dont la date d'expédition annoncée approche.
      prisma.order.findMany({
        where: {
          OR: [
            { status: { in: ["PIECES_RECUES", "EN_ASSEMBLAGE", "CONTROLE"] } },
            {
              status: { in: ["PAYEE", "PIECES_A_COMMANDER"] },
              promisedAt: { lte: new Date(Date.now() + 7 * JOUR) },
            },
          ],
        },
        orderBy: { promisedAt: "asc" },
        take: 8,
        include: { items: true, user: { select: { name: true } } },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        where: { paidAt: { gte: debutMois } },
        _sum: { totalCents: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: {
          paidAt: {
            gte: new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1),
            lt: debutMois,
          },
        },
        _sum: { totalCents: true },
      }),
      prisma.part.findMany({
        orderBy: { reference: "asc" },
        select: {
          id: true,
          reference: true,
          name: true,
          quantityOnHand: true,
          quantityReserved: true,
          reorderThreshold: true,
          restockDays: true,
        },
      }),
      prisma.inquiry.findMany({
        where: { status: "NOUVEAU" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.findMany({
        where: { paidAt: { gte: new Date(maintenant.getFullYear(), maintenant.getMonth() - 5, 1) } },
        select: { paidAt: true, totalCents: true },
      }),
      prisma.serviceCase.count({ where: { status: { notIn: ["TERMINE", "RENVOYE"] } } }),
    ]);

  const comptes = new Map(parEtape.map((ligne) => [ligne.status, ligne._count._all] as const));
  const caMois = moisCourant._sum.totalCents ?? 0;
  const caPrecedent = moisPrecedent._sum.totalCents ?? 0;

  const sousSeuil = pieces.filter(
    (piece) => piece.quantityOnHand - piece.quantityReserved <= piece.reorderThreshold,
  );

  // Six derniers mois, y compris les mois sans commande : un trou est une information.
  const mois = Array.from({ length: 6 }, (_, decalage) => {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - 5 + decalage, 1);
    const suivant = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const total = historique
      .filter((commande) => commande.paidAt && commande.paidAt >= date && commande.paidAt < suivant)
      .reduce((somme, commande) => somme + commande.totalCents, 0);
    return {
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", ""),
      valeurCents: total,
    };
  });

  const evolution =
    caPrecedent === 0 ? null : Math.round(((caMois - caPrecedent) / caPrecedent) * 100);

  return (
    <div className="mx-auto max-w-[80rem]">
      <header className="mb-8">
        <h1 className="type-display-2">Tableau de bord</h1>
        <p className="type-body measure mt-3 text-fg-soft">
          {formatDate(maintenant)} — ce qu&apos;il y a à faire, et ce qui bloque.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Chiffre
          terme="À assembler"
          valeur={String(aFaire.length)}
          detail="Commandes en atelier ou attendues sous sept jours"
        />
        <Chiffre
          terme="Chiffre d'affaires du mois"
          valeur={formatPrice(caMois)}
          detail={
            evolution === null
              ? `${moisCourant._count._all} commande(s) réglée(s)`
              : `${evolution >= 0 ? "+" : ""}${evolution} % par rapport au mois précédent`
          }
        />
        <Chiffre
          terme="Pièces sous le seuil"
          valeur={String(sousSeuil.length)}
          ton={sousSeuil.length > 0 ? "alerte" : "neutre"}
          detail={sousSeuil.length > 0 ? "À recommander" : "Rien à recommander"}
        />
        <Chiffre
          terme="Demandes non lues"
          valeur={String(demandes.length)}
          ton={demandes.length > 0 ? "alerte" : "neutre"}
          detail={sav > 0 ? `${sav} dossier(s) SAV ouvert(s)` : "Aucun dossier SAV ouvert"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panneau
          titre="À faire cette semaine"
          aide="Par date d'expédition annoncée, la plus proche en premier."
          action={
            <Link href="/atelier/commandes" className="type-mono link-underline text-accent">
              Tout le kanban
            </Link>
          }
        >
          {aFaire.length === 0 ? (
            <p className="type-caption text-fg-soft">Rien en atelier. Le tableau est vide.</p>
          ) : (
            <ul className="flex flex-col">
              {aFaire.map((commande) => {
                const enRetard = commande.promisedAt && commande.promisedAt < maintenant;
                return (
                  <li key={commande.id} className="border-b border-rule last:border-0">
                    <Link
                      href={`/atelier/commandes/${commande.number}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                    >
                      <span className="type-mono text-fg-soft">{commande.number}</span>
                      <span className="type-ui flex-1 truncate text-fg">
                        {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                        <span className="type-caption ml-2 text-fg-soft">
                          {commande.user?.name ?? commande.email}
                        </span>
                      </span>
                      <Pill ton={enRetard ? "alerte" : "neutre"}>
                        {libelleStatut(commande.status)}
                      </Pill>
                      <span
                        className={cnDate(enRetard)}
                        title={enRetard ? "Date d'expédition annoncée dépassée" : undefined}
                      >
                        {formatDate(commande.promisedAt) ?? "—"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>

        <Panneau titre="Commandes par étape" aide="Toutes les commandes, y compris livrées.">
          <BarresHorizontales
            donnees={ETAPES_CLIENT.map((etape) => ({
              label: etape.label,
              valeur: comptes.get(etape.statut) ?? 0,
              detail: `${comptes.get(etape.statut) ?? 0} commande(s) · ${etape.description}`,
            }))}
          />
        </Panneau>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panneau titre="Chiffre d'affaires" aide="Six derniers mois, commandes réglées.">
          <HistogrammeMois donnees={mois} />
        </Panneau>

        <Panneau
          titre="Stock sous le seuil"
          aide="Quantité libre inférieure ou égale au seuil d'alerte."
          action={
            <Link href="/atelier/stock" className="type-mono link-underline text-accent">
              Tout le stock
            </Link>
          }
        >
          {sousSeuil.length === 0 ? (
            <p className="type-caption text-fg-soft">Aucune pièce à recommander.</p>
          ) : (
            <ul className="flex flex-col">
              {sousSeuil.slice(0, 8).map((piece) => {
                const libre = piece.quantityOnHand - piece.quantityReserved;
                return (
                  <li key={piece.id} className="border-b border-rule last:border-0">
                    <Link
                      href={`/atelier/stock/${piece.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                    >
                      <span className="type-mono text-fg-soft">{piece.reference}</span>
                      <span className="type-ui flex-1 truncate text-fg">{piece.name}</span>
                      <span className={libre <= 0 ? "type-mono text-alert" : "type-mono text-fg-soft"}>
                        {libre} libre · seuil {piece.reorderThreshold}
                      </span>
                      <span className="type-caption text-fg-soft">{piece.restockDays} j</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panneau>
      </div>

      {demandes.length > 0 && (
        <div className="mt-4">
          <Panneau
            titre="Demandes non lues"
            action={
              <Link href="/atelier/demandes" className="type-mono link-underline text-accent">
                Toutes les demandes
              </Link>
            }
          >
            <ul className="flex flex-col">
              {demandes.map((demande) => (
                <li key={demande.id} className="border-b border-rule last:border-0">
                  <Link
                    href={`/atelier/demandes/${demande.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                  >
                    <span className="type-ui text-fg">{demande.name}</span>
                    <span className="type-caption flex-1 truncate text-fg-soft">
                      {demande.message}
                    </span>
                    <Pill ton={demande.type === "SUR_MESURE" ? "accent" : "neutre"}>
                      {demande.type === "SUR_MESURE" ? "Sur-mesure" : "Contact"}
                    </Pill>
                    <span className="type-mono text-fg-soft">{formatDate(demande.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panneau>
        </div>
      )}
    </div>
  );
}

function cnDate(enRetard: boolean | null | undefined): string {
  return enRetard ? "type-mono text-alert" : "type-mono text-fg-soft";
}
