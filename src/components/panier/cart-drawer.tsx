"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ButtonLink } from "@/components/ui/button";
import { IconCroix } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { useCart } from "@/lib/panier/cart";
import { WatchSvg } from "@/watch/watch-svg";
import { formatPrice } from "@/lib/utils";

/**
 * Panier en panneau latéral. Chaque ligne montre la miniature de SA
 * configuration — pas une photo de catalogue : c'est la montre qui sera montée.
 */
export function CartDrawer() {
  const { lines, isOpen, close, remove, setQuantity, totalCents, count } = useCart();
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const noeud = dialogue.current;
    if (!noeud) return;
    if (isOpen && !noeud.open) noeud.showModal();
    if (!isOpen && noeud.open) noeud.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogue}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogue.current) close();
      }}
      aria-label="Panier"
      className="ml-auto mr-0 h-dvh max-h-dvh w-[min(100vw,29rem)] border-l border-rule bg-bg p-0 text-fg shadow-lift backdrop:bg-[color-mix(in_srgb,var(--color-ink)_52%,transparent)]"
    >
      <div className="flex h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-rule px-6 py-5">
          <h2 className="type-title-2">
            Panier
            {count > 0 && <span className="type-mono ml-3 text-fg-soft">{count}</span>}
          </h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex size-11 items-center justify-center text-fg-soft hover:text-accent"
            aria-label="Fermer le panier"
          >
            <IconCroix />
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-5 px-6">
            <p className="type-body text-fg-soft">
              Votre panier est vide. Une montre se compose en quelques minutes.
            </p>
            <ButtonLink href="/composer" onClick={close}>
              Composer ma montre
            </ButtonLink>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6">
              {lines.map((ligne) => (
                <li key={ligne.id} className="flex gap-4 border-b border-rule py-5">
                  <Link
                    href={`/composer/${ligne.modelSlug}?c=${encodeURIComponent(ligne.shareParam)}`}
                    onClick={close}
                    className="w-24 shrink-0 rounded-card bg-bg-alt p-1"
                  >
                    <WatchSvg
                      id={`panier-${ligne.id}`}
                      render={ligne.configuration.render}
                      detail="compact"
                      label={`${ligne.model.name}, configuration personnalisée`}
                      className="h-auto w-full"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="type-ui text-fg">{ligne.model.name}</p>
                    <p className="type-caption mt-1 text-fg-soft">
                      {resumeCourt(ligne.configuration.summary)}
                    </p>
                    <p className="type-mono mt-2 text-fg-soft">
                      Assemblage {ligne.configuration.leadTime.days} jours
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2">
                        <span className="type-caption text-fg-soft">Quantité</span>
                        <input
                          type="number"
                          min={1}
                          max={9}
                          value={ligne.quantity}
                          onChange={(event) => setQuantity(ligne.id, Number(event.target.value))}
                          className="type-ui h-9 w-14 rounded-field border border-rule bg-panel px-2 text-center text-fg"
                        />
                      </label>
                      <span className="type-ui text-fg" data-numeric>
                        {formatPrice(ligne.configuration.price.totalCents * ligne.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(ligne.id)}
                      className="type-caption link-underline mt-3 text-fg-soft hover:text-alert"
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-rule px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="type-ui text-fg">Total</span>
                <span className="type-title-2 text-fg" data-numeric>
                  {formatPrice(totalCents)}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-3">
                <SamplePill />
                <span className="type-caption text-fg-soft">Tarifs de démonstration.</span>
              </p>
              <ButtonLink href="/panier" onClick={close} className="mt-5 w-full">
                Voir le panier
              </ButtonLink>
              <p className="type-caption mt-3 text-center text-fg-soft">
                Le paiement arrive à l&apos;étape suivante du projet.
              </p>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}

/** Trois choix suffisent à reconnaître une configuration dans une liste. */
function resumeCourt(summary: { groupKey: string; value: string }[]): string {
  const cles = ["cadran-teinte", "aiguilles-forme", "bracelet-type"];
  return cles
    .map((cle) => summary.find((ligne) => ligne.groupKey === cle)?.value)
    .filter(Boolean)
    .join(" · ");
}
