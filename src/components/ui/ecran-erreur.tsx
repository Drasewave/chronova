"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

/**
 * Contenu des pages d'erreur (error.tsx, global-error.tsx).
 *
 * Le `digest` est l'identifiant que Next écrit aussi dans le journal du
 * serveur : c'est ce qui permet de retrouver la cause à partir d'une capture.
 */
export function EcranErreur({
  error,
  retry,
  titre = "Un incident est survenu.",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  titre?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section>
      <div role="alert" className="flex flex-col items-start">
        <p className="type-mono text-fg-soft">Erreur</p>
        <h1 className="type-display-2 mt-4 max-w-[18ch]">{titre}</h1>
        <p className="type-lead measure mt-6 text-fg-soft">
          La page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant ; si le problème
          persiste, indiquez-nous le code ci-dessous.
        </p>
        {error.digest && <p className="type-mono mt-4 text-fg-soft">Code : {error.digest}</p>}
        <Button className="mt-10" onClick={() => retry()}>
          Réessayer
        </Button>
      </div>
    </Section>
  );
}
