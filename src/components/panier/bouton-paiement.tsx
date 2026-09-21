"use client";

import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import { estimerFraisDePort, partirAuPaiement } from "@/app/actions/paiement";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/panier/cart";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Départ vers le paiement.
 *
 * N'envoie que des références de configuration : c'est le serveur qui refait le
 * chiffrage. Le panier n'est pas vidé ici — il ne le sera qu'une fois le
 * paiement confirmé, pour qu'un abandon en cours de route ne fasse rien perdre.
 *
 * Ce bloc porte aussi les trois informations dues AVANT tout engagement : le
 * prix total livraison comprise, le sort du droit de rétractation, et
 * l'acceptation des conditions de vente par une case jamais pré-cochée. Il est
 * partagé par le tiroir et la page panier : la règle vit donc à un seul endroit
 * (et elle est revérifiée par le serveur).
 */
export function BoutonPaiement({ className }: { className?: string }) {
  const { items, totalCents } = useCart();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [cgv, setCgv] = useState(false);
  const [port, setPort] = useState<number | null>(null);
  const id = useId();

  const gravure = items.some((item) =>
    item.snapshot.summary.some((ligne) => ligne.groupKey === "gravure"),
  );

  useEffect(() => {
    if (items.length === 0) return;
    let actif = true;
    estimerFraisDePort(totalCents)
      .then((montant) => actif && setPort(montant))
      .catch(() => actif && setPort(null));
    return () => {
      actif = false;
    };
  }, [items.length, totalCents]);

  return (
    <div className={className}>
      {port !== null && (
        <dl className="type-caption mb-4 flex flex-col gap-1.5 text-fg">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-soft">Livraison suivie et assurée</dt>
            <dd data-numeric>{port === 0 ? "Offerte" : formatPrice(port)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Total à payer, livraison comprise</dt>
            <dd data-numeric>{formatPrice(totalCents + port)}</dd>
          </div>
        </dl>
      )}

      <p className="type-caption mb-4 text-fg-soft">
        {gravure
          ? "Une montre avec gravure personnalisée est réalisée spécialement pour vous : elle ne peut être ni reprise ni remboursée au titre du droit de rétractation (article L221-28 3° du Code de la consommation). Les autres montres bénéficient de 14 jours de rétractation après réception. Les garanties légales s'appliquent dans tous les cas."
          : "Vous disposez de 14 jours après réception pour changer d'avis et retourner la montre. Les garanties légales s'appliquent dans tous les cas."}
      </p>

      <div className="mb-4 flex items-start gap-3">
        <input
          id={`${id}-cgv`}
          type="checkbox"
          checked={cgv}
          onChange={(event) => {
            setCgv(event.target.checked);
            setErreur(null);
          }}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
        />
        <label htmlFor={`${id}-cgv`} className="type-caption text-fg">
          J&apos;ai lu et j&apos;accepte les{" "}
          <Link href="/cgv" target="_blank" className="link-underline text-accent">
            conditions générales de vente
            <span className="sr-only"> (nouvel onglet)</span>
          </Link>{" "}
          <span className="text-fg-soft">(obligatoire)</span>
        </label>
      </div>

      <Button
        className="w-full"
        disabled={enCours || items.length === 0}
        onClick={() => {
          if (!cgv) {
            setErreur("Cochez la case d'acceptation des conditions générales de vente pour continuer.");
            return;
          }
          setErreur(null);
          demarrer(async () => {
            const resultat = await partirAuPaiement(
              items.map((item) => ({
                modelSlug: item.modelSlug,
                shareParam: item.shareParam,
                quantity: item.quantity,
              })),
              cgv,
            );
            if (resultat && "erreur" in resultat) setErreur(resultat.erreur);
          });
        }}
      >
        {enCours ? "Redirection…" : "Passer au paiement"}
      </Button>

      {erreur && (
        <p id={`${id}-erreur`} role="alert" className={cn("type-caption mt-3 text-alert")}>
          {erreur}
        </p>
      )}
    </div>
  );
}
