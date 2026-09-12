import Link from "next/link";
import { notFound } from "next/navigation";
import {
  changerStatutBon,
  creerBonDeCommande,
  enregistrerFournisseur,
  recevoirBonDeCommande,
} from "@/app/actions/atelier-stock";
import { Bouton, BoutonLeger, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { LIBELLE_CATEGORIE, LIBELLE_ETAT, TON_ETAT, etatPiece } from "@/lib/atelier/stock";
import { formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import type { PurchaseStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const LIBELLE_BON: Record<PurchaseStatus, string> = {
  BROUILLON: "Brouillon",
  ENVOYEE: "Envoyée",
  PARTIELLE: "Reçue en partie",
  RECUE: "Reçue",
  ANNULEE: "Annulée",
};

export async function generateMetadata(props: PageProps<"/atelier/fournisseurs/[id]">) {
  const { id } = await props.params;
  const fournisseur = await prisma.supplier.findUnique({ where: { id }, select: { name: true } });
  return { title: fournisseur?.name ?? "Fournisseur" };
}

/**
 * Fiche fournisseur.
 *
 * Tout ce qu'il faut pour passer commande sans quitter la page : le contact,
 * ce qui manque, et un bon prérempli. La quantité proposée ramène chaque
 * référence à deux fois son seuil — commander le seuil tout juste ferait
 * repartir l'alerte au premier montage.
 */
export default async function FicheFournisseur(props: PageProps<"/atelier/fournisseurs/[id]">) {
  const { id } = await props.params;

  const fournisseur = await prisma.supplier.findUnique({
    where: { id },
    include: {
      parts: { orderBy: [{ category: "asc" }, { reference: "asc" }] },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { lines: { include: { part: { select: { reference: true, name: true } } } } },
      },
    },
  });
  if (!fournisseur) notFound();

  const manquantes = fournisseur.parts
    .map((piece) => ({
      piece,
      etat: etatPiece(piece),
      aCommander: piece.reorderThreshold * 2 - (piece.quantityOnHand - piece.quantityReserved),
    }))
    .filter((ligne) => ligne.aCommander > 0);

  const coutEstime = manquantes.reduce(
    (somme, ligne) => somme + ligne.aCommander * ligne.piece.purchasePriceCents,
    0,
  );

  return (
    <div className="mx-auto max-w-[84rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link
          href="/atelier/fournisseurs"
          className="type-mono link-underline text-fg-soft hover:text-accent"
        >
          ← Fournisseurs
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="type-display-2">{fournisseur.name}</h1>
        <p className="type-body mt-2 text-fg-soft">
          {fournisseur.parts.length} référence(s) · délai annoncé {fournisseur.leadTimeDays} jours
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          <Panneau
            titre="Coordonnées"
            aide="Rien n'a été inventé ici : ces champs attendent les vraies informations."
          >
            <form action={enregistrerFournisseur} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={fournisseur.id} />
              <Champ label="Interlocuteur">
                <Saisie
                  name="contact"
                  defaultValue={fournisseur.contactName ?? ""}
                  placeholder="[À REMPLIR : nom du contact]"
                />
              </Champ>
              <Champ label="E-mail">
                <Saisie
                  name="email"
                  type="email"
                  defaultValue={fournisseur.email ?? ""}
                  placeholder="[À REMPLIR : e-mail]"
                />
              </Champ>
              <Champ label="Téléphone">
                <Saisie
                  name="telephone"
                  type="tel"
                  defaultValue={fournisseur.phone ?? ""}
                  placeholder="[À REMPLIR : téléphone]"
                />
              </Champ>
              <Champ label="Site">
                <Saisie
                  name="site"
                  type="url"
                  defaultValue={fournisseur.website ?? ""}
                  placeholder="[À REMPLIR : site]"
                />
              </Champ>
              <Champ label="Adresse">
                <Zone
                  name="adresse"
                  rows={3}
                  defaultValue={fournisseur.address ?? ""}
                  placeholder="[À REMPLIR : adresse]"
                />
              </Champ>
              <Champ label="Délai annoncé (jours)" aide="Sert au délai affiché sur une rupture.">
                <Saisie
                  name="delai"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={fournisseur.leadTimeDays}
                />
              </Champ>
              <Champ label="Notes">
                <Zone name="notes" rows={3} defaultValue={fournisseur.notes ?? ""} />
              </Champ>
              <Bouton>Enregistrer</Bouton>
            </form>
          </Panneau>
        </div>

        <div className="flex flex-col gap-4">
          <Panneau
            titre="À commander"
            aide="Références sous leur seuil chez ce fournisseur. La quantité proposée les ramène au double du seuil."
            action={
              manquantes.length > 0 ? (
                <form action={creerBonDeCommande}>
                  <input type="hidden" name="fournisseur" value={fournisseur.id} />
                  <Bouton>Préparer un bon de commande</Bouton>
                </form>
              ) : undefined
            }
          >
            {manquantes.length === 0 ? (
              <p className="type-caption text-fg-soft">
                Rien à commander : toutes les références sont au-dessus de leur seuil.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] border-collapse">
                    <thead>
                      <tr className="border-b border-rule text-left">
                        <Th>Référence</Th>
                        <Th>Pièce</Th>
                        <Th>État</Th>
                        <Th align="right">À commander</Th>
                        <Th align="right">Coût</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {manquantes.map(({ piece, etat, aCommander }) => (
                        <tr key={piece.id} className="border-b border-rule">
                          <Td>
                            <Link
                              href={`/atelier/stock/${piece.reference}`}
                              className="type-mono link-underline text-accent"
                            >
                              {piece.reference}
                            </Link>
                          </Td>
                          <Td>
                            <span className="type-ui text-fg">{piece.name}</span>
                            <span className="type-caption block text-fg-soft">
                              {LIBELLE_CATEGORIE[piece.category]}
                            </span>
                          </Td>
                          <Td>
                            <Pill ton={TON_ETAT[etat]}>{LIBELLE_ETAT[etat]}</Pill>
                          </Td>
                          <Td align="right">
                            <span className="type-ui text-fg" data-numeric>
                              {aCommander}
                            </span>
                          </Td>
                          <Td align="right">
                            <span className="type-mono text-fg-soft" data-numeric>
                              {formatPrice(aCommander * piece.purchasePriceCents)}
                            </span>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="type-caption mt-4 text-fg-soft">
                  Total estimé au dernier prix d&apos;achat connu :{" "}
                  <span className="type-mono text-fg" data-numeric>
                    {formatPrice(coutEstime)}
                  </span>
                </p>
              </>
            )}
          </Panneau>

          <Panneau titre="Bons de commande" aide="La réception fait entrer les pièces en stock.">
            {fournisseur.orders.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucun bon de commande.</p>
            ) : (
              <ul className="flex flex-col gap-5">
                {fournisseur.orders.map((bon) => (
                  <li key={bon.id} className="border-b border-rule pb-5 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="type-mono text-fg">{bon.reference}</span>
                      <Pill ton={bon.status === "RECUE" ? "positif" : "neutre"}>
                        {LIBELLE_BON[bon.status]}
                      </Pill>
                    </div>

                    <p className="type-caption mt-2 text-fg-soft">
                      Créé le {formatDate(bon.createdAt)}
                      {bon.expectedAt ? ` · attendu vers le ${formatDate(bon.expectedAt)}` : ""}
                      {bon.receivedAt ? ` · reçu le ${formatDate(bon.receivedAt)}` : ""}
                    </p>

                    <ul className="mt-3 flex flex-col gap-1">
                      {bon.lines.map((ligne) => (
                        <li key={ligne.id} className="flex flex-wrap items-baseline gap-x-3">
                          <span className="type-mono text-fg-soft">{ligne.part.reference}</span>
                          <span className="type-caption flex-1 text-fg">{ligne.part.name}</span>
                          <span className="type-mono text-fg" data-numeric>
                            ×{ligne.quantity}
                          </span>
                          <span className="type-mono text-fg-soft" data-numeric>
                            {formatPrice(ligne.quantity * ligne.unitCostCents)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {bon.status !== "RECUE" && bon.status !== "ANNULEE" && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {bon.status === "BROUILLON" && (
                          <form action={changerStatutBon}>
                            <input type="hidden" name="bon" value={bon.id} />
                            <input type="hidden" name="statut" value="ENVOYEE" />
                            <BoutonLeger>Marquer envoyée</BoutonLeger>
                          </form>
                        )}
                        <form action={recevoirBonDeCommande}>
                          <input type="hidden" name="bon" value={bon.id} />
                          <Bouton>Réceptionner</Bouton>
                        </form>
                        <form action={changerStatutBon}>
                          <input type="hidden" name="bon" value={bon.id} />
                          <input type="hidden" name="statut" value="ANNULEE" />
                          <BoutonLeger>Annuler</BoutonLeger>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau titre="Toutes les références" aide="Ce que cette maison fournit à l'atelier.">
            <ul className="flex flex-col gap-2">
              {fournisseur.parts.map((piece) => {
                const etat = etatPiece(piece);
                return (
                  <li key={piece.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <Link
                      href={`/atelier/stock/${piece.reference}`}
                      className="type-mono link-underline text-accent"
                    >
                      {piece.reference}
                    </Link>
                    <span className="type-caption flex-1 text-fg">{piece.name}</span>
                    <span className="type-mono text-fg-soft" data-numeric>
                      {piece.quantityOnHand - piece.quantityReserved} libre(s)
                    </span>
                    <Pill ton={TON_ETAT[etat]}>{LIBELLE_ETAT[etat]}</Pill>
                  </li>
                );
              })}
            </ul>
          </Panneau>
        </div>
      </div>
    </div>
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
