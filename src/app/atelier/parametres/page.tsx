import { enregistrerGabarit, enregistrerParametres } from "@/app/actions/atelier-parametres";
import { Bouton, CASE, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { CLE_IDENTITE, IDENTITE_VIDE } from "@/lib/content/legal";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";
import { BLOC, CODE, TitrePage } from "@/components/atelier/gabarit";
import { cn } from "@/lib/utils";

export const metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

/** Libellés des clés d'un réglage composé, dans l'ordre où on les remplit. */
const LIBELLE_CLE: Record<string, string> = {
  cents: "Montant (€)",
  mois: "Durée (mois)",
  raisonSociale: "Nom et prénom de l'entrepreneur (ou dénomination)",
  siret: "SIRET",
  immatriculation: "Immatriculation (RNE ou RCS, et ville)",
  tva: "Numéro de TVA intracommunautaire (vide si franchise en base)",
  adresse: "Adresse de l'établissement",
  email: "E-mail de contact publié",
  telephone: "Téléphone publié",
  directeurPublication: "Directeur de la publication",
  mediateurNom: "Médiateur de la consommation (après adhésion)",
  mediateurAdresse: "Adresse postale du médiateur",
  mediateurSite: "Site du médiateur",
  identifiantRep: "Identifiant unique REP (ADEME)",
};

/** Une clé monétaire est stockée en centimes ; les autres nombres, tels quels. */
function estMontant(cle: string) {
  return cle === "cents" || cle.endsWith("Cents");
}

/** Les variables qu'un gabarit d'e-mail sait remplacer. */
const VARIABLES = ["{{prenom}}", "{{modele}}", "{{numero}}", "{{lien_suivi}}", "{{suivi}}", "{{ecart}}"];

/**
 * Réglages de l'atelier.
 *
 * Un réglage marqué « à remplir » attend une vraie valeur : tant qu'il l'est,
 * le site public affiche la mention plutôt qu'un chiffre inventé. Le drapeau
 * disparaît de lui-même à la première saisie.
 */
export default async function Parametres() {
  const [reglages, gabarits] = await Promise.all([
    prisma.setting.findMany({ orderBy: { key: "asc" } }),
    prisma.emailTemplate.findMany({ orderBy: { key: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-[76rem]">
      <header className="mb-6">
        <TitrePage>Paramètres</TitrePage>
        <p className="type-ui mt-2 max-w-[72ch] font-normal text-fg-soft">
          Délais, frais de port, informations légales et e-mails automatiques. Rien ici n&apos;a été
          inventé : ce qui manque est signalé.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Panneau
          titre="Réglages"
          aide="Utilisés par le configurateur, le paiement et les pages légales."
        >
          <form action={enregistrerParametres} className="flex flex-col gap-6">
            {reglages.map((reglage) => {
              const valeur = reglage.value as unknown;

              if (typeof valeur === "number") {
                return (
                  <Champ key={reglage.key} label={reglage.label} className="max-w-sm">
                    <Saisie name={reglage.key} type="number" step="1" defaultValue={valeur} />
                  </Champ>
                );
              }

              // L'identité légale part de sa forme complète : une base créée avant
              // l'ajout d'un champ doit quand même le proposer à la saisie.
              const objet: Record<string, unknown> = {
                ...(reglage.key === CLE_IDENTITE ? IDENTITE_VIDE : {}),
                ...((valeur ?? {}) as Record<string, unknown>),
              };
              const cles = Object.keys(objet).filter(
                (cle) => cle !== "aRemplir" && cle !== "exemple",
              );

              return (
                <fieldset key={reglage.key} className="border-t border-rule pt-5">
                  <legend className="type-ui flex flex-wrap items-center gap-3 pr-3 text-fg">
                    {reglage.label}
                    {objet["aRemplir"] === true && <Pill ton="alerte">À remplir</Pill>}
                    {objet["exemple"] === true && <Pill ton="alerte">Exemple</Pill>}
                  </legend>

                  <div className="mt-4 flex flex-wrap gap-4">
                    {cles.map((cle) => (
                      <Champ
                        key={cle}
                        label={LIBELLE_CLE[cle] ?? cle}
                        className="min-w-[14rem] flex-1"
                      >
                        <Saisie
                          name={`${reglage.key}.${cle}`}
                          type={typeof objet[cle] === "number" ? "number" : "text"}
                          step={estMontant(cle) ? "0.01" : typeof objet[cle] === "number" ? "1" : undefined}
                          defaultValue={
                            estMontant(cle)
                              ? ((objet[cle] as number) / 100).toFixed(2)
                              : typeof objet[cle] === "number"
                                ? (objet[cle] as number) || ""
                                : String(objet[cle] ?? "")
                          }
                          placeholder={
                            objet["aRemplir"] === true
                              ? `[À REMPLIR : ${(LIBELLE_CLE[cle] ?? cle).toLowerCase()}]`
                              : undefined
                          }
                        />
                      </Champ>
                    ))}
                  </div>
                </fieldset>
              );
            })}

            <Bouton>Enregistrer les réglages</Bouton>
          </form>
        </Panneau>

        <Panneau
          titre="E-mails automatiques"
          aide="Envoyés au client à chaque changement d'étape. Un gabarit désactivé n'envoie rien."
        >
          <p className="type-caption mb-6 text-fg-soft">
            Variables disponibles :{" "}
            {VARIABLES.map((variable) => (
              <span key={variable} className={cn(CODE, BLOC, "mb-1 mr-2 inline-block px-1.5 py-0.5 text-fg")}>
                {variable}
              </span>
            ))}
          </p>

          <ul className="flex flex-col gap-8">
            {gabarits.map((gabarit) => (
              <li key={gabarit.id} className="border-t border-rule pt-6 first:border-0 first:pt-0">
                <form action={enregistrerGabarit} className="flex flex-col gap-4">
                  <input type="hidden" name="gabarit" value={gabarit.key} />

                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className={cn(CODE, "text-fg-soft")}>{gabarit.key}</span>
                    <span className="type-caption text-fg-soft">
                      modifié le {formatDate(gabarit.updatedAt)}
                    </span>
                  </div>

                  <Champ label="Objet">
                    <Saisie name="sujet" defaultValue={gabarit.subject} />
                  </Champ>
                  <Champ label="Corps" aide="Markdown simple : **gras**, retours à la ligne.">
                    <Zone name="corps" rows={5} defaultValue={gabarit.bodyMd} />
                  </Champ>

                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      name="actif"
                      defaultChecked={gabarit.isActive}
                      className={CASE}
                    />
                    <span className="type-ui text-fg">Envoyer cet e-mail</span>
                  </label>

                  <Bouton>Enregistrer ce gabarit</Bouton>
                </form>
              </li>
            ))}
          </ul>
        </Panneau>
      </div>
    </div>
  );
}
