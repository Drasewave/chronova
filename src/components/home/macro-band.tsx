import { Reveal } from "@/components/motion/reveal";
import { MontreDifferee } from "@/components/ui/montre-differee";
import { cadrageCouronne, cadrageIndex, cadrageLunette } from "@/components/home/cadrages";
import { deLa } from "@/lib/content/articles";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import type { Catalogue } from "@/lib/configurateur/catalogue";
import type { WatchModelView } from "@/lib/data/models";
import type { WatchRender } from "@/watch/types";

/**
 * Trois gros plans de la pièce vedette. Le rendu est vectoriel : recadré sur
 * un index ou sur la couronne, il reste net. C'est la photographie macro d'un
 * atelier qui n'a pas encore de photographe.
 *
 * Rien n'est écrit en dur : la fenêtre de chaque plan est calculée depuis la
 * géométrie de la montre (`cadrages.ts`), et la légende décrit ce que cette
 * montre porte réellement (index ronds ou bâtons, lunette tournante ou fixe,
 * couronne à 3 h ou à 4 h). Chaque légende dit un fait de montage.
 */
interface Plan {
  cle: string;
  crop: string;
  titre: string;
  texte: string;
}

function plans(render: WatchRender, vissee: boolean): Plan[] {
  const coussin = render.caseShape === "coussin";
  const a4h = render.crownAt === 4;

  const index: Pick<Plan, "titre" | "texte"> =
    render.indexStyle === "plongee"
      ? {
          titre: "Index de plongée",
          texte: render.lume
            ? "Des pastilles rondes cerclées de métal, que je pose une à une sur le cadran. Le luminova remplit chaque cuvette, et la minuterie court sur le réhaut."
            : "Des pastilles rondes cerclées de métal, que je pose une à une sur le cadran. La minuterie court sur le réhaut.",
        }
      : render.indexStyle === "batons"
        ? {
            titre: "Index appliqués",
            texte: "Chaque index est un bâton de métal facetté, rapporté sur le cadran et posé à la main.",
          }
        : {
            titre: "Chiffres et index",
            texte: "Les chiffres et les index sont rapportés sur le cadran, puis alignés un à un sur la minuterie.",
          };

  const lunette: Pick<Plan, "titre" | "texte"> =
    render.bezelStyle === "plongee"
      ? {
          titre: "Lunette et réhaut",
          texte: `La lunette de plongée compte cent vingt crans et porte un large insert ${render.insertMaterial === "aluminium" ? "en aluminium" : "en céramique"} gravé. Le réhaut descend jusqu'au cadran.`,
        }
      : render.bezelStyle === "gmt"
        ? {
            titre: "Lunette 24 heures",
            texte: "La lunette porte l'échelle des vingt-quatre heures, sur laquelle se lit le second fuseau. Le réhaut descend jusqu'au cadran.",
          }
        : render.bezelStyle === "tachymetre"
          ? {
              titre: "Lunette tachymétrique",
              texte: "La lunette est fixe et porte une échelle de vitesse gravée. Le réhaut descend jusqu'au cadran.",
            }
          : {
              titre: "Lunette et réhaut",
              texte: "La lunette est fixe. Sous le verre, le réhaut poli descend jusqu'au cadran.",
            };

  const conseil = vissee
    ? "Vissez-la à fond avant tout contact avec l'eau : l'étanchéité annoncée en dépend."
    : "Repoussez-la à fond avant tout contact avec l'eau : l'étanchéité annoncée en dépend.";
  const couronne: Pick<Plan, "titre" | "texte"> = {
    titre: vissee ? "Couronne vissée" : "Couronne",
    texte: a4h
      ? `Elle est déportée à 4 h, où elle ne marque pas le dos de la main${coussin ? ", et le flanc du boîtier l'enveloppe à demi" : ", entre deux épaulements venus de matière avec le flanc"}. ${conseil}`
      : conseil,
  };

  return [
    { cle: "cadran", crop: cadrageIndex(render), ...index },
    { cle: "lunette", crop: cadrageLunette(render), ...lunette },
    { cle: "couronne", crop: cadrageCouronne(render), ...couronne },
  ];
}

export function MacroBand({ catalogue, modele }: { catalogue: Catalogue; modele: WatchModelView }) {
  const { render } = defaultConfiguration(catalogue, modele);
  // Le rendu ne dit pas si la couronne est vissée : c'est la configuration qui le sait.
  const vissee = modele.defaultSelections["couronne-vissee"] === "vissee";

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
            Trois détails vus de près
          </h2>
          <p className="type-lead measure text-fg-soft lg:justify-self-end">
            Le rendu à l&apos;écran est dessiné pièce par pièce, dans l&apos;ordre du montage. Vous
            retrouvez ici, en gros plan, les index, la lunette et la couronne {deLa(modele.name)}.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3 lg:mt-20 lg:gap-8">
          {plans(render, vissee).map((plan, index) => (
            <Reveal as="li" key={plan.cle} delay={index * 90}>
              <figure>
                <div className="overflow-hidden rounded-card bg-[var(--color-nuit-profonde)]">
                  {/* Bande située loin sous la ligne de flottaison : chaque plan est
                      dessiné à l'approche de l'écran, dans son carré réservé. */}
                  <MontreDifferee
                    id={`macro-${plan.cle}`}
                    render={render}
                    crop={plan.crop}
                    label={`${modele.name}, gros plan : ${plan.titre.toLowerCase()}`}
                    className="block aspect-square h-auto w-full transition-transform duration-(--d-long) ease-atelier hover:scale-[1.04]"
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
