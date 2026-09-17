import { Section, SectionHeader } from "@/components/ui/section";
import { AVIS_PUBLIES } from "@/lib/content/home";

/**
 * Avis clients. Tant qu'aucun avis réel n'a été recueilli, la section affiche un
 * emplacement explicite plutôt qu'un témoignage inventé. Elle se remplira depuis
 * le CRM, où chaque avis est rattaché à une commande réelle.
 */
export function Testimonials() {
  if (AVIS_PUBLIES.length === 0) {
    return (
      <Section fond="papier" compact id="avis">
        <div className="border border-dashed border-rule p-8 text-center md:p-12">
          <p className="type-mono text-fg-soft">Avis à venir</p>
          <p className="type-body measure mx-auto mt-4 text-fg-soft">
            Aucun avis n&apos;est affiché tant qu&apos;aucun client n&apos;en a écrit. Les
            témoignages publiés ici seront rattachés à une commande réelle et modifiables depuis
            l&apos;atelier.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section fond="papier" id="avis">
      <SectionHeader surtitre="Après réception" titre="Ce qu'en disent les clients" />
      <ul className="mt-14 grid gap-px bg-rule md:grid-cols-3">
        {AVIS_PUBLIES.map((avis) => (
          <li key={avis.auteur} className="bg-bg p-7">
            <blockquote className="type-body text-fg">{avis.texte}</blockquote>
            <p className="type-mono mt-5 text-fg-soft">
              {avis.auteur}
              {avis.ville ? ` · ${avis.ville}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
