import Link from "next/link";
import { notFound } from "next/navigation";
import { enregistrerModele } from "@/app/actions/atelier-catalogue";
import { Bouton, Champ, Saisie, Zone } from "@/components/atelier/formulaire";
import { Panneau } from "@/components/atelier/graphiques";
import { Pill, SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { prisma } from "@/lib/db";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/atelier/catalogue/modeles/[slug]">) {
  const { slug } = await props.params;
  const modele = await prisma.watchModel.findUnique({ where: { slug }, select: { name: true } });
  return { title: modele?.name ?? "Modèle" };
}

/**
 * Fiche d'un modèle de base.
 *
 * Le prix affiché sur le site est celui d'ici plus les suppléments des options
 * choisies : le coût des pièces et la marge sont donc rappelés à côté, pour
 * qu'un changement de prix ne se fasse pas à l'aveugle.
 */
export default async function FicheModele(props: PageProps<"/atelier/catalogue/modeles/[slug]">) {
  const { slug } = await props.params;

  const [enregistre, catalogue, modeles] = await Promise.all([
    prisma.watchModel.findUnique({ where: { slug } }),
    getCatalogue(),
    getModels(),
  ]);
  if (!enregistre) notFound();

  const vue = modeles.find((modele) => modele.slug === slug);
  const configuration = vue ? defaultConfiguration(catalogue, vue) : null;

  return (
    <div className="mx-auto max-w-[84rem]">
      <nav aria-label="Fil d'Ariane" className="mb-4">
        <Link
          href="/atelier/catalogue"
          className="type-mono link-underline text-fg-soft hover:text-accent"
        >
          ← Catalogue
        </Link>
      </nav>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-mono flex flex-wrap items-center gap-3 text-fg-soft">
            {enregistre.slug}
            {enregistre.isSample && <SamplePill />}
            {!enregistre.isPublished && <Pill ton="alerte">Hors ligne</Pill>}
          </p>
          <h1 className="type-display-2 mt-2">{enregistre.name}</h1>
          <p className="type-body mt-2 text-fg-soft">{enregistre.tagline}</p>
        </div>
        <Link href={`/collection/${slug}`} className="type-ui lien-atelier link-underline text-accent">
          Voir la fiche publique
        </Link>
      </header>

      <nav aria-label="Modèles" className="mb-6 flex flex-wrap gap-2">
        {modeles.map((autre) => (
          <Link
            key={autre.slug}
            href={`/atelier/catalogue/modeles/${autre.slug}`}
            aria-current={autre.slug === slug ? "page" : undefined}
            className={
              autre.slug === slug
                ? "type-ui flex min-h-11 items-center rounded-field border border-accent bg-accent px-4 text-on-accent"
                : "type-ui flex min-h-11 items-center rounded-field border border-rule px-4 text-fg hover:border-accent-decor hover:text-accent"
            }
          >
            {autre.name}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] [&>div]:min-w-0">
        <div className="flex flex-col gap-4">
          {configuration && (
            <Panneau titre="Configuration signature" aide="Ce que le visiteur voit en arrivant.">
              <div className="border border-rule bg-bg-alt p-3">
                <WatchSvg
                  id={`modele-${enregistre.id}`}
                  render={configuration.render}
                  label={`${enregistre.name}, configuration de base`}
                  className="h-auto w-full"
                />
              </div>
              <dl className="mt-5 flex flex-col gap-2">
                <Ligne terme="Prix affiché" valeur={formatPrice(configuration.price.totalCents)} fort />
                <Ligne terme="Coût des pièces" valeur={formatPrice(configuration.partsCostCents)} />
                <Ligne
                  terme="Marge"
                  valeur={formatPrice(configuration.price.totalCents - configuration.partsCostCents)}
                  fort
                />
                <Ligne terme="Délai annoncé" valeur={`${configuration.leadTime.days} jours`} />
              </dl>
            </Panneau>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panneau titre="Fiche" aide="Textes, cotes et prix de départ de cette ligne.">
            <form action={enregistrerModele} className="flex flex-col gap-4">
              <input type="hidden" name="modele" value={enregistre.slug} />

              <div className="flex flex-wrap gap-4">
                <Champ label="Nom" className="min-w-[12rem] flex-1">
                  <Saisie name="nom" defaultValue={enregistre.name} />
                </Champ>
                <Champ label="Prix de départ (€)" className="w-44">
                  <Saisie
                    name="prix"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={(enregistre.basePriceCents / 100).toFixed(2)}
                  />
                </Champ>
                <Champ label="Assemblage (jours)" className="w-40">
                  <Saisie name="assemblage" type="number" step="1" min="1" defaultValue={enregistre.assemblyDays} />
                </Champ>
              </div>

              <Champ label="Accroche" aide="Une ligne, sous le nom.">
                <Saisie name="accroche" defaultValue={enregistre.tagline} />
              </Champ>
              <Champ label="Présentation">
                <Zone name="resume" rows={4} defaultValue={enregistre.summary} />
              </Champ>

              <fieldset className="border-t border-rule pt-5">
                <legend className="type-ui pr-3 text-fg">Cotes</legend>
                <div className="mt-4 flex flex-wrap gap-4">
                  <Champ label="Diamètre (mm)" className="w-36">
                    <Saisie name="diametre" type="number" step="1" defaultValue={enregistre.diameterMm} />
                  </Champ>
                  <Champ label="Corne à corne (mm)" className="w-44">
                    <Saisie name="corne" type="number" step="0.1" defaultValue={enregistre.lugToLugMm} />
                  </Champ>
                  <Champ label="Épaisseur (mm)" className="w-40">
                    <Saisie name="epaisseur" type="number" step="0.1" defaultValue={enregistre.thicknessMm} />
                  </Champ>
                  <Champ label="Entrecorne (mm)" className="w-40">
                    <Saisie name="entrecorne" type="number" step="1" defaultValue={enregistre.lugWidthMm} />
                  </Champ>
                  <Champ label="Étanchéité (m)" className="w-40">
                    <Saisie name="etancheite" type="number" step="10" defaultValue={enregistre.waterResistM} />
                  </Champ>
                </div>
                <Champ label="Note sur le mouvement" className="mt-4">
                  <Saisie name="mouvement" defaultValue={enregistre.movementNote} />
                </Champ>
              </fieldset>

              <fieldset className="border-t border-rule pt-5">
                <legend className="type-ui pr-3 text-fg">Référencement</legend>
                <div className="mt-4 flex flex-col gap-4">
                  <Champ label="Titre de la page" aide="Vide : le nom du modèle est utilisé.">
                    <Saisie name="seoTitre" defaultValue={enregistre.seoTitle ?? ""} />
                  </Champ>
                  <Champ label="Description">
                    <Zone name="seoDescription" rows={2} defaultValue={enregistre.seoDescription ?? ""} />
                  </Champ>
                </div>
              </fieldset>

              <label className="flex min-h-11 items-center gap-3 border-t border-rule pt-5">
                <input
                  type="checkbox"
                  name="publie"
                  defaultChecked={enregistre.isPublished}
                  className="size-6 accent-[var(--accent)]"
                />
                <span className="type-ui text-fg">Visible sur le site</span>
              </label>

              <Bouton>Enregistrer le modèle</Bouton>
            </form>
          </Panneau>

          <Panneau
            titre="Diamètres proposés"
            aide="Les autres tailles sont exclues du configurateur pour cette ligne. Modifiable au prochain chantier."
          >
            <p className="type-mono text-fg">{enregistre.availableSizes.join(" · ")} mm</p>
          </Panneau>
        </div>
      </div>
    </div>
  );
}

function Ligne({ terme, valeur, fort }: { terme: string; valeur: string; fort?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="type-caption text-fg-soft">{terme}</dt>
      <dd className={fort ? "type-ui text-fg" : "type-caption text-fg"} data-numeric>
        {valeur}
      </dd>
    </div>
  );
}
