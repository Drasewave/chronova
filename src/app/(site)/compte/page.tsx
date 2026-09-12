import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button";
import { OrderTimeline } from "@/components/compte/order-timeline";
import { Pill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { ETAPES_CLIENT, formatDate, indexEtape, libelleStatut } from "@/lib/commandes/etapes";
import type { WatchRender } from "@/watch/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: false },
};

export default async function Compte() {
  const session = await auth();
  const userId = session!.user.id;

  const commandes = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { configuration: true } },
      events: { where: { isPublic: true }, orderBy: { createdAt: "asc" } },
    },
  });

  const enCours = commandes.find(
    (commande) => indexEtape(commande.status) >= 0 && commande.status !== "LIVREE",
  );

  return (
    <div>
      <h1 className="type-display-2">Vue d&apos;ensemble</h1>

      {commandes.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-rule p-8">
          <p className="type-body measure text-fg-soft">
            Aucune commande pour l&apos;instant. Chaque montre étant montée à la demande, votre
            première Chronova commencera à exister le jour où vous la composerez.
          </p>
          <ButtonLink href="/composer" className="mt-7">
            Composer ma montre
          </ButtonLink>
        </div>
      ) : (
        <>
          {enCours && (
            <section className="mt-10 rounded-card border border-rule bg-panel p-7 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="type-mono text-fg-soft">{enCours.number}</p>
                  <h2 className="type-title-1 mt-2">
                    {(enCours.items[0]?.snapshot as { modele?: string } | null)?.modele ??
                      "Votre montre"}
                  </h2>
                </div>
                <Pill ton="accent">{libelleStatut(enCours.status)}</Pill>
              </div>

              <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
                {(() => {
                  const render = (
                    enCours.items[0]?.configuration.snapshot as { render?: WatchRender } | null
                  )?.render;
                  if (!render) return null;
                  return (
                    <div className="rounded-card bg-bg p-3">
                      <WatchSvg
                        id={`compte-${enCours.id}`}
                        render={render}
                        detail="compact"
                        label="Votre montre en cours d'assemblage"
                        className="h-auto w-full"
                      />
                    </div>
                  );
                })()}
                <OrderTimeline statut={enCours.status} evenements={enCours.events} />
              </div>

              {enCours.promisedAt && (
                <p className="type-caption mt-8 text-fg-soft">
                  Expédition annoncée autour du {formatDate(enCours.promisedAt)}. Vous êtes prévenu·e
                  à chaque changement d&apos;étape.
                </p>
              )}

              <Link
                href={`/compte/commandes/${enCours.number}`}
                className="type-ui link-underline mt-6 inline-block text-accent"
              >
                Voir le détail de l&apos;assemblage
              </Link>
            </section>
          )}

          <section className="mt-14">
            <h2 className="type-title-1">Vos commandes</h2>
            <ul className="mt-6 border-t border-rule">
              {commandes.map((commande) => (
                <li key={commande.id} className="border-b border-rule">
                  <Link
                    href={`/compte/commandes/${commande.number}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5"
                  >
                    <span className="type-mono text-fg-soft">{commande.number}</span>
                    <span className="type-ui flex-1 text-fg">
                      {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                    </span>
                    <span className="type-caption text-fg-soft">
                      {libelleStatut(commande.status)}
                    </span>
                    <span className="type-ui text-fg" data-numeric>
                      {formatPrice(commande.totalCents)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="mt-14 border-t border-rule pt-8">
        <h2 className="type-title-2">Les étapes, en résumé</h2>
        <dl className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {ETAPES_CLIENT.map((etape) => (
            <div key={etape.statut}>
              <dt className="type-ui text-fg">{etape.label}</dt>
              <dd className="type-caption text-fg-soft">{etape.description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
