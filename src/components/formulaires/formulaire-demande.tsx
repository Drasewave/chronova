"use client";

import { useActionState, useId } from "react";
import { envoyerDemande } from "@/app/actions/demandes";
import { ETAT_INITIAL } from "@/lib/formulaires/etat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Formulaire de contact et de demande sur-mesure.
 *
 * Un seul composant pour les deux : seul `type` change, ainsi que l'affichage du
 * budget et de la configuration de référence. Les erreurs sont rattachées à leur
 * champ par `aria-describedby` et l'envoi est annoncé en région `aria-live`.
 */
export function FormulaireDemande({
  type,
  sujets,
  avecBudget = false,
  configurationInitiale,
}: {
  type: "CONTACT" | "SUR_MESURE";
  sujets?: string[];
  avecBudget?: boolean;
  configurationInitiale?: string;
}) {
  const [etat, action, enCours] = useActionState(envoyerDemande, ETAT_INITIAL);
  const id = useId();

  if (etat.statut === "succes") {
    return (
      <div
        role="status"
        className="rounded-card border border-positive bg-panel p-8"
      >
        <p className="type-title-2 text-fg">Message envoyé</p>
        <p className="type-body measure mt-3 text-fg-soft">{etat.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="type" value={type} />

      {/* Leurre anti-robot : jamais affiché, jamais lu par un lecteur d'écran. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-entreprise`}>Entreprise</label>
        <input id={`${id}-entreprise`} type="text" name="entreprise" tabIndex={-1} autoComplete="off" />
      </div>

      {sujets && (
        <Champ label="Sujet" htmlFor={`${id}-sujet`}>
          <select
            id={`${id}-sujet`}
            name="sujet"
            className="type-ui h-11 w-full rounded-field border border-rule bg-panel px-3 text-fg"
          >
            {sujets.map((sujet) => (
              <option key={sujet} value={sujet}>
                {sujet}
              </option>
            ))}
          </select>
        </Champ>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Champ label="Nom" htmlFor={`${id}-nom`} erreur={etat.erreurs?.["nom"]}>
          <Entree id={`${id}-nom`} name="nom" autoComplete="name" required erreur={etat.erreurs?.["nom"]} />
        </Champ>
        <Champ label="Adresse e-mail" htmlFor={`${id}-email`} erreur={etat.erreurs?.["email"]}>
          <Entree
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            erreur={etat.erreurs?.["email"]}
          />
        </Champ>
      </div>

      <div className={cn("grid gap-6", avecBudget && "sm:grid-cols-2")}>
        <Champ label="Téléphone" htmlFor={`${id}-telephone`} aide="Facultatif.">
          <Entree id={`${id}-telephone`} name="telephone" type="tel" autoComplete="tel" />
        </Champ>
        {avecBudget && (
          <Champ
            label="Budget envisagé"
            htmlFor={`${id}-budget`}
            aide="En euros, facultatif. Cela évite de vous proposer l'impossible."
          >
            <Entree id={`${id}-budget`} name="budget" inputMode="numeric" />
          </Champ>
        )}
      </div>

      {configurationInitiale !== undefined && (
        <Champ
          label="Configuration de référence"
          htmlFor={`${id}-configuration`}
          aide="Collez ici le lien d'une configuration si vous en avez une en tête."
        >
          <Entree id={`${id}-configuration`} name="configuration" defaultValue={configurationInitiale} />
        </Champ>
      )}

      <Champ
        label="Votre message"
        htmlFor={`${id}-message`}
        erreur={etat.erreurs?.["message"]}
        aide={
          type === "SUR_MESURE"
            ? "Décrivez la montre que vous avez en tête : usage, style, contraintes, pièces particulières."
            : "Quelques phrases suffisent."
        }
      >
        <textarea
          id={`${id}-message`}
          name="message"
          rows={7}
          required
          minLength={20}
          maxLength={4000}
          aria-describedby={etat.erreurs?.["message"] ? `${id}-message-erreur` : undefined}
          className={cn(
            "type-body w-full rounded-field border bg-panel p-4 text-fg placeholder:text-fg-soft",
            etat.erreurs?.["message"] ? "border-alert" : "border-rule",
          )}
        />
      </Champ>

      {etat.statut === "erreur" && (
        <p role="alert" className="type-body text-alert">
          {etat.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <Button type="submit" disabled={enCours}>
          {enCours ? "Envoi…" : "Envoyer"}
        </Button>
        <p className="type-caption measure text-fg-soft">
          Vos coordonnées servent uniquement à vous répondre. Elles ne sont ni revendues, ni
          utilisées pour de la publicité, et vous pouvez demander leur suppression à tout moment.
        </p>
      </div>
    </form>
  );
}

function Champ({
  label,
  htmlFor,
  aide,
  erreur,
  children,
}: {
  label: string;
  htmlFor: string;
  aide?: string;
  erreur?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="type-ui block text-fg">
        {label}
      </label>
      {aide && <p className="type-caption mt-1 text-fg-soft">{aide}</p>}
      <div className="mt-2">{children}</div>
      {erreur && (
        <p id={`${htmlFor}-erreur`} className="type-caption mt-2 text-alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

function Entree({
  erreur,
  className,
  id,
  ...props
}: React.ComponentProps<"input"> & { erreur?: string }) {
  return (
    <input
      id={id}
      aria-describedby={erreur ? `${id}-erreur` : undefined}
      className={cn(
        "type-ui h-11 w-full rounded-field border bg-panel px-4 text-fg placeholder:text-fg-soft",
        erreur ? "border-alert" : "border-rule",
        className,
      )}
      {...props}
    />
  );
}
