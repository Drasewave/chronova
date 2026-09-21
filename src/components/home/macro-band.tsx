import { Reveal } from "@/components/motion/reveal";
import { WatchSvg } from "@/watch/watch-svg";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { WatchModelView } from "@/lib/data/models";

/**
 * Trois gros plans de la pièce du héros. Le rendu est vectoriel : recadré sur
 * un index ou sur la couronne, il reste net — c'est la photographie macro d'un
 * atelier qui n'a pas encore de photographe. Chaque légende dit un fait de
 * montage, jamais un slogan.
 */
const PLANS = [
  {
    cle: "cadran",
    crop: "500 250 330 330",
    titre: "Index appliqués",
    texte: "Chaque index est un bloc de métal biseauté, posé à la main ; le luminova est déposé dans sa cuvette.",
  },
  {
    cle: "lunette",
    crop: "235 165 330 330",
    titre: "Lunette et réhaut",
    texte: "Cent vingt crans sur la lunette de plongée, un insert gravé, et un réhaut poli qui retombe sur le cadran.",
  },
  {
    cle: "couronne",
    crop: "575 340 320 320",
    titre: "Couronne vissée",
    texte: "Vissée contre ses épaulements avant tout contact avec l'eau : c'est elle qui tient l'étanchéité annoncée.",
  },
] as const;

export function MacroBand({ catalogue, modele }: { catalogue: Catalogue; modele: WatchModelView }) {
  const { render } = defaultConfiguration(catalogue, modele);

  return (
    <section
      data-theme="night"
      className="bg-bg text-fg"
      style={{ paddingInline: "var(--gutter)", paddingBlock: "var(--section-y)" }}
      aria-labelledby="titre-macro"
    >
      <div className="mx-auto max-w-wide">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="titre-macro" className="type-display-2 max-w-[16ch]">
            De près, tout se voit.
          </h2>
          <p className="type-lead measure text-fg-soft lg:justify-self-end">
            Ce que vous composez à l&apos;écran est dessiné pièce par pièce, comme la montre sera
            montée. Approchez-vous : ce sont les mêmes index, la même lunette, la même couronne.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3 lg:mt-20 lg:gap-8">
          {PLANS.map((plan, index) => (
            <Reveal as="li" key={plan.cle} delay={index * 90}>
              <figure>
                <div className="overflow-hidden rounded-card bg-[#05080c]">
                  <WatchSvg
                    id={`macro-${plan.cle}`}
                    render={render}
                    crop={plan.crop}
                    label={`${modele.name}, gros plan : ${plan.titre.toLowerCase()}`}
                    className="block aspect-square h-auto w-full transition-transform duration-[1200ms] ease-atelier hover:scale-[1.06]"
                  />
                </div>
                <figcaption className="mt-5">
                  <h3 className="type-title-2">{plan.titre}</h3>
                  <p className="type-body mt-2 max-w-[38ch] text-fg-soft">{plan.texte}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
