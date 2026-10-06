import Link from "next/link";
import { exigerAdmin } from "@/lib/securite/acces";
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
import { cn, formatPrice } from "@/lib/utils";
import { BLOC, FilAriane, LIGNE_TABLEAU, Tableau, TitrePage } from "@/components/atelier/gabarit";
import { CASE, SAISIE } from "@/components/atelier/formulaire";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/atelier/commandes/[numero]">) {
  const { numero } = await props.params;
  return { title: `Commande ${numero}` };
}

export default async function FicheCommande(props: PageProps<"/atelier/commandes/[numero]">) {
  await exigerAdmin();
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
      <FilAriane href="/atelier/commandes">Commandes</FilAriane>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono flex flex-wrap items-center gap-3 text-fg-soft">
            {commande.number}
            {commande.isSample && <SamplePill />}
          </p>
          <TitrePage className="mt-1">
            {(ligne?.snapshot as { modele?: string } | null)?.modele ?? "Montre"}
          </TitrePage>
          <p className="type-ui mt-2 max-w-[72ch] font-normal text-fg-soft">
            {commande.user?.name ?? commande.email}
            {commande.user?.wristSizeMm ? ` · poignet ${commande.user.wristSizeMm} mm` : ""}
            {commande.user?.phone ? ` · ${commande.user.phone}` : ""}
          </p>
        </div>
        <div className="sm:text-right">
          <Pill ton="accent">{libelleStatut(commande.status)}</Pill>
          <p className="type-caption mt-2 text-fg-soft" data-numeric>
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
              <div className={`p-3 ${BLOC}`}>
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
                    <h3 className="type-mono border-b border-rule pb-1.5 font-medium text-fg-soft">
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
              <label className="flex flex-col gap-1.5">
                <span className="type-caption font-medium text-fg">Nouvelle étape</span>
                <select
                  name="etape"
                  defaultValue={commande.status}
                  className={cn(SAISIE, "h-11 w-auto")}
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
              <label className="flex min-w-[14rem] flex-1 flex-col gap-1.5">
                <span className="type-caption font-medium text-fg">Note pour le client (facultatif)</span>
                <input name="note" className={cn(SAISIE, "h-11")} />
              </label>
              <Bouton className="self-end">Changer d&apos;étape</Bouton>
            </form>

            <ol className="mt-6 flex flex-col gap-2 border-t border-rule pt-4">
              {commande.events.map((evenement) => (
                <li key={evenement.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="type-caption text-fg-soft" data-numeric>{formatDate(evenement.createdAt)}</span>
                  <span className="type-ui text-fg">{libelleStatut(evenement.toStatus)}</span>
                  {evenement.emailSent && <span className="type-caption text-positive">e-mail envoyé</span>}
                  {evenement.note && <span className="type-caption text-fg-soft">« {evenement.note} »</span>}
                </li>
              ))}
            </ol>
          </Panneau>

          <Panneau
            titre="Nomenclature"
            aide="Générée depuis la configuration. Les pièces sortent du stock au passage en assemblage."
          >
            <Tableau largeurMin="min-w-[40rem]">
                <thead>
                  <tr className="border-b border-rule">
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
                      <tr key={piece.id} className={LIGNE_TABLEAU}>
                        <td className="h-12 px-2 py-1">
                          <Link
                            href={`/atelier/stock/${piece.partId}`}
                            className="type-mono lien-atelier link-underline text-accent-ink"
                          >
                            {piece.part.reference}
                          </Link>
                        </td>
                        <td className="type-caption px-2 py-2 text-fg">{piece.part.name}</td>
                        <td className="type-caption px-2 py-2 text-fg-soft">
                          {piece.part.supplier?.name ?? "—"}
                        </td>
                        <td className="type-caption px-2 py-2 text-right text-fg" data-numeric>
                          {piece.quantity}
                        </td>
                        <td className="type-caption px-2 py-2 text-right text-fg-soft" data-numeric>
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
              </Tableau>
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
                        className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-field px-2 py-1 text-left transition-colors duration-200 hover:bg-bg-alt"
                        aria-pressed={tache.isDone}
                      >
                        <span
                          aria-hidden="true"
                          className={
                            tache.isDone
                              ? "type-caption grid size-6 shrink-0 place-items-center rounded-[6px] border border-accent-ink bg-accent text-on-accent"
                              : "size-6 shrink-0 rounded-[6px] border border-field"
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
                    className={CASE}
                  />
                  <span className="type-ui text-fg">Étanchéité conforme</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Champ name="bar" label="Pression testée (bar)" defaultValue={commande.qc?.waterTestBar ?? ""} />
                  <Champ name="ecart" label="Écart (s/jour)" defaultValue={commande.qc?.rateSecondsPerDay ?? ""} />
                  <Champ name="amplitude" label="Amplitude (°)" defaultValue={commande.qc?.amplitudeDegrees ?? ""} />
                  <Champ name="erreurLevee" label="Erreur de levée (ms)" defaultValue={commande.qc?.beatErrorMs ?? ""} />
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="type-caption font-medium text-fg">Notes de contrôle</span>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={commande.qc?.notes ?? ""}
                    className={cn(SAISIE, "py-2.5 leading-[1.5]")}
                  />
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    name="valide"
                    defaultChecked={commande.qc?.passed ?? false}
                    className={CASE}
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
                    <p className="type-caption mt-1 text-fg-soft">
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
                  <input type="checkbox" name="visible" defaultChecked className={CASE} />
                  <span className="type-ui text-fg">Visible par le client</span>
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
                  aria-label="Notes internes"
                  defaultValue={commande.internalNotes ?? ""}
                  className={cn(SAISIE, "py-2.5 leading-[1.5]")}
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
    <label className="flex flex-col gap-1.5">
      <span className="type-caption font-medium text-fg">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className={cn(SAISIE, "h-11")}
      />
    </label>
  );
}

function Bouton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="submit"
      className={cn(
        "type-ui inline-flex min-h-11 items-center justify-center self-start rounded-pill bg-accent px-6 text-on-accent transition-colors duration-200 hover:bg-accent-hover active:translate-y-px",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ThMini({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`type-mono h-11 whitespace-nowrap px-2 py-2 font-medium text-fg-soft ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}
