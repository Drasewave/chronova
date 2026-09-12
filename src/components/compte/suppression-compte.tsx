"use client";

import { useState } from "react";
import { anonymiserCompte } from "@/app/actions/compte";
import { Button } from "@/components/ui/button";

/**
 * Effacement du compte.
 *
 * La confirmation est explicite parce que l'action est irréversible, et le texte
 * dit exactement ce qui disparaît et ce qui reste — annoncer une suppression
 * totale alors que les factures sont conservées dix ans serait faux.
 */
export function SuppressionCompte() {
  const [confirme, setConfirme] = useState(false);

  return (
    <div>
      <h3 className="type-title-2">Effacer mes données</h3>
      <p className="type-body measure mt-2 text-fg-soft">
        Votre nom, vos adresses, votre téléphone et vos préférences sont effacés, et le compte ne
        permet plus de se connecter. Vos factures sont conservées sans nom, parce que la loi impose
        de garder dix ans les pièces comptables.
      </p>

      {confirme ? (
        <div className="mt-5 rounded-card border border-alert p-5">
          <p className="type-ui text-fg">Confirmer l&apos;effacement ?</p>
          <p className="type-caption mt-2 text-fg-soft">
            Cette action est définitive. Vous serez déconnecté·e immédiatement.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <form action={anonymiserCompte}>
              <Button type="submit">Oui, effacer mes données</Button>
            </form>
            <Button variant="contour" onClick={() => setConfirme(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="contour" className="mt-4" onClick={() => setConfirme(true)}>
          Effacer mes données
        </Button>
      )}
    </div>
  );
}
