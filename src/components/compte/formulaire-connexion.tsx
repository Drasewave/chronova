"use client";

import { useActionState, useId } from "react";
import { demanderLien } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ETAT_INITIAL } from "@/lib/formulaires/etat";
import { cn } from "@/lib/utils";

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(demanderLien, ETAT_INITIAL);
  const id = useId();

  if (etat.statut === "succes") {
    return (
      <div role="status">
        <p className="type-title-2 text-fg">Lien envoyé</p>
        <p className="type-body mt-3 text-fg-soft">{etat.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="suite" value={suite} />

      <div>
        <label htmlFor={`${id}-email`} className="type-ui block text-fg">
          Adresse e-mail
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          aria-describedby={etat.erreurs?.["email"] ? `${id}-email-erreur` : undefined}
          className={cn(
            "type-ui mt-2 h-11 w-full rounded-field border bg-bg px-4 text-fg",
            etat.erreurs?.["email"] ? "border-alert" : "border-rule",
          )}
        />
        {etat.erreurs?.["email"] && (
          <p id={`${id}-email-erreur`} className="type-caption mt-2 text-alert">
            {etat.erreurs["email"]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </Button>
    </form>
  );
}
