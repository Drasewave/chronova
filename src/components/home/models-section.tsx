import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { Section, SectionHeader } from "@/components/ui/section";
import { ModelCard } from "@/components/home/model-card";
import type { WatchModelView } from "@/lib/data/models";
import type { Catalogue } from "@/lib/configurateur/catalogue";

export function ModelsSection({
  catalogue,
  modeles,
}: {
  catalogue: Catalogue;
  modeles: WatchModelView[];
}) {
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

      <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-10">
        {modeles.map((modele, index) => (
          <Reveal key={modele.slug} delay={index * 60}>
            <ModelCard catalogue={catalogue} modele={modele} priorite={index === 0} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
