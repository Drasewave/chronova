"use client";

import { useActionState, useId } from "react";
import { enregistrerProfil } from "@/app/actions/compte";
import { Button } from "@/components/ui/button";
import { ETAT_INITIAL } from "@/lib/formulaires/etat";
import { cn } from "@/lib/utils";

export function FormulaireProfil({
  email,
  nom,
  telephone,
  poignet,
  preferences,
  newsletter,
}: {
  email: string;
  nom: string;
  telephone: string;
  poignet: number | null;
  preferences: string;
  newsletter: boolean;
}) {
  const [etat, action, enCours] = useActionState(enregistrerProfil, ETAT_INITIAL);
  const id = useId();

  return (
    <form action={action} className="flex flex-col gap-6">
      <div>
        <p className="type-ui text-fg">Adresse e-mail</p>
        <p className="type-body mt-1 text-fg-soft">{email}</p>
        <p className="type-caption mt-2 text-fg-soft">
          C&apos;est elle qui sert à se connecter. Pour la changer, écrivez à l&apos;atelier :
          la modifier seul permettrait de détourner un compte.
        </p>
      </div>

      <div>
        <label htmlFor={`${id}-nom`} className="type-ui block text-fg">
          Nom
        </label>
        <input
          id={`${id}-nom`}
          name="nom"
          defaultValue={nom}
          autoComplete="name"
          className="type-ui mt-2 h-11 w-full rounded-field border border-rule bg-bg px-4 text-fg"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-telephone`} className="type-ui block text-fg">
            Téléphone
          </label>
          <p className="type-caption mt-1 text-fg-soft">Utilisé par le transporteur.</p>
          <input
            id={`${id}-telephone`}
            name="telephone"
            type="tel"
            defaultValue={telephone}
            autoComplete="tel"
            className="type-ui mt-2 h-11 w-full rounded-field border border-rule bg-bg px-4 text-fg"
          />
        </div>

        <div>
          <label htmlFor={`${id}-poignet`} className="type-ui block text-fg">
            Tour de poignet
          </label>
          <p className="type-caption mt-1 text-fg-soft">En millimètres, mètre ruban à plat.</p>
          <input
            id={`${id}-poignet`}
            name="poignet"
            type="number"
            min={120}
            max={240}
            defaultValue={poignet ?? ""}
            aria-describedby={etat.erreurs?.["poignet"] ? `${id}-poignet-erreur` : undefined}
            className={cn(
              "type-ui mt-2 h-11 w-full rounded-field border bg-bg px-4 text-fg",
              etat.erreurs?.["poignet"] ? "border-alert" : "border-rule",
            )}
          />
          {etat.erreurs?.["poignet"] && (
            <p id={`${id}-poignet-erreur`} className="type-caption mt-2 text-alert">
              {etat.erreurs["poignet"]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-preferences`} className="type-ui block text-fg">
          Préférences
        </label>
        <p className="type-caption mt-1 text-fg-soft">
          Ce que vous aimez ou évitez. L&apos;horloger le lit avant de monter votre montre.
        </p>
        <textarea
          id={`${id}-preferences`}
          name="preferences"
          rows={3}
          defaultValue={preferences}
          className="type-body mt-2 w-full rounded-field border border-rule bg-bg p-4 text-fg"
        />
      </div>

      <label className="flex min-h-11 items-start gap-3 py-1">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={newsletter}
          className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          <span className="type-ui block text-fg">Recevoir la lettre de l&apos;atelier</span>
          <span className="type-caption block text-fg-soft">
            Quelques envois par an. Décocher ici suffit à se désinscrire.
          </span>
        </span>
      </label>

      {etat.statut === "succes" && (
        <p role="status" className="type-body text-positive">
          {etat.message}
        </p>
      )}
      {etat.statut === "erreur" && (
        <p role="alert" className="type-body text-alert">
          {etat.message}
        </p>
      )}

      <Button type="submit" disabled={enCours} className="self-start">
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
