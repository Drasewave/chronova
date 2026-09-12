"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { SamplePill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { useCart } from "@/lib/panier/cart";
import { WatchSvg } from "@/watch/watch-svg";
import { formatPrice } from "@/lib/utils";

export function PanierComplet() {
  const { items, ready, totalCents, remove, setQuantity } = useCart();

  if (!ready) {
    return (
      <Section fond="papier">
        <p className="type-body text-fg-soft">Chargement du panier…</p>
      </Section>
    );
  }

  if (items.length === 0) {
    return (
      <Section fond="papier">
        <h1 className="type-display-2">Votre panier est vide</h1>
        <p className="type-lead measure mt-5 text-fg-soft">
          Chaque montre étant montée à la demande, rien n&apos;est réservé tant que vous n&apos;avez
          pas composé la vôtre.
        </p>
        <ButtonLink href="/composer" className="mt-9">
          Composer ma montre
        </ButtonLink>
      </Section>
    );
  }

  return (
    <Section fond="papier">
      <h1 className="type-display-2">Votre panier</h1>

      <ul className="mt-12 border-t border-rule">
        {items.map((ligne) => (
          <li key={ligne.id} className="grid gap-6 border-b border-rule py-8 sm:grid-cols-[10rem_1fr_auto]">
            <Link
              href={`/composer/${ligne.modelSlug}?c=${encodeURIComponent(ligne.shareParam)}`}
              className="rounded-card bg-bg-alt p-2"
            >
              <WatchSvg
                id={`panier-page-${ligne.id}`}
                render={ligne.snapshot.render}
                detail="compact"
                label={`${ligne.snapshot.modelName}, configuration personnalisée`}
                className="h-auto w-full"
              />
            </Link>

            <div>
              <h2 className="type-title-2">{ligne.snapshot.modelName}</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                {ligne.snapshot.summary.map((entree) => (
                  <div key={entree.groupKey} className="flex justify-between gap-4 sm:justify-start">
                    <dt className="type-caption text-fg-soft">{entree.groupLabel}</dt>
                    <dd className="type-caption text-fg">{entree.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="type-mono mt-4 text-fg-soft">
                Assemblage estimé {ligne.snapshot.leadTimeDays} jours
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2">
                  <span className="type-caption text-fg-soft">Quantité</span>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={ligne.quantity}
                    onChange={(event) => setQuantity(ligne.id, Number(event.target.value))}
                    className="type-ui h-10 w-16 rounded-field border border-rule bg-panel px-2 text-center text-fg"
                  />
                </label>
                <Link
                  href={`/composer/${ligne.modelSlug}?c=${encodeURIComponent(ligne.shareParam)}`}
                  className="type-caption link-underline text-fg-soft hover:text-accent"
                >
                  Modifier la configuration
                </Link>
                <button
                  type="button"
                  onClick={() => remove(ligne.id)}
                  className="type-caption link-underline text-fg-soft hover:text-alert"
                >
                  Retirer
                </button>
              </div>
            </div>

            <p className="type-title-2 text-fg sm:text-right" data-numeric>
              {formatPrice(ligne.snapshot.priceCents * ligne.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col items-end gap-3">
        <p className="flex items-baseline gap-6">
          <span className="type-ui text-fg-soft">Total</span>
          <span className="type-display-2 text-fg" data-numeric>
            {formatPrice(totalCents)}
          </span>
        </p>
        <p className="flex items-center gap-3">
          <SamplePill />
          <span className="type-caption text-fg-soft">
            Tarifs de démonstration, modifiables depuis l&apos;atelier.
          </span>
        </p>
        <p className="type-caption mt-4 max-w-[46ch] text-right text-fg-soft">
          Le paiement Stripe et le suivi de commande arrivent à l&apos;étape suivante du projet.
          Les frais de port seront ajoutés à cette étape.
        </p>
      </div>
    </Section>
  );
}
