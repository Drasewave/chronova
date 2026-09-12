import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ajouterPhoto,
  basculerTache,
  changerEtape,
  enregistrerControle,
  enregistrerNotes,
  enregistrerSuivi,
} from "@/app/actions/atelier-commandes";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill, SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { ETAPES_CLIENT, formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { grouperParEtape, type SummaryLine } from "@/lib/configurateur/configuration";
import type { WatchRender } from "@/watch/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/atelier/commandes/[numero]">) {
  const { numero } = await props.params;
  return { title: `Commande ${numero}` };
}

export default async function FicheCommande(props: PageProps<"/atelier/commandes/[numero]">) {
  const { numero } = await props.params;

  const commande = await prisma.order.findUnique({
    where: { number: numero },
    include: {
      items: {
        include: {
          configuration: { include: { model: { select: { name: true, slug: true } } } },
          parts: { include: { part: { include: { supplier: { select: { name: true } } } } } },
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { sortIndex: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
      qc: true,
      warranty: true,
      user: { select: { id: true, name: true, email: true, phone: true, wristSizeMm: true } },
    },
  });

  if (!commande) notFound();

  const ligne = commande.items[0];
  const instantane = ligne?.configuration.snapshot as
    | { render?: WatchRender; summary?: SummaryLine[] }
    | null;
  const adresse = commande.shippingAddress as Record<string, string> | null;

  const coutPieces = commande.items.reduce(
    (somme, item) => somme + item.partsCostCents * item.quantity,
    0,
  );
  const marge = commande.subtotalCents - coutPieces;
  const tachesFaites = commande.tasks.filter((tache) => tache.isDone).length;

  return (
    <div className="mx-auto max-w-[84rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link href="/atelier/commandes" className="type-mono link-underline text-fg-soft hover:text-accent">
          ← Commandes
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono flex flex-wrap items-center gap-3 text-fg-soft">
            {commande.number}
            {commande.isSample && <SamplePill />}
          </p>
          <h1 className="type-display-2 mt-2">
            {(ligne?.snapshot as { modele?: string } | null)?.modele ?? "Montre"}
          </h1>
          <p className="type-body mt-2 text-fg-soft">
            {commande.user ? (
              <Link href={`/atelier/clients/${commande.user.id}`} className="link-underline text-accent">
                {commande.user.name ?? commande.email}
              </Link>
            ) : (
              commande.email
            )}
            {commande.user?.wristSizeMm ? ` · poignet ${commande.user.wristSizeMm} mm` : ""}
            {commande.user?.phone ? ` · ${commande.user.phone}` : ""}
          </p>
        </div>
        <div className="text-right">
          <Pill ton="accent">{libelleStatut(commande.status)}</Pill>
          <p className="type-mono mt-3 text-fg-soft">
            Passée le {formatDate(commande.createdAt)}
            {commande.promisedAt ? ` · à expédier vers le ${formatDate(commande.promisedAt)}` : ""}
          </p>
        </div>
      </header>

      {/* `min-w-0` sur les deux colonnes : sans lui, la nomenclature impose sa
          largeur minimale à toute la grille et la fiche déborde sur mobile. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] [&>div]:min-w-0">
        {/* Colonne gauche : la montre telle qu'elle doit être montée. */}
        <div className="flex flex-col gap-4">
          <Panneau titre="La montre" aide="Configuration figée au moment de la commande.">
            {instantane?.render && (
              <div className="border border-rule bg-bg-alt p-3">
                <WatchSvg
                  id={`crm-${commande.id}`}
                  render={instantane.render}
                  label="Configuration commandée"
                  className="h-auto w-full"
                />
              </div>
            )}
            {instantane?.summary && (
              /* Groupé par étape : hors de son étape, « Forme » ou « Teinte »
                 ne veut rien dire — celle des aiguilles ou celle du verre ? */
              <div className="mt-5">
                {grouperParEtape(instantane.summary).map(([etape, lignes]) => (
                  <section key={etape} className="mt-5 first:mt-0">
                    <h3 className="type-mono border-b border-accent-decor pb-1 text-fg-soft">
                      {etape}
                    </h3>
                    <dl>
                      {lignes.map((entree) => (
                        <div
                          key={entree.groupKey}
                          className="flex justify-between gap-3 border-b border-rule py-2"
                        >
                          <dt className="type-caption text-fg-soft">{entree.groupLabel}</dt>
                          <dd className="type-caption text-right text-fg">{entree.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            )}
          </Panneau>

          <Panneau titre="Montant et marge">
            <dl className="flex flex-col gap-2">
              <Ligne terme="Montre" valeur={formatPrice(commande.subtotalCents)} />
              <Ligne
                terme="Livraison"
                valeur={commande.shippingCents === 0 ? "Offerte" : formatPrice(commande.shippingCents)}
              />
              <Ligne terme="Total client" valeur={formatPrice(commande.totalCents)} fort />
              <hr className="my-2 border-rule" />
              <Ligne terme="Coût des pièces" valeur={formatPrice(coutPieces)} />
              <Ligne terme="Marge" valeur={formatPrice(marge)} fort />
              <p className="type-caption mt-1 text-fg-soft">
                Soit {Math.round((marge / Math.max(1, commande.subtotalCents)) * 100)} % du prix de
                la montre. Hors temps passé et frais fixes.
              </p>
            </dl>
          </Panneau>

          <Panneau titre="Livraison">
            <p className="type-body text-fg">
              {adresse?.["fullName"]}
              <br />
              {adresse?.["line1"]}
              {adresse?.["line2"] && (
                <>
                  <br />
                  {adresse["line2"]}
                </>
              )}
              <br />
              {adresse?.["postalCode"]} {adresse?.["city"]} · {adresse?.["country"]}
            </p>

            <form action={enregistrerSuivi} className="mt-5 flex flex-col gap-3">
              <input type="hidden" name="numero" value={commande.number} />
              <Champ name="transporteur" label="Transporteur" defaultValue={commande.carrier ?? ""} />
              <Champ name="suivi" label="Numéro de suivi" defaultValue={commande.trackingNumber ?? ""} />
              <Champ name="url" label="Lien de suivi" defaultValue={commande.trackingUrl ?? ""} />
              <Bouton>Enregistrer le suivi</Bouton>
            </form>
          </Panneau>
        </div>

        {/* Colonne droite : ce que l'horloger fait. */}
        <div className="flex flex-col gap-4">
          <Panneau titre="Étape" aide="Changer d'étape prévient le client par e-mail.">
            <form action={changerEtape} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="numero" value={commande.number} />
              <label className="flex flex-col gap-1">
                <span className="type-caption text-fg-soft">Nouvelle étape</span>
                <select
                  name="etape"
                  defaultValue={commande.status}
                  className="type-ui h-11 rounded-field border border-rule bg-bg px-3 text-fg"
                >
                  {ETAPES_CLIENT.map((etape) => (
                    <option key={etape.statut} value={etape.statut}>
                      {etape.label}
                    </option>
                  ))}
                  <option value="ANNULEE">Annulée</option>
                  <option value="REMBOURSEE">Remboursée</option>
                </select>
              </label>
              <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
                <span className="type-caption text-fg-soft">Note pour le client (facultatif)</span>
                <input
                  name="note"
                  className="type-ui h-11 rounded-field border border-rule bg-bg px-3 text-fg"
                />
              </label>
              <Bouton>Changer d&apos;étape</Bouton>
            </form>

            <ol className="mt-6 flex flex-col gap-2 border-t border-rule pt-4">
              {commande.events.map((evenement) => (
                <li key={evenement.id} className="flex flex-wrap items-baseline gap-3">
                  <span className="type-mono text-fg-soft">{formatDate(evenement.createdAt)}</span>
                  <span className="type-ui text-fg">{libelleStatut(evenement.toStatus)}</span>
                  {evenement.emailSent && <span className="type-mono text-positive">e-mail envoyé</span>}
                  {evenement.note && <span className="type-caption text-fg-soft">« {evenement.note} »</span>}
                </li>
              ))}
            </ol>
          </Panneau>

          <Panneau
            titre="Nomenclature"
            aide="Générée depuis la configuration. Les pièces sortent du stock au passage en assemblage."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse">
                <thead>
                  <tr className="border-b border-rule text-left">
                    <ThMini>Référence</ThMini>
                    <ThMini>Pièce</ThMini>
                    <ThMini>Fournisseur</ThMini>
                    <ThMini align="right">Qté</ThMini>
                    <ThMini align="right">Coût</ThMini>
                    <ThMini>État</ThMini>
                  </tr>
                </thead>
                <tbody>
                  {commande.items.flatMap((item) =>
                    item.parts.map((piece) => (
                      <tr key={piece.id} className="border-b border-rule">
                        <td className="px-2 py-2">
                          <Link
                            href={`/atelier/stock/${piece.partId}`}
                            className="type-mono link-underline text-accent"
                          >
                            {piece.part.reference}
                          </Link>
                        </td>
                        <td className="type-caption px-2 py-2 text-fg">{piece.part.name}</td>
                        <td className="type-caption px-2 py-2 text-fg-soft">
                          {piece.part.supplier?.name ?? "—"}
                        </td>
                        <td className="type-mono px-2 py-2 text-right text-fg" data-numeric>
                          {piece.quantity}
                        </td>
                        <td className="type-mono px-2 py-2 text-right text-fg-soft" data-numeric>
                          {formatPrice(piece.unitCostCents * piece.quantity)}
                        </td>
                        <td className="px-2 py-2">
                          <Pill ton={piece.consumedAt ? "positif" : "neutre"}>
                            {piece.consumedAt ? "Sortie" : "Réservée"}
                          </Pill>
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </Panneau>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panneau titre="Checklist d'assemblage" aide={`${tachesFaites} / ${commande.tasks.length} faites`}>
              <ul className="flex flex-col">
                {commande.tasks.map((tache) => (
                  <li key={tache.id} className="border-b border-rule last:border-0">
                    <form action={basculerTache}>
                      <input type="hidden" name="id" value={tache.id} />
                      <input type="hidden" name="numero" value={commande.number} />
                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center gap-3 py-1 text-left"
                        aria-pressed={tache.isDone}
                      >
                        <span
                          aria-hidden="true"
                          className={
                            tache.isDone
                              ? "grid size-5 shrink-0 place-items-center rounded-field border border-accent bg-accent text-on-accent"
                              : "size-5 shrink-0 rounded-field border border-rule"
                          }
                        >
                          {tache.isDone ? "✓" : ""}
                        </span>
                        <span className={tache.isDone ? "type-ui text-fg-soft line-through" : "type-ui text-fg"}>
                          {tache.label}
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Panneau>

            <Panneau titre="Contrôle" aide="Étanchéité, puis marche suivie sur 72 heures.">
              <form action={enregistrerControle} className="flex flex-col gap-3">
                <input type="hidden" name="numero" value={commande.number} />
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    name="etancheite"
                    defaultChecked={commande.qc?.waterTestPassed ?? false}
                    className="size-6 accent-[var(--accent)]"
                  />
                  <span className="type-ui text-fg">Étanchéité conforme</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Champ name="bar" label="Pression testée (bar)" defaultValue={commande.qc?.waterTestBar ?? ""} />
                  <Champ name="ecart" label="Écart (s/jour)" defaultValue={commande.qc?.rateSecondsPerDay ?? ""} />
                  <Champ name="amplitude" label="Amplitude (°)" defaultValue={commande.qc?.amplitudeDegrees ?? ""} />
                  <Champ name="erreurLevee" label="Erreur de levée (ms)" defaultValue={commande.qc?.beatErrorMs ?? ""} />
                </div>
                <label className="flex flex-col gap-1">
                  <span className="type-caption text-fg-soft">Notes de contrôle</span>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={commande.qc?.notes ?? ""}
                    className="type-body rounded-field border border-rule bg-bg p-3 text-fg"
                  />
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    name="valide"
                    defaultChecked={commande.qc?.passed ?? false}
                    className="size-6 accent-[var(--accent)]"
                  />
                  <span className="type-ui text-fg">Contrôle validé, montre bonne pour le départ</span>
                </label>
                <Bouton>Enregistrer le contrôle</Bouton>
              </form>
            </Panneau>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panneau titre="Photos d'assemblage" aide="Visibles par le client sur son suivi.">
              <ul className="flex flex-col gap-2">
                {commande.photos.map((photo) => (
                  <li key={photo.id} className="border-b border-rule pb-2">
                    <p className="type-ui text-fg">{photo.alt}</p>
                    {photo.caption && <p className="type-caption text-fg-soft">{photo.caption}</p>}
                    <p className="type-mono mt-1 text-fg-soft">
                      {photo.isPublic ? "visible du client" : "interne"} ·{" "}
                      {formatDate(photo.createdAt)}
                    </p>
                  </li>
                ))}
                {commande.photos.length === 0 && (
                  <li className="type-caption text-fg-soft">Aucune photo pour l&apos;instant.</li>
                )}
              </ul>

              <form action={ajouterPhoto} className="mt-5 flex flex-col gap-3 border-t border-rule pt-4">
                <input type="hidden" name="numero" value={commande.number} />
                <Champ name="alt" label="Ce que montre la photo" required />
                <Champ name="legende" label="Légende pour le client" />
                <Champ name="url" label="Adresse du fichier" />
                <label className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" name="visible" defaultChecked className="size-6 accent-[var(--accent)]" />
                  <span className="type-caption text-fg">Visible par le client</span>
                </label>
                <Bouton>Ajouter</Bouton>
              </form>
              <p className="type-caption mt-3 text-fg-soft">
                Le dépôt de fichiers n&apos;est pas encore branché : seule la description est
                enregistrée, et le client voit un emplacement décrit.
              </p>
            </Panneau>

            <Panneau titre="Notes internes" aide="Jamais visibles par le client.">
              <form action={enregistrerNotes} className="flex flex-col gap-3">
                <input type="hidden" name="numero" value={commande.number} />
                <textarea
                  name="notes"
                  rows={8}
                  defaultValue={commande.internalNotes ?? ""}
                  className="type-body rounded-field border border-rule bg-bg p-3 text-fg"
                />
                <Bouton>Enregistrer</Bouton>
              </form>
            </Panneau>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ligne({ terme, valeur, fort }: { terme: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className={fort ? "type-ui text-fg" : "type-caption text-fg-soft"}>{terme}</dt>
      <dd className={fort ? "type-ui text-fg" : "type-caption text-fg"} data-numeric>
        {valeur}
      </dd>
    </div>
  );
}

function Champ({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="type-caption text-fg-soft">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="type-ui h-11 rounded-field border border-rule bg-bg px-3 text-fg"
      />
    </label>
  );
}

function Bouton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="type-ui inline-flex min-h-11 items-center justify-center self-start rounded-field bg-accent px-5 text-on-accent transition-colors duration-200 hover:bg-accent-hover"
    >
      {children}
    </button>
  );
}

function ThMini({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`type-mono px-2 py-2 font-normal text-fg-soft ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}
