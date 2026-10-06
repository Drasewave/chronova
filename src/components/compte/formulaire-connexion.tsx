"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { creerCompte, seConnecter } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ETAT_INITIAL, type EtatFormulaire } from "@/lib/formulaires/etat";
import { MOT_DE_PASSE_MIN } from "@/lib/securite/regles-mot-de-passe";
import { cn } from "@/lib/utils";

/** Champ texte avec son libellé, son aide et son erreur rattachés (`aria-describedby`). */
function Champ({
  id,
  nom,
  libelle,
  etat,
  aide,
  ...attributs
}: {
  id: string;
  nom: string;
  libelle: string;
  etat: EtatFormulaire;
  aide?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const erreur = etat.erreurs?.[nom];
  const decrit = [erreur && `${id}-${nom}-erreur`, aide && `${id}-${nom}-aide`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={`${id}-${nom}`} className="type-ui block text-fg">
        {libelle}
      </label>
      <input
        id={`${id}-${nom}`}
        name={nom}
        required
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit}
        className={cn(
          "champ mt-2 h-11 w-full rounded-field border bg-bg px-4 text-fg",
          erreur ? "border-alert" : "border-field",
        )}
        {...attributs}
      />
      {aide && !erreur && (
        <p id={`${id}-${nom}-aide`} className="type-caption mt-2 text-fg-soft">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-${nom}-erreur`} className="type-caption mt-2 text-alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(seConnecter, ETAT_INITIAL);
  const id = useId();
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="suite" value={suite} />
      <Champ id={id} nom="email" libelle="Adresse e-mail" etat={etat} type="email" autoComplete="email" spellCheck={false} />
      <Champ id={id} nom="mot_de_passe" libelle="Mot de passe" etat={etat} type="password" autoComplete="current-password" />
      <Button type="submit" disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}

export function FormulaireInscription({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(creerCompte, ETAT_INITIAL);
  const id = useId();
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="suite" value={suite} />
      <Champ id={id} nom="email" libelle="Adresse e-mail" etat={etat} type="email" autoComplete="email" />
      <Champ
        id={id}
        nom="mot_de_passe"
        libelle="Mot de passe"
        etat={etat}
        type="password"
        autoComplete="new-password"
        minLength={MOT_DE_PASSE_MIN}
        aide={`Au moins ${MOT_DE_PASSE_MIN} caractères.`}
      />
      <Champ id={id} nom="confirmation" libelle="Confirmez le mot de passe" etat={etat} type="password" autoComplete="new-password" />

      <div>
        <div className="flex items-start gap-3">
          <input
            id={`${id}-cgu`}
            name="cgu"
            type="checkbox"
            required
            aria-describedby={etat.erreurs?.["cgu"] ? `${id}-cgu-erreur` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
          />
          <label htmlFor={`${id}-cgu`} className="type-caption text-fg">
            J&apos;ai lu et j&apos;accepte les{" "}
            <Link href="/cgu" target="_blank" className="link-underline text-accent-ink">
              conditions générales d&apos;utilisation
              <span className="sr-only"> (nouvel onglet)</span>
            </Link>{" "}
            <span className="text-fg-soft">(obligatoire)</span>
          </label>
        </div>
        {etat.erreurs?.["cgu"] && (
          <p id={`${id}-cgu-erreur`} className="type-caption mt-2 text-alert">
            {etat.erreurs["cgu"]}
          </p>
        )}
      </div>

      <Button type="submit" disabled={enCours}>
        {enCours ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
