import Link from "next/link";
import { enregistrerDossier, ouvrirDossier } from "@/app/actions/atelier-relation";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Bouton, Champ, Liste, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { LIBELLE_DOSSIER, LIBELLE_TYPE_DOSSIER, TON_DOSSIER } from "@/lib/atelier/demandes";
import { formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import type { CaseStatus, CaseType } from "@/generated/prisma/enums";

export const metadata = { title: "Après-vente" };
export const dynamic = "force-dynamic";

const STATUTS: CaseStatus[] = ["RECU", "DIAGNOSTIC", "DEVIS", "EN_COURS", "TERMINE", "RENVOYE"];
const TYPES: CaseType[] = ["GARANTIE", "REVISION", "REPARATION"];
const JOUR = 24 * 60 * 60 * 1000;

/**
 * Après-vente : les montres revenues, et celles encore couvertes.
 *
 * Chaque dossier s'édite sur place. Ouvrir une page par réparation serait un
 * clic de trop pour un volume qui se compte en dizaines par an — et l'horloger
 * veut voir d'un coup d'œil tout ce qui traîne sur l'établi.
 */
export default async function ApresVente(props: PageProps<"/atelier/sav">) {
  const { filtre } = await props.searchParams;
  const clos = filtre === "clos";

  const [dossiers, garanties] = await Promise.all([
    prisma.serviceCase.findMany({
      where: clos
        ? { status: { in: ["TERMINE", "RENVOYE"] } }
        : { status: { notIn: ["TERMINE", "RENVOYE"] } },
      orderBy: { openedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { number: true } },
      },
    }),
    prisma.warranty.findMany({
      orderBy: { endsAt: "asc" },
      include: {
        order: {
          select: {
            number: true,
            email: true,
            user: { select: { id: true, name: true } },
            items: { select: { snapshot: true } },
          },
        },
      },
    }),
  ]);

  const maintenant = Date.now();

  return (
    <div className="mx-auto max-w-[84rem]">
      <header className="mb-8">
        <h1 className="type-display-2">Après-vente</h1>
        <p className="type-body mt-2 text-fg-soft">
          {dossiers.length} dossier(s) {clos ? "classés" : "ouverts"} · {garanties.length}{" "}
          garantie(s) enregistrée(s).
        </p>
      </header>

      <BandeauExemple
        nombre={dossiers.filter((dossier) => dossier.isSample).length}
        quoi="dossiers d'après-vente"
      />

      <nav aria-label="Filtrer les dossiers" className="mb-6 flex flex-wrap gap-2">
        <Filtre href="/atelier/sav" actif={!clos}>
          En cours
        </Filtre>
        <Filtre href="/atelier/sav?filtre=clos" actif={clos}>
          Classés
        </Filtre>
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          {dossiers.length === 0 ? (
            <Panneau titre="Rien sur l'établi">
              <p className="type-caption text-fg-soft">
                Aucun dossier {clos ? "classé" : "ouvert"}.
              </p>
            </Panneau>
          ) : (
            dossiers.map((dossier) => (
              <Panneau
                key={dossier.id}
                titre={dossier.reference}
                aide={`${LIBELLE_TYPE_DOSSIER[dossier.type]} · ouvert le ${formatDate(dossier.openedAt)}`}
                action={
                  <Pill ton={TON_DOSSIER[dossier.status]}>{LIBELLE_DOSSIER[dossier.status]}</Pill>
                }
              >
                <p className="type-body whitespace-pre-line text-fg">{dossier.description}</p>

                <p className="type-caption mt-3 text-fg-soft">
                  {dossier.user ? (
                    <Link
                      href={`/atelier/clients/${dossier.user.id}`}
                      className="link-underline text-accent"
                    >
                      {dossier.user.name ?? dossier.user.email}
                    </Link>
                  ) : (
                    "Client inconnu"
                  )}
                  {dossier.order && (
                    <>
                      {" · "}
                      <Link
                        href={`/atelier/commandes/${dossier.order.number}`}
                        className="link-underline text-accent"
                      >
                        {dossier.order.number}
                      </Link>
                    </>
                  )}
                  {dossier.closedAt ? ` · clos le ${formatDate(dossier.closedAt)}` : ""}
                </p>

                <form
                  action={enregistrerDossier}
                  className="mt-5 flex flex-col gap-4 border-t border-rule pt-5"
                >
                  <input type="hidden" name="dossier" value={dossier.id} />
                  <div className="flex flex-wrap gap-4">
                    <Champ label="Statut" className="min-w-[12rem] flex-1">
                      <Liste name="statut" defaultValue={dossier.status}>
                        {STATUTS.map((statut) => (
                          <option key={statut} value={statut}>
                            {LIBELLE_DOSSIER[statut]}
                          </option>
                        ))}
                      </Liste>
                    </Champ>
                    <Champ label="Coût (€)" aide="Vide si pris en garantie." className="w-36">
                      <Saisie
                        name="cout"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={dossier.costCents ? (dossier.costCents / 100).toFixed(2) : ""}
                      />
                    </Champ>
                  </div>
                  <Champ label="Diagnostic" aide="Ce qui a été constaté à l'ouverture de la montre.">
                    <Zone name="diagnostic" rows={2} defaultValue={dossier.diagnosis ?? ""} />
                  </Champ>
                  <Champ label="Intervention" aide="Ce qui a été fait, et avec quelles pièces.">
                    <Zone name="resolution" rows={2} defaultValue={dossier.resolution ?? ""} />
                  </Champ>
                  <Bouton>Enregistrer le dossier</Bouton>
                </form>
              </Panneau>
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panneau titre="Ouvrir un dossier" aide="Une montre qui revient, sous garantie ou non.">
            <form action={ouvrirDossier} className="flex flex-col gap-4">
              <Champ label="Type">
                <Liste name="type" defaultValue="REPARATION">
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {LIBELLE_TYPE_DOSSIER[type]}
                    </option>
                  ))}
                </Liste>
              </Champ>
              <Champ
                label="Numéro de commande"
                aide="Facultatif : rattache la montre et son client."
              >
                <Saisie name="commande" placeholder="CHR-2026-0001" />
              </Champ>
              <Champ label="Ce que dit le client">
                <Zone name="description" rows={4} />
              </Champ>
              <Bouton>Ouvrir</Bouton>
            </form>
          </Panneau>

          <Panneau titre="Garanties" aide="Créées automatiquement à l'expédition.">
            {garanties.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucune garantie enregistrée.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {garanties.map((garantie) => {
                  const restant = Math.round((garantie.endsAt.getTime() - maintenant) / JOUR);
                  return (
                    <li
                      key={garantie.id}
                      className="border-b border-rule pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <Link
                          href={`/atelier/commandes/${garantie.order.number}`}
                          className="type-mono link-underline text-accent"
                        >
                          {garantie.order.number}
                        </Link>
                        <span
                          className={`type-caption ${restant > 0 && restant < 60 ? "text-alert" : "text-fg-soft"}`}
                        >
                          {restant <= 0
                            ? "expirée"
                            : restant < 60
                              ? `expire dans ${restant} j`
                              : `jusqu'au ${formatDate(garantie.endsAt)}`}
                        </span>
                      </div>
                      <p className="type-caption text-fg-soft">
                        {(garantie.order.items[0]?.snapshot as { modele?: string } | null)?.modele ??
                          "—"}{" "}
                        · {garantie.order.user?.name ?? garantie.order.email}
                      </p>
                      {garantie.terms.startsWith("[À") && (
                        <p className="type-caption mt-1 text-alert">{garantie.terms}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panneau>

          <Panneau titre="Coût des interventions" aide="Sur les dossiers affichés.">
            <p className="type-display-2" data-numeric>
              {formatPrice(dossiers.reduce((somme, d) => somme + (d.costCents ?? 0), 0))}
            </p>
            <p className="type-caption mt-2 text-fg-soft">
              {dossiers.filter((d) => d.type === "GARANTIE").length} pris en garantie, donc non
              facturés.
            </p>
          </Panneau>
        </div>
      </div>
    </div>
  );
}

function Filtre({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={
        actif
          ? "type-ui flex min-h-11 items-center rounded-field border border-accent bg-accent px-4 text-on-accent"
          : "type-ui flex min-h-11 items-center rounded-field border border-rule px-4 text-fg hover:border-accent-decor hover:text-accent"
      }
    >
      {children}
    </Link>
  );
}
