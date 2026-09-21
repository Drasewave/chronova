import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GalerieModele, type VueGalerie } from "@/components/collection/galerie-modele";
import { RappelComposer } from "@/components/collection/rappel-composer";
import { ModelCard } from "@/components/home/model-card";
import { ButtonLink } from "@/components/ui/button";
import { IconChevron, IconFleche } from "@/components/ui/icons";
import { SamplePill } from "@/components/ui/pill";
import { PhotoPlaceholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { ViewTransition } from "react";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import { cheminGamme, gammesAvecModeles } from "@/lib/content/gammes";
import { getCatalogue, getModel, getModels } from "@/lib/data/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

/**
 * Les pièces comparées entre les deux exemples, nommées par la pièce et non par
 * le libellé du groupe (« Teinte », « Forme », « Style » ne disent pas de quoi).
 */
const PIECES_COMPAREES: Record<string, string> = {
  "cadran-teinte": "Cadran",
  "aiguilles-forme": "Aiguilles",
  "lunette-style": "Lunette",
  "bracelet-type": "Bracelet",
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

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
      url: `${SITE}/collection/${model.slug}`,
      seller: { "@id": `${SITE}/#atelier` },
    },
  };

  const gamme = gammesAvecModeles(await getModels()).find((candidate) => candidate.style === model.style);
  const voisins = (gamme?.modeles ?? []).filter((voisin) => voisin.slug !== model.slug);
  const hrefGamme = cheminGamme(model.style);

  // Quatre vues de la même pièce : le rendu est vectoriel et paramétrique, on
  // peut donc tourner autour de la configuration de départ et s'en approcher.
  const PLANS = [
    { cle: "face", titre: "Face", vue: "face", crop: undefined, libelle: "vue de face" },
    { cle: "profil", titre: "Profil", vue: "profil", crop: "190 170 620 620", libelle: "vue de profil" },
    { cle: "dos", titre: "Dos", vue: "dos", crop: "150 150 700 700", libelle: "vue du fond" },
    { cle: "cadran", titre: "Cadran", vue: "face", crop: "270 270 460 460", libelle: "gros plan sur le cadran" },
  ] as const;

  const vues: VueGalerie[] = PLANS.map((plan) => ({
    cle: plan.cle,
    titre: plan.titre,
    grande:
      plan.cle === "face" ? (
        <ViewTransition name={`montre-${model.slug}`} share="morph" default="none">
          <InteractiveWatch
            id="fiche"
            render={base.render}
            label={`${model.name}, configuration de départ, ${plan.libelle}`}
            className="h-full w-full"
            svgClassName="block h-full w-full"
          />
        </ViewTransition>
      ) : (
        <WatchSvg
          id={`galerie-${plan.cle}`}
          render={base.render}
          view={plan.vue}
          crop={plan.crop}
          label={`${model.name}, ${plan.libelle}`}
          className="block h-full w-full"
        />
      ),
    vignette: (
      <WatchSvg
        id={`vignette-${plan.cle}`}
        render={base.render}
        view={plan.vue}
        crop={plan.crop}
        detail="compact"
        label=""
        className="block h-full w-full"
      />
    ),
  }));

  const ligne = (groupKey: string) => base.summary.find((entree) => entree.groupKey === groupKey)?.value;
  const autresTailles = model.availableSizes.filter((taille) => Number(taille) !== model.diameterMm);

  /**
   * Fiche technique. Deux sources seulement : les cotes du modèle, et les
   * libellés de sa configuration de départ tels que le catalogue les écrit.
   * Une ligne sans valeur n'est pas affichée ; rien n'est complété au jugé.
   */
  const FICHE: { titre: string; lignes: { terme: string; valeur: string | undefined; detail?: string }[] }[] = [
    {
      titre: "Mouvement",
      lignes: [
        { terme: "Calibre", valeur: ligne("mouvement") ?? base.render.movement, detail: model.movementNote },
        { terme: "Aiguille 24 heures", valeur: ligne("aiguille-24h") },
        { terme: "Compteurs", valeur: ligne("compteurs") },
        { terme: "Guichet de date", valeur: ligne("date") },
      ],
    },
    {
      titre: "Boîtier",
      lignes: [
        { terme: "Finition", valeur: ligne("finition") },
        { terme: "Lunette", valeur: ligne("lunette-style") },
        { terme: "Insert", valeur: [ligne("insert-matiere"), ligne("insert-teinte")].filter(Boolean).join(", ") || undefined },
        { terme: "Couronne", valeur: [ligne("couronne-vissee"), ligne("couronne-signature")].filter(Boolean).join(", ") || undefined },
        { terme: "Fond", valeur: ligne("fond-type") },
      ],
    },
    {
      titre: "Verre et étanchéité",
      lignes: [
        { terme: "Verre", valeur: ligne("verre-forme") },
        { terme: "Antireflet", valeur: ligne("antireflet") },
        { terme: "Étanchéité", valeur: `${model.waterResistM} m`, detail: "Pression statique, norme ISO 22810." },
      ],
    },
    {
      titre: "Bracelet",
      lignes: [
        { terme: "Type", valeur: ligne("bracelet-type") },
        { terme: "Teinte", valeur: ligne("bracelet-teinte") },
        { terme: "Entrecorne", valeur: `${model.lugWidthMm} mm`, detail: "Largeur du bracelet au boîtier." },
      ],
    },
    {
      titre: "Dimensions",
      lignes: [
        {
          terme: "Diamètre",
          valeur: `${model.diameterMm} mm`,
          detail: autresTailles.length > 0 ? `Aussi proposé en ${autresTailles.join(" et ")} mm.` : undefined,
        },
        { terme: "Corne à corne", valeur: `${model.lugToLugMm} mm`, detail: "La cote à comparer à votre poignet." },
        { terme: "Épaisseur", valeur: `${model.thicknessMm} mm`, detail: "Verre compris." },
        { terme: "Entrecorne", valeur: `${model.lugWidthMm} mm` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />

      <Section fond="papier" compact>
        <div className="grid items-start gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <GalerieModele vues={vues} nom={model.name} />

          <div className="lg:sticky lg:top-28">
            <nav aria-label="Fil d'Ariane">
              <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
                <li>
                  <Link href="/collection" className="link-underline hover:text-gold">
                    Collection
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  <Link href={hrefGamme} className="link-underline hover:text-gold">
                    {model.styleLabel}
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="text-fg" aria-current="page">
                  {model.name}
                </li>
              </ol>
            </nav>

            <h1 className="type-display-2 mt-6">{model.name}</h1>
            <p className="type-mono mt-2 text-fg-soft">
              <span className="sr-only">Référence </span>
              {model.slug.toUpperCase()}
            </p>
            <p className="type-lead measure mt-5 text-fg">{model.tagline}</p>
            <p className="type-body measure mt-4 text-fg-soft">{model.summary}</p>

            <p className="mt-7 flex flex-wrap items-baseline gap-4 border-t border-rule pt-6">
              <span className="type-title-1 text-fg" data-numeric>
                À partir de {formatPrice(model.basePriceCents)}
              </span>
              <SamplePill />
            </p>
            <p className="type-caption mt-2 text-fg-soft">
              Configuration de départ à {formatPrice(base.price.totalCents)} · assemblage estimé{" "}
              {base.leadTime.days} jours.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
              <ButtonLink href={`/composer/${model.slug}`}>
                Composer cette montre
                <IconFleche className="fleche-glisse" />
              </ButtonLink>
              <ButtonLink href={hrefGamme} variant="discret">
                Voir la gamme {model.styleLabel}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <Section fond="alterne">
        <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <SectionHeader
            className="md:flex-col md:items-start"
            titre="Fiche technique"
            intro="Les dimensions et l'étanchéité sont propres au modèle. Le reste décrit la configuration de départ : vous le modifiez dans le configurateur."
          />

          <div className="border-b border-rule">
            {FICHE.map((bloc, index) => {
              const lignes = bloc.lignes.filter((entree) => entree.valeur);
              if (lignes.length === 0) return null;
              return (
                <details key={bloc.titre} open={index === 0} className="group border-t border-rule">
                  <summary className="type-title-2 flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-fg transition-colors duration-200 hover:text-gold [&::-webkit-details-marker]:hidden">
                    {bloc.titre}
                    <IconChevron className="shrink-0 text-gold transition-transform duration-200 ease-atelier group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <dl className="grid gap-x-10 pb-5 sm:grid-cols-2">
                    {lignes.map((entree) => (
                      <div key={entree.terme} className="border-t border-rule py-3.5">
                        <dt className="type-mono text-fg-soft">{entree.terme}</dt>
                        <dd className="mt-1.5">
                          <span className="type-body block text-fg" data-numeric>
                            {entree.valeur}
                          </span>
                          {entree.detail && (
                            <span className="type-caption mt-1 block text-fg-soft">{entree.detail}</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              );
            })}
          </div>
        </div>
      </Section>

      <Section fond="papier">
        <SectionHeader
          titre="Deux montres sur le même boîtier"
          intro="Ces deux montres partent du même boîtier. Les pièces qui changent de l'une à l'autre sont celles que vous choisissez."
          action={<ButtonLink href={`/composer/${model.slug}`}>Composer la mienne</ButtonLink>}
        />

        <div className="mt-10 grid gap-x-5 gap-y-10 md:grid-cols-2">
          {[base, variante].map((configuration, index) => (
            <Reveal key={index} delay={index * 60}>
              <div className="cadre-montre overflow-hidden px-6 py-4">
                <WatchSvg
                  id={`variante-${model.slug}-${index}`}
                  render={configuration.render}
                  label={`${model.name}, ${index === 0 ? "configuration de départ" : "second coloris"}`}
                  className="mx-auto h-auto w-full max-w-[30rem]"
                />
              </div>
              <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {configuration.summary
                  .filter((entree) => entree.groupKey in PIECES_COMPAREES)
                  .map((entree) => (
                    <div key={entree.groupKey} className="flex gap-2">
                      <dt className="type-mono text-fg-soft">{PIECES_COMPAREES[entree.groupKey]}</dt>
                      <dd className="type-mono text-fg">{entree.value}</dd>
                    </div>
                  ))}
              </dl>
              <p className="type-ui mt-3 text-fg" data-numeric>
                {formatPrice(configuration.price.totalCents)}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section fond="alterne">
        <div className="grid gap-5 sm:grid-cols-2">
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

      {voisins.length > 0 && (
        <Section fond="papier">
          <SectionHeader
            titre="Autres modèles de la gamme"
            action={
              <ButtonLink href={hrefGamme} variant="discret">
                Voir la gamme {model.styleLabel}
              </ButtonLink>
            }
          />
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {voisins.map((voisin) => (
              <ModelCard key={voisin.slug} catalogue={catalogue} modele={voisin} />
            ))}
          </div>
        </Section>
      )}

      <RappelComposer titre="Cette montre se personnalise" modele={{ slug: model.slug }} />
    </>
  );
}
