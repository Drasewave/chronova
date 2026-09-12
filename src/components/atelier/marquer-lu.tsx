"use client";

import { useEffect, useRef } from "react";
import { marquerDemandeLue } from "@/app/actions/atelier-relation";

/**
 * Marque une demande comme lue à l'ouverture.
 *
 * Le geste appartient au client, pas au rendu : Next précharge les pages liées
 * dès qu'un lien entre dans le champ de vision, et marquer « lu » pendant le
 * rendu viderait la boîte de réception sans que personne n'ait rien ouvert.
 * Un effet ne s'exécute que dans un vrai onglet, à l'écran.
 */
export function MarquerLu({ id }: { id: string }) {
  const fait = useRef(false);

  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    void marquerDemandeLue(id);
  }, [id]);

  return null;
}
