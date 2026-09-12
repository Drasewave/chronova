import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ajouterNoteClient,
  anonymiserClient,
  changerEtiquettes,
  enregistrerFicheClient,
} from "@/app/actions/atelier-relation";
import { Bouton, BoutonLeger, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill, SamplePill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIBELLE_CONSENTEMENT = {
  NEWSLETTER: "Lettre d'information",
  COOKIES_MESURE: "Cookies de mesure",
  COOKIES_MARKETING: "Cookies publicitaires",
} as const;

export async function generateMetadata(props: PageProps<"/atelier/clients/[id]">) {
  const { id } = await props.params;
  const client = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: client?.name ?? "Client" };
}

/**
 * Fiche client.
 *
 * Ce qui vient du client (nom, e-mail, adresses) est affiché mais pas modifiable
 * ici : il le tient à jour depuis son compte. L'atelier n'ajoute que ce qu'il
 * observe — tour de poignet, préférences, notes — et ce que le RGPD lui impose
 * de pouvoir faire : exporter, effacer.
 */
export default async function FicheClient(props: PageProps<"/atelier/clients/[id]">) {
  const { id } = await props.params;

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      tags: true,
      addresses: true,
      consents: { orderBy: { createdAt: "desc" }, take: 10 },
      notes: { orderBy: { createdAt: "desc" } },
      inquiries: { orderBy: { createdAt: "desc" } },
      cases: { orderBy: { openedAt: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { select: { snapshot: true } } },
      },
    },
  });
  if (!client || client.role === "ADMIN") notFound();

  const etiquettes = await prisma.customerTag.findMany({ orderBy: { label: "asc" } });
  const payees = client.orders.filter(
    (commande) => !["EN_ATTENTE_PAIEMENT", "ANNULEE", "REMBOURSEE"].includes(commande.status),
  );
  const total = payees.reduce((somme, commande) => somme + commande.totalCents, 0);

  return (
    <div className="mx-auto max-w-[84rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link
          href="/atelier/clients"
          className="type-mono link-underline text-fg-soft hover:text-accent"
        >
          ← Clients
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-display-2">
            {client.anonymizedAt ? "Compte anonymisé" : (client.name ?? client.email)}
          </h1>
          <p className="type-body mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-fg-soft">
            {client.anonymizedAt ? (
              <span>Données personnelles effacées le {formatDate(client.anonymizedAt)}</span>
            ) : (
              <>
                <span>{client.email}</span>
                {client.phone && <span>· {client.phone}</span>}
                <span>· client depuis le {formatDate(client.createdAt)}</span>
              </>
            )}
            {client.isSample && <SamplePill />}
          </p>
        </div>
        <div className="text-right">
          <p className="type-display-2" data-numeric>
            {formatPrice(total)}
          </p>
          <p className="type-caption mt-1 text-fg-soft">
            {payees.length} commande(s) payée(s)
          </p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          <Panneau titre="Ce que l'atelier sait" aide="Observé à l'atelier, pas saisi par le client.">
            <form action={enregistrerFicheClient} className="flex flex-col gap-4">
              <input type="hidden" name="client" value={client.id} />
              <Champ label="Tour de poignet (mm)">
                <Saisie
                  name="poignet"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={client.wristSizeMm ?? ""}
                />
              </Champ>
              <Champ label="Préférences" aide="Goûts, contraintes, ce qu'il a aimé ou non.">
                <Zone name="preferences" rows={3} defaultValue={client.preferences ?? ""} />
              </Champ>
              <Champ label="Notes d'atelier">
                <Zone name="notes" rows={4} defaultValue={client.crmNotes ?? ""} />
              </Champ>
              <Bouton>Enregistrer</Bouton>
            </form>
          </Panneau>

          {etiquettes.length > 0 && (
            <Panneau titre="Étiquettes">
              <form action={changerEtiquettes} className="flex flex-col gap-3">
                <input type="hidden" name="client" value={client.id} />
                {etiquettes.map((etiquette) => (
                  <label key={etiquette.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="etiquette"
                      value={etiquette.id}
                      defaultChecked={client.tags.some((t) => t.id === etiquette.id)}
                      className="size-5 accent-[var(--accent)]"
                    />
                    <span className="type-ui text-fg">{etiquette.label}</span>
                  </label>
                ))}
                <Bouton>Appliquer</Bouton>
              </form>
            </Panneau>
          )}

          <Panneau titre="Adresses" aide="Tenues par le client depuis son compte.">
            {client.addresses.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucune adresse enregistrée.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {client.addresses.map((adresse) => (
                  <li key={adresse.id} className="border-b border-rule pb-4 last:border-0 last:pb-0">
                    {adresse.label && (
                      <p className="type-mono text-fg-soft">{adresse.label}</p>
                    )}
                    <p className="type-ui mt-1 text-fg">{adresse.fullName}</p>
                    <p className="type-caption text-fg-soft">
                      {adresse.line1}
                      {adresse.line2 ? `, ${adresse.line2}` : ""}
                      <br />
                      {adresse.postalCode} {adresse.city} · {adresse.country}
                    </p>
                    {adresse.isDefaultShipping && (
                      <Pill className="mt-2">Livraison par défaut</Pill>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau
            titre="Données personnelles"
            aide="Articles 15, 17 et 20 du RGPD : consulter, effacer, emporter."
          >
            <dl className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="type-caption text-fg-soft">Lettre d&apos;information</dt>
                <dd className="type-caption text-fg">{client.newsletter ? "Inscrit" : "Non"}</dd>
              </div>
            </dl>

            {client.consents.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1 border-t border-rule pt-4">
                {client.consents.map((consentement) => (
                  <li key={consentement.id} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="type-mono text-fg-soft">
                      {formatDate(consentement.createdAt)}
                    </span>
                    <span className="type-caption flex-1 text-fg">
                      {LIBELLE_CONSENTEMENT[consentement.type]}
                    </span>
                    <span className="type-caption text-fg-soft">
                      {consentement.granted ? "accordé" : "refusé"} · {consentement.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {!client.anonymizedAt && (
              <form action={anonymiserClient} className="mt-6 flex flex-col gap-3 border-t border-rule pt-5">
                <input type="hidden" name="client" value={client.id} />
                <p className="type-caption text-fg-soft">
                  L&apos;effacement coupe le lien entre la personne et ses commandes. Celles-ci
                  restent : la loi comptable impose de les conserver dix ans. L&apos;opération est
                  irréversible.
                </p>
                <Champ label="Taper ANONYMISER pour confirmer">
                  <Saisie name="confirmation" autoComplete="off" placeholder="ANONYMISER" />
                </Champ>
                <BoutonLeger className="border-alert text-alert hover:border-alert hover:text-alert">
                  Effacer les données personnelles
                </BoutonLeger>
              </form>
            )}
          </Panneau>
        </div>

        <div className="flex flex-col gap-4">
          <Panneau titre="Commandes">
            {client.orders.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucune commande.</p>
            ) : (
              <ul className="flex flex-col">
                {client.orders.map((commande) => (
                  <li key={commande.id} className="border-b border-rule last:border-0">
                    <Link
                      href={`/atelier/commandes/${commande.number}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                    >
                      <span className="type-mono text-accent">{commande.number}</span>
                      <span className="type-ui flex-1 text-fg">
                        {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                      </span>
                      <span className="type-caption text-fg-soft">
                        {libelleStatut(commande.status)} · {formatDate(commande.createdAt)}
                      </span>
                      <span className="type-ui text-fg" data-numeric>
                        {formatPrice(commande.totalCents)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau titre="Échanges" aide="Demandes de contact et de sur-mesure.">
            {client.inquiries.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucun échange.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {client.inquiries.map((demande) => (
                  <li key={demande.id} className="border-b border-rule pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <Link
                        href={`/atelier/demandes/${demande.id}`}
                        className="type-ui link-underline text-fg"
                      >
                        {demande.type === "SUR_MESURE" ? "Pièce unique" : "Contact"}
                      </Link>
                      <span className="type-mono text-fg-soft">
                        {formatDate(demande.createdAt)}
                      </span>
                    </div>
                    <p className="type-caption mt-2 line-clamp-2 text-fg-soft">{demande.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau titre="Après-vente">
            {client.cases.length === 0 ? (
              <p className="type-caption text-fg-soft">Aucun dossier.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {client.cases.map((dossier) => (
                  <li key={dossier.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="type-mono text-fg-soft">{dossier.reference}</span>
                    <span className="type-ui flex-1 text-fg">{dossier.description}</span>
                    <Pill>{dossier.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>

          <Panneau titre="Notes internes" aide="Jamais visibles par le client.">
            <form action={ajouterNoteClient} className="flex flex-col gap-3">
              <input type="hidden" name="client" value={client.id} />
              <Zone name="note" rows={3} placeholder="Ce qu'il faut se rappeler…" />
              <Bouton>Ajouter</Bouton>
            </form>

            {client.notes.length > 0 && (
              <ul className="mt-6 flex flex-col gap-4 border-t border-rule pt-5">
                {client.notes.map((note) => (
                  <li key={note.id}>
                    <p className="type-mono text-fg-soft">{formatDate(note.createdAt)}</p>
                    <p className="type-caption mt-1 whitespace-pre-line text-fg">{note.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panneau>
        </div>
      </div>
    </div>
  );
}
