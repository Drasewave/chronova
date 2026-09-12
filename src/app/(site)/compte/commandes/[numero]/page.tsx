import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { OrderTimeline } from "@/components/compte/order-timeline";
import { Pill } from "@/components/ui/pill";
import { PhotoPlaceholder } from "@/components/ui/placeholder";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import type { SummaryLine } from "@/lib/configurateur/configuration";
import type { WatchRender } from "@/watch/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
};

export default async function Commande(props: PageProps<"/compte/commandes/[numero]">) {
  const { numero } = await props.params;
  const session = await auth();

  const commande = await prisma.order.findUnique({
    where: { number: numero },
    include: {
      items: { include: { configuration: true } },
      events: { where: { isPublic: true }, orderBy: { createdAt: "asc" } },
      photos: { where: { isPublic: true }, orderBy: { createdAt: "asc" } },
      qc: true,
      warranty: true,
    },
  });

  // Une commande qui n'est pas la vôtre est introuvable, pas « interdite » :
  // répondre 403 confirmerait son existence.
  if (!commande || commande.userId !== session!.user.id) notFound();

  const ligne = commande.items[0];
  const instantane = ligne?.configuration.snapshot as
    | { render?: WatchRender; summary?: SummaryLine[] }
    | null;
  const adresse = commande.shippingAddress as {
    fullName?: string;
    line1?: string;
    postalCode?: string;
    city?: string;
  } | null;

  return (
    <div>
      <nav aria-label="Fil d'Ariane">
        <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
          <li>
            <Link href="/compte/commandes" className="link-underline hover:text-accent">
              Mes commandes
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li className="text-fg">{commande.number}</li>
        </ol>
      </nav>

      <header className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="type-display-2">
            {(ligne?.snapshot as { modele?: string } | null)?.modele ?? "Votre montre"}
          </h1>
          <p className="type-mono mt-3 text-fg-soft">
            Commandée le {formatDate(commande.createdAt)}
          </p>
        </div>
        <Pill ton={commande.status === "LIVREE" ? "positif" : "accent"}>
          {libelleStatut(commande.status)}
        </Pill>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16">
        <div>
          {instantane?.render && (
            <div className="rounded-card border border-rule bg-bg-alt p-4">
              <WatchSvg
                id={`suivi-${commande.id}`}
                render={instantane.render}
                label="Votre montre, telle qu'elle est montée"
                className="h-auto w-full"
              />
            </div>
          )}

          {instantane?.summary && (
            <dl className="mt-8 border-t border-rule">
              {instantane.summary.map((entree) => (
                <div key={entree.groupKey} className="flex justify-between gap-4 border-b border-rule py-2.5">
                  <dt className="type-caption text-fg-soft">{entree.groupLabel}</dt>
                  <dd className="type-caption text-right text-fg">{entree.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="min-w-0">
          <section aria-labelledby="frise">
            <h2 id="frise" className="type-title-1">
              Où en est votre montre
            </h2>
            <div className="mt-8">
              <OrderTimeline statut={commande.status} evenements={commande.events} />
            </div>
          </section>

          {commande.photos.length > 0 && (
            <section aria-labelledby="photos" className="mt-14">
              <h2 id="photos" className="type-title-1">
                Photos d&apos;assemblage
              </h2>
              <p className="type-body measure mt-3 text-fg-soft">
                Prises à l&apos;établi, pendant le montage de votre montre.
              </p>
              <ul className="mt-7 grid gap-6 sm:grid-cols-2">
                {commande.photos.map((photo) => (
                  <li key={photo.id}>
                    {/* Les photos réelles arriveront par le CRM ; en attendant,
                        l'emplacement dit ce qui a été photographié. */}
                    <PhotoPlaceholder description={photo.alt} ratio="4 / 3" />
                    {photo.caption && (
                      <p className="type-caption mt-3 text-fg-soft">{photo.caption}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {commande.qc && (
            <section aria-labelledby="controle" className="mt-14">
              <h2 id="controle" className="type-title-1">
                Contrôle
              </h2>
              <dl className="mt-7 grid gap-px bg-rule sm:grid-cols-3">
                <Mesure
                  terme="Étanchéité"
                  valeur={
                    commande.qc.waterTestPassed === null
                      ? "En attente"
                      : commande.qc.waterTestPassed
                        ? `Testée à ${commande.qc.waterTestBar ?? "—"} bar`
                        : "Non conforme"
                  }
                />
                <Mesure
                  terme="Écart de marche"
                  valeur={
                    commande.qc.rateSecondsPerDay === null
                      ? "Mesure en cours"
                      : `${commande.qc.rateSecondsPerDay > 0 ? "+" : ""}${commande.qc.rateSecondsPerDay} s/jour`
                  }
                />
                <Mesure
                  terme="Amplitude"
                  valeur={commande.qc.amplitudeDegrees ? `${commande.qc.amplitudeDegrees}°` : "—"}
                />
              </dl>
              {commande.qc.notes && (
                <p className="type-body measure mt-5 text-fg-soft">{commande.qc.notes}</p>
              )}
            </section>
          )}

          <section aria-labelledby="livraison" className="mt-14">
            <h2 id="livraison" className="type-title-1">
              Livraison
            </h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="type-mono text-fg-soft">Adresse</p>
                <p className="type-body mt-2 text-fg">
                  {adresse?.fullName}
                  <br />
                  {adresse?.line1}
                  <br />
                  {adresse?.postalCode} {adresse?.city}
                </p>
              </div>
              <div>
                <p className="type-mono text-fg-soft">Suivi</p>
                {commande.trackingNumber ? (
                  <p className="type-body mt-2 text-fg">
                    {commande.carrier}
                    <br />
                    <span className="type-mono">{commande.trackingNumber}</span>
                  </p>
                ) : (
                  <p className="type-body mt-2 text-fg-soft">
                    Le numéro de suivi apparaîtra ici le jour de l&apos;expédition.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="montant" className="mt-14 border-t border-rule pt-8">
            <h2 id="montant" className="type-title-1">
              Montant
            </h2>
            <dl className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between gap-4">
                <dt className="type-body text-fg-soft">Montre</dt>
                <dd className="type-body text-fg" data-numeric>
                  {formatPrice(commande.subtotalCents)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="type-body text-fg-soft">Livraison</dt>
                <dd className="type-body text-fg" data-numeric>
                  {commande.shippingCents === 0 ? "Offerte" : formatPrice(commande.shippingCents)}
                </dd>
              </div>
              <div className="mt-2 flex justify-between gap-4 border-t border-rule pt-3">
                <dt className="type-title-2 text-fg">Total</dt>
                <dd className="type-title-2 text-fg" data-numeric>
                  {formatPrice(commande.totalCents)}
                </dd>
              </div>
            </dl>

            {commande.warranty && (
              <p className="type-caption mt-6 text-fg-soft">
                Garantie jusqu&apos;au {formatDate(commande.warranty.endsAt)}.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Mesure({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="bg-bg p-5">
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd className="type-title-2 mt-2 text-fg">{valeur}</dd>
    </div>
  );
}
