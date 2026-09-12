import Link from "next/link";
import { enregistrerRegle, supprimerRegle } from "@/app/actions/atelier-catalogue";
import { Bouton, BoutonLeger, Champ, Liste, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";

export const metadata = { title: "Règles de compatibilité" };
export const dynamic = "force-dynamic";

const LIBELLE_TYPE = {
  EXIGE_UNE_DE: "Exige au moins une de",
  EXCLUT: "Est incompatible avec",
} as const;

/**
 * Les règles qui grisent une option.
 *
 * Une règle porte toujours un message : c'est lui qui s'affiche sous l'option
 * inaccessible, et la seule chose qui explique au client pourquoi. « Option
 * indisponible » ne dit rien ; « Nécessite le mouvement GMT » dit tout.
 */
export default async function Regles() {
  const [regles, etapes] = await Promise.all([
    prisma.compatibilityRule.findMany({
      include: { subject: { include: { group: { include: { step: true } } } } },
    }),
    prisma.configStep.findMany({
      orderBy: { sortIndex: "asc" },
      include: {
        groups: {
          orderBy: { sortIndex: "asc" },
          include: { options: { orderBy: { sortIndex: "asc" } } },
        },
      },
    }),
  ]);

  /** Toutes les options, sous la forme `groupe:option` attendue par le moteur. */
  const references = etapes.flatMap((etape) =>
    etape.groups.flatMap((groupe) =>
      groupe.options.map((option) => ({
        ref: `${groupe.key}:${option.key}`,
        libelle: `${etape.label} · ${groupe.label} · ${option.label}`,
        id: option.id,
      })),
    ),
  );
  const parRef = new Map(references.map((entree) => [entree.ref, entree.libelle] as const));

  const triees = [...regles].sort((a, b) =>
    `${a.subject.group.step.sortIndex}${a.subject.group.label}`.localeCompare(
      `${b.subject.group.step.sortIndex}${b.subject.group.label}`,
    ),
  );

  return (
    <div className="mx-auto max-w-[76rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link
          href="/atelier/catalogue"
          className="type-mono link-underline text-fg-soft hover:text-accent"
        >
          ← Catalogue
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="type-display-2">Règles de compatibilité</h1>
        <p className="type-body mt-2 text-fg-soft">
          {regles.length} règle(s). Une option dont la règle n&apos;est pas satisfaite reste
          visible mais non sélectionnable, avec sa raison.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <Panneau titre="Ajouter une règle">
          <form action={enregistrerRegle} className="flex flex-col gap-4">
            <Champ label="Option concernée">
              <Liste name="sujet" required>
                {references.map((entree) => (
                  <option key={entree.id} value={entree.id}>
                    {entree.libelle}
                  </option>
                ))}
              </Liste>
            </Champ>

            <Champ label="Condition">
              <Liste name="type" defaultValue="EXIGE_UNE_DE">
                <option value="EXIGE_UNE_DE">{LIBELLE_TYPE.EXIGE_UNE_DE}</option>
                <option value="EXCLUT">{LIBELLE_TYPE.EXCLUT}</option>
              </Liste>
            </Champ>

            <Champ
              label="Options visées"
              aide="Maintenir Ctrl (ou Cmd) pour en choisir plusieurs. Le lien est un « ou »."
            >
              <Liste name="cible" multiple size={8} className="h-auto">
                {references.map((entree) => (
                  <option key={entree.ref} value={entree.ref}>
                    {entree.libelle}
                  </option>
                ))}
              </Liste>
            </Champ>

            <Champ
              label="Raison affichée au client"
              aide="Écrite pour être lue sous l'option grisée. Jamais « option indisponible »."
            >
              <Zone name="message" rows={2} placeholder="Nécessite le mouvement GMT." required />
            </Champ>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="actif"
                defaultChecked
                className="size-5 accent-[var(--accent)]"
              />
              <span className="type-ui text-fg">Règle appliquée</span>
            </label>

            <Bouton>Ajouter la règle</Bouton>
          </form>
        </Panneau>

        <Panneau titre="Règles en place">
          {triees.length === 0 ? (
            <p className="type-caption text-fg-soft">Aucune règle.</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {triees.map((regle) => (
                <li key={regle.id} className="border-t border-rule pt-6 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="type-ui text-fg">
                      {regle.subject.group.step.label} · {regle.subject.group.label} ·{" "}
                      {regle.subject.label}
                    </span>
                    <span className="flex items-center gap-3">
                      {!regle.isActive && <Pill ton="alerte">Suspendue</Pill>}
                      <form action={supprimerRegle}>
                        <input type="hidden" name="regle" value={regle.id} />
                        <BoutonLeger className="border-alert text-alert hover:border-alert hover:text-alert">
                          Supprimer
                        </BoutonLeger>
                      </form>
                    </span>
                  </div>

                  <p className="type-caption mt-2 text-fg-soft">
                    {LIBELLE_TYPE[regle.kind]} :{" "}
                    {regle.targetRefs.map((ref) => parRef.get(ref) ?? ref).join(" · ")}
                  </p>

                  {/* Le message aussi en clair : lu dans un champ de saisie, il
                      ne se laisse pas parcourir du regard. */}
                  <p className="type-body mt-2 border-l-2 border-accent-decor pl-3 text-fg">
                    « {regle.message} »
                  </p>

                  <form action={enregistrerRegle} className="mt-4 flex flex-wrap items-end gap-4">
                    <input type="hidden" name="regle" value={regle.id} />
                    <input type="hidden" name="type" value={regle.kind} />
                    {regle.targetRefs.map((ref) => (
                      <input key={ref} type="hidden" name="cible" value={ref} />
                    ))}
                    <Champ label="Raison affichée" className="min-w-[18rem] flex-1">
                      <Saisie name="message" defaultValue={regle.message} />
                    </Champ>
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        type="checkbox"
                        name="actif"
                        defaultChecked={regle.isActive}
                        className="size-5 accent-[var(--accent)]"
                      />
                      <span className="type-ui text-fg">Appliquée</span>
                    </label>
                    <BoutonLeger>Enregistrer</BoutonLeger>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </div>
    </div>
  );
}
