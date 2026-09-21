import { ButtonLink } from "@/components/ui/button";
import { IconChevron } from "@/components/ui/icons";
import { Section, SectionHeader } from "@/components/ui/section";
import { FAQ } from "@/lib/content/home";

/**
 * Accordéon bâti sur <details>/<summary> : navigable au clavier, ouvrable sans
 * JavaScript, lisible par les lecteurs d'écran sans un seul attribut ARIA.
 */
export function FaqSection() {
  return (
    <Section fond="papier" id="faq">
      <SectionHeader
        titre="Ce qu'on me demande le plus"
        action={
          <ButtonLink href="/contact" variant="contour">
            Poser une autre question
          </ButtonLink>
        }
      />

      <div className="mt-14 border-t border-rule">
        {FAQ.map((entree) => (
          <details key={entree.question} className="accordeon group border-b border-rule">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 text-fg transition-colors duration-(--d-fast) ease-atelier marker:content-none hover:text-accent-ink">
              <h3 className="type-title-2">{entree.question}</h3>
              <IconChevron
                className="chevron shrink-0 text-accent-ink"
                width={22}
                height={22}
              />
            </summary>
            <p className="type-body measure pb-7 text-fg-soft">{entree.reponse}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
