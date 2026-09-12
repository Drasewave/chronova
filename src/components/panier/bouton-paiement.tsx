"use client";

import { useState, useTransition } from "react";
import { partirAuPaiement } from "@/app/actions/paiement";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/panier/cart";
import { cn } from "@/lib/utils";

/**
 * Départ vers le paiement.
 *
 * N'envoie que des références de configuration : c'est le serveur qui refait le
 * chiffrage. Le panier n'est pas vidé ici — il ne le sera qu'une fois le
 * paiement confirmé, pour qu'un abandon en cours de route ne fasse rien perdre.
 */
export function BoutonPaiement({ className }: { className?: string }) {
  const { items } = useCart();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className={className}>
      <Button
        className="w-full"
        disabled={enCours || items.length === 0}
        onClick={() => {
          setErreur(null);
          demarrer(async () => {
            const resultat = await partirAuPaiement(
              items.map((item) => ({
                modelSlug: item.modelSlug,
                shareParam: item.shareParam,
                quantity: item.quantity,
              })),
            );
            if (resultat && "erreur" in resultat) setErreur(resultat.erreur);
          });
        }}
      >
        {enCours ? "Redirection…" : "Passer au paiement"}
      </Button>

      {erreur && (
        <p role="alert" className={cn("type-caption mt-3 text-alert")}>
          {erreur}
        </p>
      )}
    </div>
  );
}
