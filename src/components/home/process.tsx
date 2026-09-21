import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { ETAPES } from "@/lib/content/home";

/**
 * Le parcours d'une commande, en frise : quatre temps reliés par un filet, du
 * choix à l'expédition. La numérotation porte ici une information — l'ordre —
 * et c'est la seule chose qui ponctue la ligne : ni cartes, ni pictogrammes.
 */
export function Process() {
  return (
    <Section fond="papier" id="comment-ca-marche">
      <SectionHeader
        titre="Comment ça se passe"
        intro="Votre commande passe par quatre étapes, et je m'occupe de chacune. Je vous préviens à chaque changement d'étape, et vous retrouvez l'avancement de votre montre dans votre compte."
      />

      <ol className="mt-16 grid gap-y-12 md:grid-cols-2 md:gap-x-10 lg:mt-24 xl:grid-cols-4 xl:gap-x-0">
        {ETAPES.map((etape, index) => (
          <Reveal as="li" key={etape.numero} delay={index * 110} className="relative xl:pr-10">
            {/* Le filet de la frise : il part du repère et court jusqu'au suivant. */}
            <div className="flex items-center gap-4" aria-hidden="true">
              <span className="type-title-2 grid size-12 shrink-0 place-items-center rounded-pill border border-gold text-gold" data-numeric>
                {index + 1}
              </span>
              <span className="h-px flex-1 bg-rule" />
            </div>
            <h3 className="type-title-1 mt-7 max-w-[14ch]">{etape.titre}</h3>
            <p className="type-body mt-4 max-w-[36ch] text-fg-soft">{etape.texte}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
