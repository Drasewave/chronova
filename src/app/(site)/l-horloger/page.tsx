import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { FillMe, PhotoPlaceholder } from "@/components/ui/placeholder";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "L'horloger",
  description:
    "L'atelier, l'établi, les fournisseurs et la façon dont chaque Chronova est montée, réglée et contrôlée à la main.",
  alternates: { canonical: "/l-horloger" },
};

const ETABLI = [
  {
    titre: "Le potence",
    texte:
      "Je m'en sers pour chasser les aiguilles sur leurs canons sans les tordre. C'est le geste le plus délicat du montage : une aiguille posée de travers touche la suivante et arrête la montre.",
  },
  {
    titre: "La machine à étancher",
    texte:
      "Chaque montre y passe avant de partir : je la mets sous pression, puis je cherche la moindre fuite. Si elle échoue, je la rouvre, je change les joints et je refais le test.",
  },
  {
    titre: "Le chronocomparateur",
    texte:
      "Son micro capte le battement du mouvement. J'y lis l'écart de marche, l'amplitude et l'erreur de levée, et je m'en sers pour vérifier qu'un réglage tient sur trois jours.",
  },
  {
    titre: "La poire et les brucelles",
    texte:
      "Avec la poire, je chasse la poussière ; avec les brucelles, je saisis une pièce sans la marquer. J'y passe l'essentiel de mon temps, à la loupe.",
  },
];

export default function Horloger() {
  return (
    <>
      <Section fond="papier">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h1 className="type-display-1 text-balance">Je monte chaque montre moi-même</h1>
            <p className="type-lead measure mt-8 text-fg-soft">
              Les pièces arrivent à mon atelier. Je les contrôle, je monte la montre, je la règle
              et je la teste, puis je l&apos;expédie. Je ne confie aucune de ces étapes à un
              sous-traitant.
            </p>
          </div>

          <PhotoPlaceholder
            description="portrait à l'établi, lumière naturelle, loupe d'horloger relevée"
            ratio="4 / 5"
          />
        </div>
      </Section>

      <Section fond="alterne">
        <SectionHeader titre="D'où vient l'atelier" />
        <div className="measure mt-10 flex flex-col gap-6">
          <FillMe>
            parcours de l&apos;horloger : formation, écoles, années de métier, maisons traversées
          </FillMe>
          <FillMe>
            ce qui l&apos;a amené à monter ses propres montres plutôt qu&apos;à réparer celles des
            autres
          </FillMe>
          <FillMe>
            où se trouve l&apos;atelier, depuis quand, et s&apos;il se visite sur rendez-vous
          </FillMe>
        </div>
      </Section>

      <Section fond="papier">
        <SectionHeader
          titre="Des calibres qu'on peut réparer"
          intro="J'ai choisi ces mouvements parce qu'ils s'entretiennent facilement, chez moi comme chez un autre horloger."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <Reveal>
            <h3 className="type-title-2">Réparables partout</h3>
            <p className="type-body mt-3 text-fg-soft">
              Les calibres de la famille NH sont produits à grande échelle. Les pièces de rechange
              se trouvent, et n&apos;importe quel horloger sait les démonter. Dans vingt ans, votre
              montre sera encore révisable, ce qui n&apos;est pas le cas de tous les mouvements
              montés par les microbrands.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h3 className="type-title-2">Rien de monté à l&apos;avance</h3>
            <p className="type-body mt-3 text-fg-soft">
              Je ne tiens aucun stock de montres finies. Je commence l&apos;assemblage après votre
              commande, avec les pièces que vous avez choisies. C&apos;est plus long qu&apos;un
              achat sur étagère, et je ne monte ainsi que des montres déjà commandées.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h3 className="type-title-2">Des fournisseurs nommés</h3>
            <p className="type-body mt-3 text-fg-soft">
              Je consigne la référence et le fournisseur de chaque pièce (boîtier, cadran,
              aiguilles, bracelet) dans la fiche de votre commande. Demandez-les-moi : vous pourrez
              recommander vous-même un brin le jour où vous voudrez en changer.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section fond="alterne">
        <SectionHeader
          titre="Les quatre outils de l'établi"
          intro="Vous les trouverez sur l'établi de n'importe quel horloger. J'explique ici à quoi me sert chacun."
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <PhotoPlaceholder
            description="plan large de l'établi : tapis vert, brucelles, boîtes à pièces, potence"
            ratio="4 / 3"
          />
          <dl className="grid gap-px bg-rule">
            {ETABLI.map((outil) => (
              <div key={outil.titre} className="bg-bg-alt p-6">
                <dt className="type-title-2">{outil.titre}</dt>
                <dd className="type-body mt-2 text-fg-soft">{outil.texte}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section fond="nuit">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-display-2 max-w-[18ch] text-fg">
              Posez-moi vos questions
            </h2>
            <p className="type-lead measure mt-6 text-fg-soft">
              Écrivez-moi avant de commander si un point vous arrête. Je réponds moi-même, y
              compris aux questions de débutant.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <ButtonLink href="/contact">Écrire à l&apos;atelier</ButtonLink>
            <ButtonLink href="/composer" variant="contour">
              Composer ma montre
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
