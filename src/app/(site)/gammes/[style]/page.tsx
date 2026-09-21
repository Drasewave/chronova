import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TuileGamme } from "@/components/collection/bloc-gamme";
import { RappelComposer } from "@/components/collection/rappel-composer";
import { ModelCard } from "@/components/home/model-card";
import { ButtonLink } from "@/components/ui/button";
import { SamplePill } from "@/components/ui/pill";
import { Section, SectionHeader } from "@/components/ui/section";
import { InteractiveWatch } from "@/watch/interactive-watch";
import { WatchSvg } from "@/watch/watch-svg";
import { altConfiguration, defaultConfiguration } from "@/lib/configurateur/configuration";
import { estGamme, etendue, gammesAvecModeles } from "@/lib/content/gammes";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  const gammes = gammesAvecModeles(await getModels());
  return gammes.map((gamme) => ({ style: gamme.style }));
}

async function chargerGamme(style: string) {
  if (!estGamme(style)) return null;
  const gammes = gammesAvecModeles(await getModels());
  const gamme = gammes.find((candidate) => candidate.style === style);
  return gamme ? { gamme, autres: gammes.filter((candidate) => candidate.style !== style) } : null;
}

export async function generateMetadata(props: PageProps<"/gammes/[style]">): Promise<Metadata> {
  const { style } = await props.params;
  const trouve = await chargerGamme(style);
  if (!trouve) return { title: "Gamme introuvable" };

  const { gamme } = trouve;
  return {
    title: `Gamme ${gamme.nom}`,
    description: `${gamme.contenu.phrase} ${gamme.contenu.presentation[0] ?? ""}`.trim().slice(0, 300),
    alternates: { canonical: gamme.href },
    openGraph: { title: `Gamme ${gamme.nom} · Chronova`, description: gamme.contenu.phrase, type: "website" },
  };
}

export default async function PageGamme(props: PageProps<"/gammes/[style]">) {
  const { style } = await props.params;
  const [trouve, catalogue] = await Promise.all([chargerGamme(style), getCatalogue()]);
  if (!trouve) notFound();

  const { gamme, autres } = trouve;
  const { phare } = gamme;
  const base = defaultConfiguration(catalogue, phare);
  const variante = altConfiguration(catalogue, phare);

  const reperes = [
    { terme: "Modèles", valeur: String(gamme.modeles.length) },
    { terme: "Diamètres", valeur: etendue(gamme.diametres, "mm") },
    { terme: "Étanchéité", valeur: etendue(gamme.etancheites, "m") },
  ];

  return (
    <>
      <section
        data-theme="night"
        className="scene-nuit overflow-hidden text-fg"
        style={{ paddingInline: "var(--gutter)", paddingBlock: "clamp(32px, 4vw, 64px)" }}
        aria-labelledby="titre-gamme"
      >
        {/* Ordre du DOM = ordre de lecture sur mobile : le nom, la montre, puis le
            texte. Sur grand écran la montre prend la colonne de droite, sur la
            hauteur des deux blocs de texte. */}
        <div className="mx-auto grid max-w-wide gap-x-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="lg:self-end">
            <nav aria-label="Fil d'Ariane">
              <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
                <li>
                  <Link href="/collection" className="link-underline hover:text-gold">
                    Collection
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li className="text-fg" aria-current="page">
                  {gamme.nom}
                </li>
              </ol>
            </nav>

            <h1 id="titre-gamme" className="type-display-1 mt-5">
              {gamme.nom}
            </h1>
          </div>

          <figure className="mx-auto w-full max-w-[19rem] sm:max-w-[24rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-[34rem] lg:self-center">
            <InteractiveWatch
              id={`phare-${gamme.style}`}
              render={base.render}
              label={`${phare.name}, configuration de départ`}
            />
            <figcaption className="type-mono -mt-2 text-center text-fg-soft">
              <Link href={`/collection/${phare.slug}`} className="link-underline inline-flex min-h-11 items-center hover:text-gold">
                {phare.name}
              </Link>
            </figcaption>
          </figure>

          <div className="lg:self-start">
            <p className="type-lead measure mt-4 max-w-[52ch] text-fg-soft lg:mt-6">
              {gamme.contenu.presentation.join(" ")}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-rule pt-6">
              {reperes.map((repere) => (
                <div key={repere.terme}>
                  <dt className="type-mono text-fg-soft">{repere.terme}</dt>
                  <dd className="type-title-2 mt-1.5 text-fg" data-numeric>
                    {repere.valeur}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="type-mono text-fg-soft">À partir de</dt>
                <dd className="type-title-2 mt-1.5 flex flex-wrap items-center gap-3 text-fg" data-numeric>
                  {formatPrice(gamme.prixMinCents)}
                  <SamplePill />
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink href="#modeles">
                Voir {gamme.modeles.length > 1 ? `les ${gamme.modeles.length} modèles` : "le modèle"}
              </ButtonLink>
              <ButtonLink href={`/composer/${phare.slug}`} variant="discret">
                Composer la montre présentée
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Section fond="papier" id="modeles" className="scroll-mt-20">
        <SectionHeader
          titre={`Les modèles ${gamme.nom}`}
          intro="Chaque modèle est un point de départ : son boîtier est fixé, tout le reste se compose."
        />
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gamme.modeles.map((modele, index) => (
            <ModelCard key={modele.slug} catalogue={catalogue} modele={modele} priorite={index === 0} />
          ))}
        </div>
      </Section>

      <RappelComposer
        exemples={
          <ul className="grid grid-cols-2 gap-5">
            {[base, variante].map((configuration, index) => (
              <li key={index}>
                <div className="cadre-montre overflow-hidden">
                  <WatchSvg
                    id={`composer-${gamme.style}-${index}`}
                    render={configuration.render}
                    detail="compact"
                    label={`${phare.name}, ${index === 0 ? "configuration de départ" : "autre composition du même boîtier"}`}
                    className="h-auto w-full"
                  />
                </div>
                <p className="type-mono mt-3 text-fg-soft">
                  {index === 0 ? "Configuration de départ" : "Même boîtier, autre composition"}
                </p>
              </li>
            ))}
          </ul>
        }
      />

      {autres.length > 0 && (
        <Section fond="papier">
          <SectionHeader
            titre="Les autres gammes"
            action={
              <ButtonLink href="/collection#tous-les-modeles" variant="discret">
                Tous les modèles
              </ButtonLink>
            }
          />
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {autres.map((autre) => (
              <li key={autre.style}>
                <TuileGamme catalogue={catalogue} gamme={autre} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
