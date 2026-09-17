import Link from "next/link";
import { notFound } from "next/navigation";
import { enregistrerMouvement, enregistrerPiece } from "@/app/actions/atelier-stock";
import { Bouton, Champ, Liste, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill, SamplePill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import {
  LIBELLE_CATEGORIE,
  LIBELLE_ETAT,
  LIBELLE_MOUVEMENT,
  MOUVEMENTS_MANUELS,
  TON_ETAT,
  effetMouvement,
  etatPiece,
} from "@/lib/atelier/stock";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Assez pour couvrir la vie d'une référence sans charger toute la base. */
const JOURNAL_AFFICHE = 60;

export async function generateMetadata(props: PageProps<"/atelier/stock/[reference]">) {
  const { reference } = await props.params;
  return { title: `Pièce ${reference}` };
}

/**
 * Fiche d'une référence.
 *
 * Trois questions, dans cet ordre : combien en reste-t-il, d'où vient ce
 * chiffre, et où cette pièce sert-elle ? Le journal répond à la deuxième et
 * rend le stock explicable — c'est ce qui distingue un inventaire d'un compteur.
 */
export default async function FichePiece(props: PageProps<"/atelier/stock/[reference]">) {
  const { reference } = await props.params;

  const piece = await prisma.part.findUnique({
    where: { reference },
    include: {
      supplier: true,
      movements: {
        orderBy: { createdAt: "desc" },
        take: JOURNAL_AFFICHE,
        include: { order: { select: { number: true } } },
      },
      options: { include: { group: { include: { step: true } } } },
      orderParts: {
        where: { consumedAt: null },
        include: {
          orderItem: {
            include: { order: { select: { number: true, status: true, promisedAt: true } } },
          },
        },
      },
    },
  });
  if (!piece) notFound();

  const [fournisseurs, totalMouvements] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
    prisma.stockMovement.count({ where: { partId: piece.id } }),
  ]);
  const tronque = totalMouvements - piece.movements.length;
  const etat = etatPiece(piece);
  const libre = piece.quantityOnHand - piece.quantityReserved;

  return (
    <div className="mx-auto max-w-[84rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link href="/atelier/stock" className="type-mono link-underline text-fg-soft hover:text-accent">
          ← Stock
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono flex flex-wrap items-center gap-3 text-fg-soft">
            {piece.reference}
            {piece.isSample && <SamplePill />}
          </p>
          <h1 className="type-display-2 mt-2">{piece.name}</h1>
          <p className="type-body mt-2 text-fg-soft">
            {LIBELLE_CATEGORIE[piece.category]}
            {piece.supplier ? " · " : ""}
            {piece.supplier && (
              <Link
                href={`/atelier/fournisseurs/${piece.supplier.id}`}
                className="link-underline text-accent"
              >
                {piece.supplier.name}
              </Link>
            )}
            {piece.storageLocation ? ` · rangement ${piece.storageLocation}` : ""}
          </p>
        </div>
        <Pill ton={TON_ETAT[etat]}>{LIBELLE_ETAT[etat]}</Pill>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          <Panneau titre="Compte" aide="Recomposé depuis le journal ci-contre.">
            <dl className="flex flex-col gap-2">
              <Ligne terme="En rayon" valeur={String(piece.quantityOnHand)} />
              <Ligne terme="Réservé" valeur={String(piece.quantityReserved)} />
              <Ligne terme="Libre" valeur={String(libre)} fort />
              <hr className="my-2 border-rule" />
              <Ligne terme="Seuil d'alerte" valeur={String(piece.reorderThreshold)} />
              <Ligne terme="Réapprovisionnement" valeur={`${piece.restockDays} jours`} />
              <hr className="my-2 border-rule" />
              <Ligne terme="Prix d'achat" valeur={formatPrice(piece.purchasePriceCents)} />
              <Ligne
                terme="Valeur en rayon"
                valeur={formatPrice(piece.purchasePriceCents * piece.quantityOnHand)}
                fort
              />
            </dl>
          </Panneau>

          <Panneau
            titre="Saisir un mouvement"
            aide="Réception, casse, correction d'inventaire. Les réservations et les sorties d'assemblage sont écrites par les commandes."
          >
            <form action={enregistrerMouvement} className="flex flex-col gap-4">
              <input type="hidden" name="reference" value={piece.reference} />
              <Champ label="Type">
                <Liste name="type" defaultValue="ENTREE">
                  {MOUVEMENTS_MANUELS.map((type) => (
                    <option key={type} value={type}>
                      {LIBELLE_MOUVEMENT[type]}
                    </option>
                  ))}
                </Liste>
              </Champ>
              <Champ label="Quantité" aide="Pour un ajustement, un nombre négatif retire du stock.">
                <Saisie name="quantite" type="number" step="1" defaultValue={1} />
              </Champ>
              <Champ label="Motif (facultatif)">
                <Saisie name="motif" type="text" maxLength={120} />
              </Champ>
              <Bouton>Enregistrer le mouvement</Bouton>
            </form>
          </Panneau>

          <Panneau titre="Réglages" aide="Les quantités ne se règlent pas ici : elles viennent du journal.">
            <form action={enregistrerPiece} className="flex flex-col gap-4">
              <input type="hidden" name="reference" value={piece.reference} />
              <Champ label="Nom de la pièce">
                <Saisie name="nom" type="text" defaultValue={piece.name} />
              </Champ>
              <Champ label="Fournisseur">
                <Liste name="fournisseur" defaultValue={piece.supplierId ?? ""}>
                  <option value="">[À REMPLIR : fournisseur]</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Liste>
              </Champ>
              <div className="flex flex-wrap gap-4">
                <Champ label="Prix d'achat (€)" className="min-w-[8rem] flex-1">
                  <Saisie
                    name="prix"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(piece.purchasePriceCents / 100).toFixed(2)}
                  />
                </Champ>
                <Champ label="Seuil d'alerte" className="min-w-[8rem] flex-1">
                  <Saisie name="seuil" type="number" step="1" min="0" defaultValue={piece.reorderThreshold} />
                </Champ>
                <Champ label="Délai (jours)" className="min-w-[8rem] flex-1">
                  <Saisie name="delai" type="number" step="1" min="0" defaultValue={piece.restockDays} />
                </Champ>
              </div>
              <Champ label="Rangement" aide="Tiroir, casier, boîte.">
                <Saisie name="rangement" type="text" defaultValue={piece.storageLocation ?? ""} />
              </Champ>
              <Champ label="Notes">
                <Zone name="notes" rows={3} defaultValue={piece.notes ?? ""} />
              </Champ>
              <Bouton>Enregistrer les réglages</Bouton>
            </form>
          </Panneau>
        </div>

        <div className="flex flex-col gap-4">
          <Panneau
            titre="Journal"
            aide="Deux colonnes, parce qu'un mouvement peut vider le tiroir sans changer ce qui est libre — ou l'inverse. Chacune totalise le compteur correspondant."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-b border-rule text-left">
                    <Th>Date</Th>
                    <Th>Mouvement</Th>
                    <Th align="right">Rayon</Th>
                    <Th align="right">Libre</Th>
                    <Th>Motif</Th>
                  </tr>
                </thead>
                <tbody>
                  {piece.movements.map((mouvement) => {
                    const effet = effetMouvement(mouvement);
                    return (
                      <tr key={mouvement.id} className="border-b border-rule">
                        <Td>
                          <span className="type-mono whitespace-nowrap text-fg-soft">
                            {formatDate(mouvement.createdAt)}
                          </span>
                        </Td>
                        <Td>
                          <span className="type-ui text-fg">
                            {LIBELLE_MOUVEMENT[mouvement.type]}
                          </span>
                        </Td>
                        <Delta valeur={effet.rayon} />
                        <Delta valeur={effet.libre} />
                        <Td>
                          <span className="type-caption text-fg-soft">
                            {mouvement.order ? (
                              <Link
                                href={`/atelier/commandes/${mouvement.order.number}`}
                                className="link-underline text-fg"
                              >
                                {mouvement.reason ?? mouvement.order.number}
                              </Link>
                            ) : (
                              (mouvement.reason ?? "—")
                            )}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {piece.movements.length === 0 && (
              <p className="type-caption text-fg-soft">Aucun mouvement enregistré.</p>
            )}
            {tronque > 0 && (
              <p className="type-caption mt-4 text-fg-soft">
                {tronque} mouvement(s) plus anciens ne sont pas affichés : les colonnes ne
                totalisent donc pas les compteurs ci-contre.
              </p>
            )}
          </Panneau>

          <Panneau
            titre="Commandes qui la retiennent"
            aide="Pièces promises, pas encore montées. C'est la différence entre le rayon et le libre."
          >
            {piece.orderParts.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucune réservation en cours.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {piece.orderParts.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3 last:border-0 last:pb-0"
                  >
                    <Link
                      href={`/atelier/commandes/${reservation.orderItem.order.number}`}
                      className="type-mono link-underline text-accent"
                    >
                      {reservation.orderItem.order.number}
                    </Link>
                    <span className="type-caption text-fg-soft">
                      {libelleStatut(reservation.orderItem.order.status)}
                      {reservation.orderItem.order.promisedAt
                        ? ` · promis le ${formatDate(reservation.orderItem.order.promisedAt)}`
                        : ""}
                    </span>
                    <span className="type-mono text-fg" data-numeric>
                      ×{reservation.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau
            titre="Où elle sert"
            aide="Options du configurateur liées à cette référence. Une rupture les rend non sélectionnables."
          >
            {piece.options.length === 0 ? (
              <p className="type-caption text-fg-soft">
                Aucune option ne pointe encore sur cette pièce.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {piece.options.map((option) => (
                  <li key={option.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="type-mono text-fg-soft">{option.group.step.label}</span>
                    <span className="type-ui text-fg">
                      {option.group.label} · {option.label}
                    </span>
                    {!option.isActive && <Pill ton="alerte">Désactivée</Pill>}
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
        </div>
      </div>
    </div>
  );
}

function Ligne({ terme, valeur, fort }: { terme: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="type-caption text-fg-soft">{terme}</dt>
      <dd className={fort ? "type-ui text-fg" : "type-caption text-fg"} data-numeric>
        {valeur}
      </dd>
    </div>
  );
}


/** Une variation du journal. Zéro reste discret : ce mouvement n'a pas joué là. */
function Delta({ valeur }: { valeur: number }) {
  return (
    <td className="px-3 py-3 text-right">
      <span
        className={`type-mono ${valeur === 0 ? "text-fg-soft" : valeur < 0 ? "text-alert" : "text-positive"}`}
        data-numeric
      >
        {valeur === 0 ? "—" : `${valeur > 0 ? "+" : ""}${valeur}`}
      </span>
    </td>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`type-mono px-3 py-3 font-normal text-fg-soft ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <td className={`px-3 py-3 ${align === "right" ? "text-right" : ""}`}>{children}</td>;
}
