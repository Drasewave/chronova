"use client";

import { useCart } from "@/lib/panier/cart";

/** Avis « retirée · Annuler » : la suppression reste annulable quelques secondes. */
export function AvisRetrait({ className }: { className?: string }) {
  const { retire, annulerRetrait } = useCart();
  return (
    <div role="status" aria-live="polite" className={className}>
      {retire && (
        <p className="type-caption flex items-center justify-between gap-4 rounded-field border border-rule bg-panel px-4 py-3 text-fg">
          <span>{retire.item.snapshot.modelName} retirée</span>
          <button type="button" onClick={annulerRetrait} className="link-underline text-accent-ink">
            Annuler
          </button>
        </p>
      )}
    </div>
  );
}
