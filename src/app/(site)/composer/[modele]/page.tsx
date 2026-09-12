import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurateur/configurator";
import { decodeConfig } from "@/lib/configurateur/url";
import { getCatalogue, getModel } from "@/lib/data/queries";

/**
 * La configuration vit dans la chaîne de requête (`?c=`). Lire `searchParams`
 * bascule la page en rendu à la demande — c'est voulu : un lien partagé doit
 * arriver avec SA montre déjà rendue côté serveur, pas avec la configuration par
 * défaut qui basculerait ensuite sous les yeux du destinataire.
 *
 * Pour la même raison, pas de `generateStaticParams` : il serait sans effet.
 */
export async function generateMetadata(props: PageProps<"/composer/[modele]">): Promise<Metadata> {
  const { modele } = await props.params;
  const model = await getModel(modele);
  if (!model) return { title: "Modèle introuvable" };

  return {
    title: `Composer la ${model.name}`,
    description: `${model.tagline} Composez votre ${model.name} : cadran, aiguilles, lunette, couronne, bracelet, verre, mouvement et fond.`,
    alternates: { canonical: `/composer/${model.slug}` },
  };
}

export default async function Composer(props: PageProps<"/composer/[modele]">) {
  const { modele } = await props.params;
  const [model, catalogue] = await Promise.all([getModel(modele), getCatalogue()]);
  if (!model) notFound();

  const { c } = await props.searchParams;
  const partagee = decodeConfig(catalogue, typeof c === "string" ? c : undefined);

  // Le lien a le dernier mot, la configuration signature du modèle comble les
  // trous : un lien raccourci ou écrit à la main reste ainsi exploitable.
  return (
    <Configurator
      catalogue={catalogue}
      model={model}
      initial={{ ...model.defaultSelections, ...partagee }}
    />
  );
}
