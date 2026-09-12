import Link from "next/link";
import { notFound } from "next/navigation";
import {
  changerStatutDemande,
  changerStatutDevis,
  creerDevis,
  repondreDemande,
} from "@/app/actions/atelier-relation";
import { Bouton, BoutonLeger, Champ, Liste, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { MarquerLu } from "@/components/atelier/marquer-lu";
import { Pill, SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { LIBELLE_DEMANDE, TON_DEMANDE } from "@/lib/atelier/demandes";
import { formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import type { WatchRender } from "@/watch/types";
import type { SummaryLine } from "@/lib/configurateur/configuration";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const ETAPES: InquiryStatus[] = ["NOUVEAU", "LU", "EN_COURS", "DEVIS_ENVOYE", "CONVERTI", "CLOS"];

export async function generateMetadata(props: PageProps<"/atelier/demandes/[id]">) {
  const { id } = await props.params;
  const demande = await prisma.inquiry.findUnique({ where: { id }, select: { name: true } });
  return { title: demande ? `Demande de ${demande.name}` : "Demande" };
}

/**
 * Une demande, et ce qu'on en fait.
 *
 * Ouvrir la page marque le message comme lu : c'est le geste qui compte, pas
 * un bouton de plus à cliquer. Si une configuration est jointe, elle est
 * dessinée — répondre à une demande de pièce unique sans voir la montre dont
 * on parle n'aurait pas de sens.
 */
export default async function FicheDemande(props: PageProps<"/atelier/demandes/[id]">) {
  const { id } = await props.params;

  const demande = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, wristSizeMm: true } },
      quotes: { orderBy: { createdAt: "desc" } },
      configuration: { include: { model: { select: { name: true, slug: true } } } },
    },
  });
  if (!demande) notFound();

  const instantane = demande.configuration?.snapshot as
    | { render?: WatchRender; summary?: SummaryLine[] }
    | null;

  return (
    <div className="mx-auto max-w-[76rem]">
      {demande.status === "NOUVEAU" && <MarquerLu id={demande.id} />}

      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link
          href="/atelier/demandes"
          className="type-mono link-underline text-fg-soft hover:text-accent"
        >
          ← Demandes
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono flex flex-wrap items-center gap-3 text-fg-soft">
            {demande.type === "SUR_MESURE" ? "Pièce unique" : "Contact"}
            {demande.isSample && <SamplePill />}
          </p>
          <h1 className="type-display-2 mt-2">{demande.name}</h1>
          <p className="type-body mt-2 text-fg-soft">
            {demande.user ? (
              <Link href={`/atelier/clients/${demande.user.id}`} className="link-underline text-accent">
                {demande.email}
              </Link>
            ) : (
              demande.email
            )}
            {demande.phone ? ` · ${demande.phone}` : ""}
            {demande.budgetCents ? ` · budget annoncé ${formatPrice(demande.budgetCents)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <Pill ton={TON_DEMANDE[demande.status]}>{LIBELLE_DEMANDE[demande.status]}</Pill>
          <p className="type-mono mt-3 text-fg-soft">Reçue le {formatDate(demande.createdAt)}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          <Panneau titre="Le message">
            <p className="type-body whitespace-pre-line text-fg">{demande.message}</p>
          </Panneau>

          <Panneau
            titre="Répondre"
            aide="Part depuis l'atelier et bascule la demande en cours. Le texte est envoyé tel quel."
          >
            <form action={repondreDemande} className="flex flex-col gap-4">
              <input type="hidden" name="demande" value={demande.id} />
              <Champ label="Message">
                <Zone name="message" rows={8} defaultValue={`Bonjour ${demande.name.split(" ")[0]},\n\n`} />
              </Champ>
              <Bouton>Envoyer la réponse</Bouton>
            </form>
          </Panneau>

          {demande.type === "SUR_MESURE" && (
            <Panneau
              titre="Devis"
              aide="Les lignes sont figées à la création : un changement de tarif ne réécrit pas ce qui a été proposé."
            >
              <form action={creerDevis} className="flex flex-col gap-4">
                <input type="hidden" name="demande" value={demande.id} />
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex flex-wrap gap-3">
                    <Champ label={index === 0 ? "Intitulé" : ""} className="min-w-[14rem] flex-1">
                      <Saisie name="intitule" placeholder="Ce qui est facturé" />
                    </Champ>
                    <Champ label={index === 0 ? "Montant (€)" : ""} className="w-32">
                      <Saisie name="montant" type="number" step="0.01" min="0" />
                    </Champ>
                  </div>
                ))}
                <Champ label="Validité (jours)" className="w-40">
                  <Saisie name="validite" type="number" step="1" min="1" defaultValue={30} />
                </Champ>
                <Bouton>Créer le devis</Bouton>
              </form>

              {demande.quotes.length > 0 && (
                <ul className="mt-6 flex flex-col gap-5 border-t border-rule pt-5">
                  {demande.quotes.map((devis) => (
                    <li key={devis.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <span className="type-mono text-fg">{devis.reference}</span>
                        <span className="flex items-center gap-3">
                          <Pill ton={devis.status === "ACCEPTE" ? "positif" : "neutre"}>
                            {devis.status}
                          </Pill>
                          <span className="type-ui text-fg" data-numeric>
                            {formatPrice(devis.totalCents)}
                          </span>
                        </span>
                      </div>

                      <ul className="mt-2 flex flex-col gap-1">
                        {(devis.lines as { intitule: string; montantCents: number }[]).map(
                          (ligne, index) => (
                            <li key={index} className="flex justify-between gap-3">
                              <span className="type-caption text-fg-soft">{ligne.intitule}</span>
                              <span className="type-mono text-fg-soft" data-numeric>
                                {formatPrice(ligne.montantCents)}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>

                      {devis.validUntil && (
                        <p className="type-caption mt-2 text-fg-soft">
                          Valable jusqu&apos;au {formatDate(devis.validUntil)}
                        </p>
                      )}

                      {devis.status !== "ACCEPTE" && devis.status !== "REFUSE" && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {(["ENVOYE", "ACCEPTE", "REFUSE"] as const).map((statut) => (
                            <form key={statut} action={changerStatutDevis}>
                              <input type="hidden" name="devis" value={devis.id} />
                              <input type="hidden" name="statut" value={statut} />
                              <BoutonLeger>
                                {statut === "ENVOYE"
                                  ? "Marquer envoyé"
                                  : statut === "ACCEPTE"
                                    ? "Accepté"
                                    : "Refusé"}
                              </BoutonLeger>
                            </form>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panneau>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panneau titre="Suivi">
            <form action={changerStatutDemande} className="flex flex-col gap-4">
              <input type="hidden" name="demande" value={demande.id} />
              <Champ label="Statut">
                <Liste name="statut" defaultValue={demande.status}>
                  {ETAPES.map((statut) => (
                    <option key={statut} value={statut}>
                      {LIBELLE_DEMANDE[statut]}
                    </option>
                  ))}
                </Liste>
              </Champ>
              <Bouton>Mettre à jour</Bouton>
            </form>
          </Panneau>

          {instantane?.render && (
            <Panneau
              titre="La configuration jointe"
              aide="Telle que le client l'avait composée au moment de sa demande."
            >
              <div className="border border-rule bg-bg-alt p-3">
                <WatchSvg
                  id={`demande-${demande.id}`}
                  render={instantane.render}
                  label="Configuration jointe à la demande"
                  className="h-auto w-full"
                />
              </div>
              {demande.configuration?.model && (
                <p className="type-caption mt-3 text-fg-soft">
                  Sur la base de{" "}
                  <Link
                    href={`/collection/${demande.configuration.model.slug}`}
                    className="link-underline text-accent"
                  >
                    {demande.configuration.model.name}
                  </Link>
                </p>
              )}
              {instantane.summary && (
                <dl className="mt-4">
                  {instantane.summary.map((entree) => (
                    <div
                      key={entree.groupKey}
                      className="flex justify-between gap-3 border-b border-rule py-2"
                    >
                      <dt className="type-caption text-fg-soft">{entree.groupLabel}</dt>
                      <dd className="type-caption text-right text-fg">{entree.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Panneau>
          )}

          {demande.user?.wristSizeMm && (
            <Panneau titre="Ce qu'on sait déjà">
              <p className="type-caption text-fg-soft">
                Tour de poignet mesuré :{" "}
                <span className="type-mono text-fg" data-numeric>
                  {demande.user.wristSizeMm} mm
                </span>
              </p>
            </Panneau>
          )}
        </div>
      </div>
    </div>
  );
}
