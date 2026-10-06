"use client";

import { useActionState, useId } from "react";
import { changerMotDePasse } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ETAT_INITIAL } from "@/lib/formulaires/etat";
import { MOT_DE_PASSE_MIN } from "@/lib/securite/regles-mot-de-passe";
import { cn } from "@/lib/utils";

/** Changer son mot de passe ; `aUnMotDePasse` faux : un compte qui n'en a pas encore le choisit. */
export function FormulaireMotDePasse({ aUnMotDePasse }: { aUnMotDePasse: boolean }) {
  const [etat, action, enCours] = useActionState(changerMotDePasse, ETAT_INITIAL);
  const id = useId();
  const champs = [
    ...(aUnMotDePasse ? [{ nom: "actuel", libelle: "Mot de passe actuel", auto: "current-password" }] : []),
    { nom: "mot_de_passe", libelle: "Nouveau mot de passe", auto: "new-password", aide: `Au moins ${MOT_DE_PASSE_MIN} caractères.` },
    { nom: "confirmation", libelle: "Confirmez le nouveau mot de passe", auto: "new-password" },
  ];
  return (
    <form action={action} className="flex flex-col gap-5">
      {champs.map((c) => {
        const erreur = etat.erreurs?.[c.nom];
        return (
          <div key={c.nom}>
            <label htmlFor={`${id}-${c.nom}`} className="type-ui block text-fg">
              {c.libelle}
            </label>
            <input
              id={`${id}-${c.nom}`}
              name={c.nom}
              type="password"
              required
              autoComplete={c.auto}
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? `${id}-${c.nom}-erreur` : c.aide ? `${id}-${c.nom}-aide` : undefined}
              className={cn(
                "champ mt-2 h-11 w-full rounded-field border bg-bg px-4 text-fg",
                erreur ? "border-alert" : "border-field",
              )}
            />
            {c.aide && !erreur && (
              <p id={`${id}-${c.nom}-aide`} className="type-caption mt-2 text-fg-soft">
                {c.aide}
              </p>
            )}
            {erreur && (
              <p id={`${id}-${c.nom}-erreur`} className="type-caption mt-2 text-alert">
                {erreur}
              </p>
            )}
          </div>
        );
      })}
      <Button type="submit" disabled={enCours}>
        {enCours ? "Enregistrement…" : aUnMotDePasse ? "Changer le mot de passe" : "Choisir un mot de passe"}
      </Button>
    </form>
  );
}
