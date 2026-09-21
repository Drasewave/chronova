import Link from "next/link";
import { changerEtape } from "@/app/actions/atelier-commandes";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { TableauDefilant } from "@/components/atelier/tableau-defilant";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { ETAPES_CLIENT, formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import { TitrePage } from "@/components/atelier/gabarit";

export const metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

/**
 * Kanban par étape d'atelier.
 *
 * Pas de glisser-déposer : sur une tablette posée à l'établi, avec les doigts,
 * un bouton « étape suivante » est plus rapide et plus sûr qu'un glissement — et
 * il reste utilisable au clavier sans une ligne de code supplémentaire.
 */
export default async function Kanban() {
  const commandes = await prisma.order.findMany({
    where: { status: { notIn: ["EN_ATTENTE_PAIEMENT", "ANNULEE", "REMBOURSEE"] } },
    orderBy: [{ promisedAt: "asc" }],
    include: { items: true, user: { select: { name: true } } },
  });

  const maintenant = new Date();

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <TitrePage>Commandes</TitrePage>
          <p className="type-ui mt-2 max-w-[72ch] font-normal text-fg-soft">
            {commandes.length} montre(s) dans le circuit. Le bouton avance d&apos;une étape et
            prévient le client.
          </p>
        </div>
        <Link href="/atelier/commandes/liste" className="type-ui lien-atelier link-underline text-gold">
          Vue liste et export
        </Link>
      </header>

      <BandeauExemple
        nombre={commandes.filter((commande) => commande.isSample).length}
        quoi="commandes du tableau"
      />

      {/* Sept étapes ne tiennent pas de front sur un écran : le tableau défile. */}
      <TableauDefilant label="Étapes de l'atelier">
        <div className="flex min-w-max items-stretch gap-3">
          {ETAPES_CLIENT.map((etape, index) => {
            const colonne = commandes.filter((commande) => commande.status === etape.statut);
            const suivante = ETAPES_CLIENT[index + 1];

            return (
              <section
                key={etape.statut}
                className="flex w-[17.5rem] shrink-0 snap-start flex-col rounded-card bg-bg-alt p-2"
              >
                {/* La colonne est un plateau teinté, sans bordure : seules les
                    cartes qu'elle porte en ont une. */}
                <header className="flex min-h-11 items-center justify-between gap-3 px-2">
                  <h2 className="type-ui text-fg">{etape.label}</h2>
                  <Pill ton={colonne.length > 0 ? "accent" : "neutre"}>{colonne.length}</Pill>
                </header>

                <ul className="mt-1 flex min-h-32 flex-1 flex-col gap-2">
                  {colonne.map((commande) => {
                    // Une fois la montre partie, la date promise est tenue ou
                    // manquée : plus rien à faire, on n'alerte donc que sur les
                    // commandes encore à l'établi.
                    const enRetard =
                      index < ETAPES_CLIENT.length - 2 &&
                      commande.promisedAt !== null &&
                      commande.promisedAt < maintenant;
                    return (
                      <li key={commande.id} className="rounded-field border border-rule bg-panel px-3 pb-3 pt-1">
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            href={`/atelier/commandes/${commande.number}`}
                            className="type-mono lien-atelier link-underline text-gold"
                          >
                            {commande.number}
                          </Link>
                          <span className="type-ui text-fg" data-numeric>
                            {formatPrice(commande.totalCents)}
                          </span>
                        </div>

                        <p className="type-ui text-fg">
                          {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                        </p>
                        <p className="type-caption text-fg-soft">
                          {commande.user?.name ?? commande.email}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {enRetard && <Pill ton="alerte">En retard</Pill>}
                          <span className="type-caption text-fg-soft" data-numeric>
                            Promis le {formatDate(commande.promisedAt) ?? "—"}
                          </span>
                        </div>

                        {suivante && (
                          <form action={changerEtape} className="mt-3">
                            <input type="hidden" name="numero" value={commande.number} />
                            <input type="hidden" name="etape" value={suivante.statut} />
                            <button
                              type="submit"
                              className="type-ui flex min-h-11 w-full items-center justify-center rounded-pill border border-field px-3 text-fg transition-colors duration-200 hover:border-gold hover:bg-accent hover:text-on-accent"
                            >
                              → {suivante.label}
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}

                  {colonne.length === 0 && (
                    <li className="flex min-h-32 flex-1 items-center justify-center rounded-field border border-dashed border-rule p-5">
                      <p className="type-caption text-fg-soft">Rien à cette étape.</p>
                    </li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      </TableauDefilant>
    </div>
  );
}
