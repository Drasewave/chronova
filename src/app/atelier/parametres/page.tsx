import { enregistrerGabarit, enregistrerParametres } from "@/app/actions/atelier-relation";
import { Bouton, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";

export const metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

/** Libellés des clés d'un réglage composé, dans l'ordre où on les remplit. */
const LIBELLE_CLE: Record<string, string> = {
  cents: "Montant (€)",
  mois: "Durée (mois)",
  raisonSociale: "Raison sociale",
  siret: "SIRET",
  tva: "Numéro de TVA intracommunautaire",
  adresse: "Adresse du siège",
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
      <header className="mb-8">
        <h1 className="type-display-2">Paramètres</h1>
        <p className="type-body mt-2 text-fg-soft">
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

              const objet = (valeur ?? {}) as Record<string, unknown>;
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
              <span key={variable} className="type-mono mr-2 text-fg">
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
                    <span className="type-mono text-fg-soft">{gabarit.key}</span>
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

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="actif"
                      defaultChecked={gabarit.isActive}
                      className="size-5 accent-[var(--accent)]"
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
