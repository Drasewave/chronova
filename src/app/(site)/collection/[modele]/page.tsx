import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Pill, SamplePill } from "@/components/ui/pill";
import { PhotoPlaceholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import { getCatalogue, getModel, getModels } from "@/lib/data/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const modeles = await getModels();
  return modeles.map((modele) => ({ modele: modele.slug }));
}

export async function generateMetadata(props: PageProps<"/collection/[modele]">): Promise<Metadata> {
  const { modele } = await props.params;
  const model = await getModel(modele);
  if (!model) return { title: "Modèle introuvable" };

  return {
    title: model.name,
    description: `${model.tagline} ${model.summary}`.slice(0, 300),
    alternates: { canonical: `/collection/${model.slug}` },
    openGraph: { title: `${model.name} · Chronova`, description: model.tagline, type: "website" },
  };
}

export default async function FicheModele(props: PageProps<"/collection/[modele]">) {
  const { modele } = await props.params;
  const [model, catalogue] = await Promise.all([getModel(modele), getCatalogue()]);
  if (!model) notFound();

  const base = defaultConfiguration(catalogue, model);
  const variante = altConfiguration(catalogue, model);

  /**
   * Données structurées `Product`. Le prix annoncé est celui de la configuration
   * de départ : c'est le « à partir de » affiché sur la page, pas un prix fixe.
   */
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: model.name,
    description: model.tagline,
    brand: { "@type": "Brand", name: "Chronova" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: (base.price.totalCents / 100).toFixed(2),
      availability: "https://schema.org/MadeToOrder",
      url: `/collection/${model.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />

      <Section fond="papier" compact>
        <nav aria-label="Fil d'Ariane">
          <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
            <li>
              <Link href="/collection" className="link-underline hover:text-accent">
                Collection
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li className="text-fg">{model.name}</li>
          </ol>
        </nav>

        <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <InteractiveWatch
            id="fiche"
            render={base.render}
            label={`${model.name}, configuration de départ`}
            className="mx-auto w-[min(88%,32rem)] lg:w-full"
          />

          <div>
            <Pill>{model.styleLabel}</Pill>
            <h1 className="type-display-2 mt-5">{model.name}</h1>
            <p className="type-lead measure mt-5 text-fg-soft">{model.tagline}</p>
            <p className="type-body measure mt-6 text-fg-soft">{model.summary}</p>

            <p className="mt-8 flex flex-wrap items-baseline gap-4">
              <span className="type-title-1 text-fg" data-numeric>
                À partir de {formatPrice(model.basePriceCents)}
              </span>
              <SamplePill />
            </p>
            <p className="type-caption mt-2 text-fg-soft">
              Configuration de départ à {formatPrice(base.price.totalCents)} · assemblage estimé{" "}
              {base.leadTime.days} jours.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href={`/composer/${model.slug}`}>Composer cette montre</ButtonLink>
              <ButtonLink href="/collection" variant="discret">
                Revoir la collection
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section fond="alterne">
        <SectionHeader
          surtitre="Caractéristiques"
          titre="Ce que le boîtier fixe"
          intro="Ces valeurs ne se configurent pas : elles définissent le modèle. Tout le reste se choisit."
        />

        <dl className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          <Spec terme="Diamètre" valeur={`${model.diameterMm} mm`} detail={`Aussi en ${model.availableSizes.filter((t) => Number(t) !== model.diameterMm).join(" et ") || "une seule taille"}`} />
          <Spec terme="Corne à corne" valeur={`${model.lugToLugMm} mm`} detail="Ce qui décide du port au poignet" />
          <Spec terme="Épaisseur" valeur={`${model.thicknessMm} mm`} detail="Verre compris" />
          <Spec terme="Entrecorne" valeur={`${model.lugWidthMm} mm`} detail="Largeur du bracelet" />
          <Spec terme="Étanchéité" valeur={`${model.waterResistM} m`} detail="Pression statique, norme ISO 22810" />
          <Spec terme="Calibre de départ" valeur={base.render.movement} detail={model.movementNote} />
          <Spec terme="Verre" valeur={base.render.crystal === "bombe" ? "Saphir bombé" : "Saphir plat"} detail="Traitement antireflet en option" />
          <Spec terme="Assemblage" valeur={`${model.assemblyDays} jours`} detail="Délai de base, hors options" />
        </dl>
      </Section>

      <Section fond="papier">
        <SectionHeader
          surtitre="Deux exemples"
          titre="Le même boîtier, deux caractères"
          intro="Ces deux montres sortent du même boîtier. Seules changent des pièces que vous choisissez."
          action={<ButtonLink href={`/composer/${model.slug}`}>Composer la mienne</ButtonLink>}
        />

        <div className="mt-14 grid gap-12 md:grid-cols-2">
          {[base, variante].map((configuration, index) => (
            <Reveal key={index} delay={index * 60}>
              <div className="rounded-card border border-rule bg-bg-alt p-6">
                <WatchSvg
                  id={`variante-${model.slug}-${index}`}
                  render={configuration.render}
                  label={`${model.name}, ${index === 0 ? "configuration de départ" : "second coloris"}`}
                  className="h-auto w-full"
                />
              </div>
              <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {configuration.summary
                  .filter((ligne) =>
                    ["cadran-teinte", "aiguilles-forme", "lunette-style", "bracelet-type"].includes(
                      ligne.groupKey,
                    ),
                  )
                  .map((ligne) => (
                    <div key={ligne.groupKey} className="flex gap-2">
                      <dt className="type-mono text-fg-soft">{ligne.groupLabel}</dt>
                      <dd className="type-mono text-fg">{ligne.value}</dd>
                    </div>
                  ))}
              </dl>
              <p className="type-ui mt-4 text-fg" data-numeric>
                {formatPrice(configuration.price.totalCents)}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section fond="alterne">
        <div className="grid gap-12 lg:grid-cols-2">
          <PhotoPlaceholder
            description={`${model.name} au poignet, lumière naturelle, manchette de chemise`}
            ratio="4 / 5"
          />
          <PhotoPlaceholder
            description={`Détail du cadran de la ${model.name} en lumière rasante`}
            ratio="4 / 5"
          />
        </div>
      </Section>
    </>
  );
}

function Spec({ terme, valeur, detail }: { terme: string; valeur: string; detail: string }) {
  return (
    <div className="bg-bg-alt p-6">
      <dt className="type-mono text-fg-soft">{terme}</dt>
      <dd>
        <span className="type-title-2 mt-3 block text-fg">{valeur}</span>
        <span className="type-caption mt-1.5 block text-fg-soft">{detail}</span>
      </dd>
    </div>
  );
}
