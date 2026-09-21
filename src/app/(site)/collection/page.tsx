import type { Metadata } from "next";
import { CollectionBrowser, type EntreeCollection } from "@/components/collection/collection-browser";
import { ModelCard } from "@/components/home/model-card";
import { Section, SectionHeader } from "@/components/ui/section";
import { getCatalogue, getModels } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "La collection",
  description:
    "Les modèles de départ, assemblés à la main : plongée, terrain, GMT, habillée, chronographe. Diamètres de 37 à 41 mm.",
  alternates: { canonical: "/collection" },
};

export const revalidate = 300;

/** Le calibre de départ du modèle, affiché tel quel dans les filtres. */
const MOUVEMENTS: Record<string, string> = { nh35: "NH35", nh34: "NH34", nh38: "NH38" };

export default async function Collection() {
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);

  // Les cartes — SVG compris — sont rendues ici, côté serveur ; le composant de
  // filtres ne fait que choisir lesquelles montrer.
  const entrees: EntreeCollection[] = modeles.map((modele) => ({
    slug: modele.slug,
    style: modele.style,
    styleLabel: modele.styleLabel,
    sizes: modele.availableSizes,
    movement: MOUVEMENTS[modele.defaultSelections["mouvement"] ?? "nh35"] ?? "NH35",
    basePriceCents: modele.basePriceCents,
    carte: <ModelCard catalogue={catalogue} modele={modele} niveau={2} />,
  }));

  return (
    <Section fond="papier">
      <SectionHeader
        niveau={1}
        titre="La collection"
        intro="Chaque modèle fixe le boîtier, le diamètre et l'étanchéité. Vous composez ensuite le cadran, les aiguilles, la lunette, la couronne, le bracelet, le verre, le mouvement et le fond."
      />

      <div className="mt-10">
        <CollectionBrowser entrees={entrees} initial={{}} />
      </div>
    </Section>
  );
}
