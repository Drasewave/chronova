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
        titre="Les modèles de départ"
        intro="Chaque modèle fixe le boîtier, le diamètre et l'étanchéité. Vous composez ensuite le reste : cadran, aiguilles, lunette, couronne, bracelet, verre et fond."
        action={
          <ButtonLink href="/collection" variant="contour">
            Toute la collection
          </ButtonLink>
        }
      />

      {/* Trois colonnes : neuf modèles font trois rangs pleins, sans carte
          orpheline. Sur téléphone, la grille devient un rail horizontal à pas
          magnétique (`.rail-modeles`) : neuf cartes empilées faisaient à elles
          seules plus de cinq écrans de haut. Le héros porte déjà la première
          montre de la page : ici tous les dessins sont montés à l'approche. */}
      <ul
        data-defilement-natif
        aria-label="Les modèles de départ"
        className="rail-modeles mt-12 grid gap-x-5 gap-y-12 md:grid-cols-2 lg:mt-14 lg:grid-cols-3"
      >
        {modeles.map((modele, index) => (
          <Reveal as="li" key={modele.slug} delay={(index % 3) * 90}>
            <ModelCard catalogue={catalogue} modele={modele} />
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
