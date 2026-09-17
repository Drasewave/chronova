"use client";

import { useActionState, useId } from "react";
import { ajouterAdresse } from "@/app/actions/compte";
import { Button } from "@/components/ui/button";
import { ETAT_INITIAL } from "@/lib/formulaires/etat";
import { cn } from "@/lib/utils";

export function FormulaireAdresse() {
  const [etat, action, enCours] = useActionState(ajouterAdresse, ETAT_INITIAL);
  const id = useId();

  return (
    <form action={action} className="flex flex-col gap-5">
      {etat.statut === "succes" && (
        <p role="status" className="type-body text-positive">
          {etat.message}
        </p>
      )}

      <Champ id={`${id}-label`} name="label" label="Nom de l'adresse" aide="Domicile, bureau…" />
      <Champ
        id={`${id}-nomComplet`}
        name="nomComplet"
        label="Destinataire"
        autoComplete="name"
        required
        erreur={etat.erreurs?.["nomComplet"]}
      />
      <Champ
        id={`${id}-ligne1`}
        name="ligne1"
        label="Numéro et rue"
        autoComplete="address-line1"
        required
        erreur={etat.erreurs?.["ligne1"]}
      />
      <Champ
        id={`${id}-ligne2`}
        name="ligne2"
        label="Complément"
        aide="Bâtiment, étage, code. Facultatif."
        autoComplete="address-line2"
      />

      <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Champ
          id={`${id}-codePostal`}
          name="codePostal"
          label="Code postal"
          autoComplete="postal-code"
          inputMode="numeric"
          required
          erreur={etat.erreurs?.["codePostal"]}
        />
        <Champ
          id={`${id}-ville`}
          name="ville"
          label="Ville"
          autoComplete="address-level2"
          required
          erreur={etat.erreurs?.["ville"]}
        />
      </div>

      <div>
        <label htmlFor={`${id}-pays`} className="type-ui block text-fg">
          Pays
        </label>
        <select
          id={`${id}-pays`}
          name="pays"
          defaultValue="FR"
          className="type-ui mt-2 h-11 w-full rounded-field border border-rule bg-bg px-3 text-fg"
        >
          <option value="FR">France</option>
          <option value="BE">Belgique</option>
          <option value="CH">Suisse</option>
          <option value="LU">Luxembourg</option>
          <option value="DE">Allemagne</option>
          <option value="ES">Espagne</option>
          <option value="IT">Italie</option>
        </select>
      </div>

      {etat.statut === "erreur" && (
        <p role="alert" className="type-body text-alert">
          {etat.message}
        </p>
      )}

      <Button type="submit" disabled={enCours} className="self-start">
        {enCours ? "Enregistrement…" : "Enregistrer l'adresse"}
      </Button>
    </form>
  );
}

function Champ({
  id,
  label,
  aide,
  erreur,
  ...props
}: React.ComponentProps<"input"> & { id: string; label: string; aide?: string; erreur?: string }) {
  return (
    <div>
      <label htmlFor={id} className="type-ui block text-fg">
        {label}
      </label>
      {aide && <p className="type-caption mt-1 text-fg-soft">{aide}</p>}
      <input
        id={id}
        aria-describedby={erreur ? `${id}-erreur` : undefined}
        className={cn(
          "type-ui mt-2 h-11 w-full rounded-field border bg-bg px-4 text-fg",
          erreur ? "border-alert" : "border-rule",
        )}
        {...props}
      />
      {erreur && (
        <p id={`${id}-erreur`} className="type-caption mt-2 text-alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
