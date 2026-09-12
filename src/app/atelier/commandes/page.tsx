import Link from "next/link";
import { changerEtape } from "@/app/actions/atelier-commandes";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { TableauDefilant } from "@/components/atelier/tableau-defilant";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { ETAPES_CLIENT, formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";

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
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-display-2">Commandes</h1>
          <p className="type-body mt-2 text-fg-soft">
            {commandes.length} montre(s) dans le circuit. Le bouton avance d&apos;une étape et
            prévient le client.
          </p>
        </div>
        <Link href="/atelier/commandes/liste" className="type-ui link-underline text-accent">
          Vue liste et export
        </Link>
      </header>

      <BandeauExemple
        nombre={commandes.filter((commande) => commande.isSample).length}
        quoi="commandes du tableau"
      />

      {/* Sept étapes ne tiennent pas de front sur un écran : le tableau défile. */}
      <TableauDefilant label="Étapes de l'atelier">
        <div className="flex min-w-max gap-3">
          {ETAPES_CLIENT.map((etape, index) => {
            const colonne = commandes.filter((commande) => commande.status === etape.statut);
            const suivante = ETAPES_CLIENT[index + 1];

            return (
              <section key={etape.statut} className="w-[17.5rem] shrink-0 snap-start">
                <header className="flex items-baseline justify-between gap-3 border-b-2 border-accent-decor pb-2">
                  <h2 className="type-ui text-fg">{etape.label}</h2>
                  <span className="type-mono text-fg-soft" data-numeric>
                    {colonne.length}
                  </span>
                </header>

                <ul className="mt-3 flex min-h-40 flex-col gap-3">
                  {colonne.map((commande) => {
                    // Une fois la montre partie, la date promise est tenue ou
                    // manquée : plus rien à faire, on n'alerte donc que sur les
                    // commandes encore à l'établi.
                    const enRetard =
                      index < ETAPES_CLIENT.length - 2 &&
                      commande.promisedAt !== null &&
                      commande.promisedAt < maintenant;
                    return (
                      <li key={commande.id} className="border border-rule bg-bg p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            href={`/atelier/commandes/${commande.number}`}
                            className="type-mono link-underline text-accent"
                          >
                            {commande.number}
                          </Link>
                          <span className="type-mono text-fg-soft" data-numeric>
                            {formatPrice(commande.totalCents)}
                          </span>
                        </div>

                        <p className="type-ui mt-2 text-fg">
                          {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                        </p>
                        <p className="type-caption text-fg-soft">
                          {commande.user?.name ?? commande.email}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {enRetard && <Pill ton="alerte">En retard</Pill>}
                          <span className="type-caption text-fg-soft">
                            Promis le {formatDate(commande.promisedAt) ?? "—"}
                          </span>
                        </div>

                        {suivante && (
                          <form action={changerEtape} className="mt-4">
                            <input type="hidden" name="numero" value={commande.number} />
                            <input type="hidden" name="etape" value={suivante.statut} />
                            <button
                              type="submit"
                              className="type-ui flex min-h-11 w-full items-center justify-center rounded-field border border-accent px-3 text-accent transition-colors duration-200 hover:bg-accent hover:text-on-accent"
                            >
                              → {suivante.label}
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}

                  {colonne.length === 0 && (
                    <li className="flex min-h-40 items-center justify-center border border-dashed border-rule p-5">
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
