import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeader } from "@/components/ui/section";
import { Pill, SamplePill } from "@/components/ui/pill";
import { WatchSvg } from "@/watch/watch-svg";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Composer ma montre",
  description:
    "Choisissez une base mécanique, puis composez votre montre : boîtier, cadran, aiguilles, lunette, couronne, bracelet, verre, mouvement et fond.",
  alternates: { canonical: "/composer" },
};

/** Le catalogue peut changer depuis le CRM : on rafraîchit la page régulièrement. */
export const revalidate = 300;

export default async function ChoixDuModele() {
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);

  return (
    <Section fond="papier">
      <SectionHeader
        surtitre="Étape zéro"
        titre="Par quelle base commencer ?"
        intro="Le modèle fixe le boîtier, le diamètre et l'étanchéité — tout ce qui ne se change plus ensuite. Le reste se compose à l'étape suivante, et rien n'est définitif tant que la commande n'est pas passée."
      />

      <ul className="mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
        {modeles.map((modele) => {
          const configuration = defaultConfiguration(catalogue, modele);
          return (
            <li key={modele.slug} className="carte-montre group">
              <Link
                href={`/composer/${modele.slug}`}
                className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus)]"
              >
                <div className="overflow-hidden rounded-card border border-rule bg-bg-alt p-5 transition-colors duration-300 ease-atelier group-hover:border-accent-decor">
                  <div className="transition-transform duration-[450ms] ease-atelier group-hover:rotate-3">
                    <WatchSvg
                      id={`composer-${modele.slug}`}
                      render={configuration.render}
                      detail="compact"
                      label={`${modele.name}, ${modele.styleLabel.toLowerCase()}`}
                      className="h-auto w-full"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-baseline justify-between gap-3">
                  <h2 className="type-title-2 text-fg">{modele.name}</h2>
                  <Pill>{modele.styleLabel}</Pill>
                </div>
                <p className="type-body mt-2 text-fg-soft">{modele.tagline}</p>
                <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
                  <div>
                    <dt className="sr-only">Diamètres proposés</dt>
                    <dd className="type-mono text-fg-soft">{modele.availableSizes.join(" / ")} mm</dd>
                  </div>
                  <div>
                    <dt className="sr-only">Étanchéité</dt>
                    <dd className="type-mono text-fg-soft">{modele.waterResistM} m</dd>
                  </div>
                </dl>
                <p className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="type-ui text-fg" data-numeric>
                    À partir de {formatPrice(modele.basePriceCents)}
                  </span>
                  <SamplePill />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
