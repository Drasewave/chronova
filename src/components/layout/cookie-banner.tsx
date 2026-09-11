"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const CLE = "chronova:consentement";

type Choix = "tout" | "necessaire";

/**
 * Bandeau de consentement.
 *
 * Refuser est exactement aussi simple qu'accepter : deux boutons de même taille,
 * de même graisse, côte à côte. Aucun script de mesure n'est chargé avant un
 * choix explicite — c'est ici qu'il faudra les brancher, jamais dans le layout.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CLE)) setVisible(true);
    } catch {
      // Stockage indisponible (navigation privée) : on n'insiste pas.
    }
  }, []);

  const decider = (choix: Choix) => {
    try {
      localStorage.setItem(CLE, JSON.stringify({ choix, date: new Date().toISOString() }));
    } catch {
      /* ignoré */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-panel shadow-sheet"
      style={{ padding: "var(--gutter)" }}
    >
      <div className="mx-auto flex max-w-content flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="type-body measure text-fg">
          Ce site dépose uniquement les cookies nécessaires à son fonctionnement (panier, session).
          La mesure d&apos;audience, si elle est activée un jour, ne le sera qu&apos;avec votre
          accord.{" "}
          <Link href="/cookies" className="link-underline text-accent">
            Détail des cookies
          </Link>
        </p>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button variant="contour" onClick={() => decider("necessaire")} className="sm:w-44">
            Tout refuser
          </Button>
          <Button variant="contour" onClick={() => decider("tout")} className="sm:w-44">
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
