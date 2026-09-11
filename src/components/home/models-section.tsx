import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { ModelCard } from "@/components/home/model-card";
import { SAMPLE_MODELS } from "@/lib/data/models";

export function ModelsSection() {
  return (
    <Section fond="papier" id="modeles">
      <SectionHeader
        surtitre="Les bases"
        titre="Quatre boîtiers, quatre caractères"
        intro="Chaque modèle fixe le boîtier, le diamètre et l'étanchéité. Tout le reste — cadran, aiguilles, lunette, couronne, bracelet, verre, fond — se compose ensuite."
        action={
          <ButtonLink href="/collection" variant="contour">
            Toute la collection
          </ButtonLink>
        }
      />

      <div className="mt-16 grid gap-10 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
        {SAMPLE_MODELS.map((modele, index) => (
          <Reveal key={modele.slug} delay={index * 60}>
            <ModelCard modele={modele} priorite={index === 0} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
