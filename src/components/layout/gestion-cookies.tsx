"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CLE = "chronova:consentement";

/** Permet d'effacer le choix enregistré, pour que le bandeau réapparaisse. */
export function GestionCookies() {
  const [choix, setChoix] = useState<string | null>(null);
  const [efface, setEfface] = useState(false);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) setChoix((JSON.parse(brut) as { choix?: string }).choix ?? "inconnu");
    } catch {
      /* stockage indisponible */
    }
  }, []);

  return (
    <div className="not-prose my-8 rounded-card border border-rule bg-panel p-6">
      <p className="type-ui text-fg">
        {efface
          ? "Choix effacé. Le bandeau réapparaîtra au prochain chargement de page."
          : choix === null
            ? "Aucun choix n'est enregistré dans ce navigateur."
            : choix === "tout"
              ? "Choix enregistré : tout accepté."
              : "Choix enregistré : cookies nécessaires uniquement."}
      </p>
      <Button
        variant="contour"
        className="mt-4"
        disabled={choix === null || efface}
        onClick={() => {
          try {
            localStorage.removeItem(CLE);
          } catch {
            /* ignoré */
          }
          setEfface(true);
        }}
      >
        Effacer mon choix
      </Button>
    </div>
  );
}
