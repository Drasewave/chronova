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
      "Il sert à chasser les aiguilles sur leurs canons sans les tordre. C'est le geste le plus délicat du montage : une aiguille posée de travers touche la suivante et arrête la montre.",
  },
  {
    titre: "La machine à étancher",
    texte:
      "Chaque montre y passe avant de partir : on la met sous pression, puis on cherche la moindre fuite. Une montre qui ne passe pas ce test est rouverte, rejointée, retestée.",
  },
  {
    titre: "Le chronocomparateur",
    texte:
      "Il écoute le battement du mouvement et en déduit l'écart de marche, l'amplitude et l'erreur de levée. C'est lui qui dit si un réglage tient sur trois jours.",
  },
  {
    titre: "La poire et les brucelles",
    texte:
      "Souffler la poussière, saisir une pièce sans la marquer. L'essentiel du travail se joue là, à la loupe, et ne se voit sur aucune photo.",
  },
];

export default function Horloger() {
  return (
    <>
      <Section fond="papier">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="type-mono text-fg-soft">L&apos;atelier</p>
            <h1 className="type-display-1 mt-6 text-balance">Une paire de mains, un établi.</h1>
            <p className="type-lead measure mt-8 text-fg-soft">
              Chronova n&apos;est pas une marque qui fait assembler ses montres ailleurs. Les pièces
              arrivent à l&apos;atelier, elles y sont contrôlées, montées, réglées, testées, puis
              expédiées. Il n&apos;y a personne entre vous et la montre.
            </p>
          </div>

          <PhotoPlaceholder
            description="portrait à l'établi, lumière naturelle, loupe d'horloger relevée"
            ratio="4 / 5"
          />
        </div>
      </Section>

      <Section fond="alterne">
        <SectionHeader surtitre="Le parcours" titre="D'où vient l'atelier" />
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
          surtitre="Le parti pris"
          titre="Des calibres qu'on peut réparer"
          intro="Le choix des mouvements n'est pas un choix de prix : c'est un choix d'entretien."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          <Reveal>
            <h3 className="type-title-2">Réparables partout</h3>
            <p className="type-body mt-3 text-fg-soft">
              Les calibres de la famille NH sont produits à très grande échelle. Les pièces de
              rechange se trouvent, et n&apos;importe quel horloger sait les démonter. Dans vingt
              ans, votre montre sera encore révisable — ce qui n&apos;est pas vrai de tous les
              mouvements d&apos;une microbrand.
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h3 className="type-title-2">Rien de monté à l&apos;avance</h3>
            <p className="type-body mt-3 text-fg-soft">
              Aucun stock de montres finies. L&apos;assemblage commence après votre commande, avec
              les pièces que vous avez choisies. C&apos;est plus long, et c&apos;est la seule façon
              de ne monter que des montres que quelqu&apos;un attend.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h3 className="type-title-2">Des fournisseurs nommés</h3>
            <p className="type-body mt-3 text-fg-soft">
              Boîtiers, cadrans, aiguilles, bracelets : chaque pièce a une référence et un
              fournisseur, consignés dans la fiche de votre commande. Vous pouvez demander
              lesquels, et les recommander vous-même le jour où vous voudrez changer un brin.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section fond="alterne">
        <SectionHeader
          surtitre="Sur l'établi"
          titre="Quatre outils qui font le travail"
          intro="Rien d'exceptionnel : ce sont les outils de n'importe quel horloger. Ce qui change, c'est le temps qu'on passe dessus."
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
            <h2 className="type-display-2 max-w-[18ch] text-night-ink">
              Une question avant de vous lancer ?
            </h2>
            <p className="type-lead measure mt-6 text-night-soft">
              Le plus simple est d&apos;écrire. Je réponds moi-même, et il n&apos;y a pas de
              mauvaise question sur une montre qu&apos;on va porter dix ans.
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
