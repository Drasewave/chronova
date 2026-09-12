import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { ViderPanier } from "@/components/panier/vider-panier";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";
import type { WatchRender } from "@/watch/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Commande enregistrée",
  robots: { index: false, follow: false },
};

export default async function Confirmation(props: PageProps<"/commande/confirmation">) {
  const { commande: numero, demo } = await props.searchParams;
  const session = await auth();

  const commande =
    typeof numero === "string"
      ? await prisma.order.findUnique({
          where: { number: numero },
          include: { items: { include: { configuration: true } } },
        })
      : null;

  const aMoi = commande && session?.user && commande.userId === session.user.id;

  return (
    <Section fond="papier">
      <ViderPanier />

      <div className="mx-auto max-w-[46rem]">
        <p className="type-mono text-fg-soft">C&apos;est noté</p>
        <h1 className="type-display-2 mt-4">Votre montre va être montée.</h1>

        {demo === "1" && (
          <p className="mt-6 flex flex-wrap items-center gap-3">
            <Pill ton="alerte">Paiement simulé</Pill>
            <span className="type-caption text-fg-soft">
              Aucune somme n&apos;a été débitée : Stripe n&apos;est pas configuré sur cet
              environnement de développement.
            </span>
          </p>
        )}

        {aMoi && commande ? (
          <>
            <p className="type-lead mt-6 text-fg-soft">
              Commande <span className="type-mono">{commande.number}</span> enregistrée. Un e-mail de
              confirmation part à l&apos;instant ; vous serez prévenu·e à chaque changement
              d&apos;étape.
            </p>

            <div className="mt-10 rounded-card border border-rule bg-panel p-7">
              {commande.items.map((ligne) => {
                const render = (ligne.configuration.snapshot as { render?: WatchRender } | null)
                  ?.render;
                return (
                  <div key={ligne.id} className="flex flex-wrap items-center gap-6">
                    {render && (
                      <div className="w-28 rounded-card bg-bg p-2">
                        <WatchSvg
                          id={`confirmation-${ligne.id}`}
                          render={render}
                          detail="compact"
                          label="Votre montre"
                          className="h-auto w-full"
                        />
                      </div>
                    )}
                    <div>
                      <p className="type-title-2">
                        {(ligne.snapshot as { modele?: string } | null)?.modele ?? "Montre Chronova"}
                      </p>
                      <p className="type-mono mt-2 text-fg-soft">
                        Assemblage estimé · {ligne.configuration.leadTimeDays} jours
                      </p>
                    </div>
                  </div>
                );
              })}

              <dl className="mt-8 border-t border-rule pt-5">
                <div className="flex justify-between gap-4">
                  <dt className="type-body text-fg-soft">Total réglé</dt>
                  <dd className="type-title-2 text-fg" data-numeric>
                    {formatPrice(commande.totalCents)}
                  </dd>
                </div>
                {commande.promisedAt && (
                  <div className="mt-3 flex justify-between gap-4">
                    <dt className="type-body text-fg-soft">Expédition annoncée</dt>
                    <dd className="type-body text-fg">{formatDate(commande.promisedAt)}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href={`/compte/commandes/${commande.number}`}>
                Suivre l&apos;assemblage
              </ButtonLink>
              <ButtonLink href="/collection" variant="discret">
                Revoir la collection
              </ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="type-lead mt-6 text-fg-soft">
              Votre commande est enregistrée. Le détail et le suivi d&apos;assemblage sont
              accessibles depuis votre compte.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href="/compte/commandes">Voir mes commandes</ButtonLink>
            </div>
          </>
        )}

        <p className="type-caption mt-12 text-fg-soft">
          Une question sur cette commande ?{" "}
          <Link href="/contact" className="link-underline text-accent">
            Écrire à l&apos;atelier
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
