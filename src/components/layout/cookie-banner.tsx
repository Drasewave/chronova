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
      // Une barre basse et courte : sur un écran d'ordinateur portable, trois
      // lignes de texte recouvraient le bouton principal de la page d'accueil.
      // Le détail complet vit sur sa page, à un lien d'ici.
      style={{ paddingInline: "var(--gutter)", paddingBlock: "0.875rem" }}
    >
      <div className="mx-auto flex max-w-content flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="type-caption measure text-fg">
          Uniquement les cookies nécessaires au fonctionnement du site : panier et session.{" "}
          <Link href="/cookies" className="link-underline text-accent">
            Détail des cookies
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button variant="contour" onClick={() => decider("necessaire")} className="flex-1 sm:w-40 sm:flex-none">
            Tout refuser
          </Button>
          <Button variant="contour" onClick={() => decider("tout")} className="flex-1 sm:w-40 sm:flex-none">
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
