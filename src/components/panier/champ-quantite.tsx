"use client";

import { useState } from "react";
import { QUANTITE_MAX, QUANTITE_MIN, lireQuantite } from "@/lib/panier/quantite";

/**
 * Champ Quantité du panier et du tiroir.
 *
 * Pendant la frappe, le champ est libre : on peut l'effacer pour retaper un
 * chiffre. Une saisie vide, nulle ou invalide ne touche PAS au panier (avant,
 * `Number("")` valait 0 et la ligne disparaissait sans confirmation — audit
 * A-02). Au `blur`, le champ reprend la dernière quantité valide. Retirer une
 * montre passe uniquement par le bouton « Retirer ».
 */
export function ChampQuantite({
  quantite,
  onChange,
  className,
}: {
  quantite: number;
  onChange: (quantite: number) => void;
  className?: string;
}) {
  /** `null` : le champ reflète le panier. Une chaîne : saisie en cours. */
  const [brouillon, setBrouillon] = useState<string | null>(null);

  return (
    <input
      type="number"
      inputMode="numeric"
      min={QUANTITE_MIN}
      max={QUANTITE_MAX}
      step={1}
      value={brouillon ?? String(quantite)}
      onChange={(event) => {
        const saisie = event.target.value;
        const valide = lireQuantite(saisie);
        if (valide === undefined) {
          setBrouillon(saisie);
          return;
        }
        setBrouillon(null);
        onChange(valide);
      }}
      onBlur={() => setBrouillon(null)}
      className={className}
    />
  );
}
