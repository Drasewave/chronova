import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { IconChevron } from "@/components/ui/icons";
import { Section, SectionHeader } from "@/components/ui/section";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Garantie, mouvements, étanchéité, délais d'assemblage, entretien et retours : les réponses de l'atelier.",
  alternates: { canonical: "/faq" },
};

export const revalidate = 300;

export default async function Faq() {
  const entrees = await prisma.faqEntry.findMany({
    where: { isPublished: true },
    orderBy: { sortIndex: "asc" },
  });

  /** Données structurées : les réponses peuvent apparaître directement en recherche. */
  const donneesStructurees = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entrees.map((entree) => ({
      "@type": "Question",
      name: entree.question,
      acceptedAnswer: { "@type": "Answer", text: entree.answer },
    })),
  };

  return (
    <Section fond="papier">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
      />

      <SectionHeader
        niveau={1}
        surtitre="Questions fréquentes"
        titre="Ce qu'on me demande le plus"
        intro="Si votre question n'est pas là, écrivez-moi : la réponse finira probablement sur cette page."
        action={<ButtonLink href="/contact" variant="contour">Poser une autre question</ButtonLink>}
      />

      <div className="mt-14 border-t border-rule">
        {entrees.map((entree) => (
          <details key={entree.id} className="group border-b border-rule">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-fg marker:content-none">
              <h2 className="type-title-2">{entree.question}</h2>
              <IconChevron
                className="shrink-0 text-accent transition-transform duration-300 ease-atelier group-open:rotate-180"
                width={22}
                height={22}
              />
            </summary>
            <p className="type-body measure pb-7 text-fg-soft">{entree.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
