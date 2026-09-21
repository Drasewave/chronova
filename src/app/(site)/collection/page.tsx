import type { Metadata } from "next";
import { BlocGamme } from "@/components/collection/bloc-gamme";
import { CollectionBrowser, type EntreeCollection } from "@/components/collection/collection-browser";
import { ModelCard } from "@/components/home/model-card";
import { Section, SectionHeader } from "@/components/ui/section";
import { gammesAvecModeles } from "@/lib/content/gammes";
import { getCatalogue, getModels } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "La collection",
  description:
    "Les gammes de l'atelier : plongée, pilote, GMT, habillée, chronographe. Chaque modèle est un point de départ, assemblé à la main, que vous composez ensuite.",
  alternates: { canonical: "/collection" },
};

export const revalidate = 300;

/** Le calibre de départ du modèle, affiché tel quel dans les filtres. */
const MOUVEMENTS: Record<string, string> = { nh35: "NH35", nh34: "NH34", nh38: "NH38", vk64: "VK64" };

/**
 * Largeur de chaque bloc sur la grille à six colonnes des grands écrans : des
 * rangées toujours pleines, quel que soit le nombre de gammes publiées. Cinq
 * gammes donnent deux grands blocs puis trois moyens.
 */
function largeurs(nombre: number): string[] {
  const DEMI = "lg:col-span-3";
  const TIERS = "lg:col-span-2";
  if (nombre === 1) return ["lg:col-span-6"];
  if (nombre % 3 === 0) return Array.from({ length: nombre }, () => TIERS);
  if (nombre % 2 === 0 && nombre <= 4) return Array.from({ length: nombre }, () => DEMI);
  const enTete = nombre % 3 === 2 ? 2 : 4;
  return Array.from({ length: nombre }, (_, index) => (index < enTete ? DEMI : TIERS));
}

export default async function Collection() {
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);
  const gammes = gammesAvecModeles(modeles);
  const spans = largeurs(gammes.length);

  // Les cartes — SVG compris — sont rendues ici, côté serveur ; le composant de
  // filtres ne fait que choisir lesquelles montrer.
  const entrees: EntreeCollection[] = modeles.map((modele) => ({
    slug: modele.slug,
    sizes: modele.availableSizes,
    movement: MOUVEMENTS[modele.defaultSelections["mouvement"] ?? "nh35"] ?? "NH35",
    basePriceCents: modele.basePriceCents,
    carte: <ModelCard catalogue={catalogue} modele={modele} />,
  }));

  return (
    <>
      <Section fond="papier">
        <SectionHeader
          niveau={1}
          titre="La collection"
          intro="Choisissez d'abord une gamme. Chaque modèle fixe le boîtier, le diamètre et l'étanchéité ; vous composez ensuite le cadran, les aiguilles, la lunette, la couronne, le bracelet, le verre, le mouvement et le fond."
        />

        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-6">
          {gammes.map((gamme, index) => (
            <BlocGamme key={gamme.style} catalogue={catalogue} gamme={gamme} className={spans[index]} />
          ))}
        </div>
      </Section>

      <Section fond="alterne" id="tous-les-modeles" className="scroll-mt-20">
        <SectionHeader
          titre="Tous les modèles"
          intro="Toute la collection sur une seule page, à filtrer par diamètre, mouvement ou prix de départ."
        />

        <div className="mt-10">
          <CollectionBrowser entrees={entrees} initial={{}} />
        </div>
      </Section>
    </>
  );
}
