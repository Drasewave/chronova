import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import type { WatchRender } from "@/watch/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mes commandes",
  robots: { index: false, follow: false },
};

export default async function Commandes() {
  const session = await auth();
  const commandes = await prisma.order.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { configuration: true } } },
  });

  if (commandes.length === 0) {
    return (
      <div>
        <h1 className="type-display-2">Mes commandes</h1>
        <p className="type-body measure mt-6 text-fg-soft">
          Vous n&apos;avez pas encore commandé. Rien n&apos;est monté à l&apos;avance : votre montre
          commencera à exister le jour où vous la composerez.
        </p>
        <ButtonLink href="/composer" className="mt-8">
          Composer ma montre
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <h1 className="type-display-2">Mes commandes</h1>

      <ul className="mt-10 flex flex-col gap-px bg-rule">
        {commandes.map((commande) => {
          const ligne = commande.items[0];
          const render = (ligne?.configuration.snapshot as { render?: WatchRender } | null)?.render;

          return (
            <li key={commande.id} className="bg-bg py-7">
              <div className="grid gap-6 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
                <div className="rounded-card bg-bg-alt p-2">
                  {render && (
                    <WatchSvg
                      id={`liste-${commande.id}`}
                      render={render}
                      detail="compact"
                      label={`Montre de la commande ${commande.number}`}
                      className="h-auto w-full"
                    />
                  )}
                </div>

                <div>
                  <p className="type-mono text-fg-soft">
                    {commande.number} · {formatDate(commande.createdAt)}
                  </p>
                  <h2 className="type-title-2 mt-2">
                    <Link href={`/compte/commandes/${commande.number}`} className="link-underline">
                      {(ligne?.snapshot as { modele?: string } | null)?.modele ?? "Montre Chronova"}
                    </Link>
                  </h2>
                  <p className="mt-3">
                    <Pill ton={commande.status === "LIVREE" ? "positif" : "accent"}>
                      {libelleStatut(commande.status)}
                    </Pill>
                  </p>
                  {commande.trackingNumber && (
                    <p className="type-mono mt-3 text-fg-soft">
                      {commande.carrier} · {commande.trackingNumber}
                    </p>
                  )}
                </div>

                <p className="type-title-2 text-fg sm:text-right" data-numeric>
                  {formatPrice(commande.totalCents)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
