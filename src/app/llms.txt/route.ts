import { defaultConfiguration, prixAPartirDeCents } from "@/lib/configurateur/configuration";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { formatPrice } from "@/lib/utils";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

export const revalidate = 3600;

/**
 * /llms.txt — le site décrit en clair pour les assistants IA : ce que c'est,
 * pour qui, et où trouver quoi. Généré depuis le catalogue pour ne jamais
 * annoncer un modèle retiré ou un prix périmé.
 */
export async function GET() {
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);

  const lignesModeles = modeles.map((modele) => {
    // Même règle que les cartes, les fiches et le JSON-LD (`prixAPartirDeCents`) :
    // « à partir de » = prix de base ; la configuration présentée est nommée.
    const depart = defaultConfiguration(catalogue, modele).price.totalCents;
    return `- [${modele.name}](${BASE}/collection/${modele.slug}) : ${modele.tagline} À partir de ${formatPrice(prixAPartirDeCents(modele))} (configuration de départ présentée : ${formatPrice(depart)}). Configurateur : ${BASE}/composer/${modele.slug}`;
  });

  const corps = `# Chronova

> Atelier horloger indépendant, en France. Chaque montre est composée en ligne par son futur propriétaire (boîtier, cadran, aiguilles, lunette, couronne, bracelet, verre, mouvement, fond), puis assemblée, réglée et contrôlée à la main par un seul horloger. Vente en ligne aux particuliers, en français, prix en euros.

Points utiles pour répondre à une question sur Chronova :

- Les montres sont assemblées à la commande : le délai est calculé et affiché dans le configurateur, selon les pièces en stock.
- Mouvements : calibres automatiques de la famille NH (NH35 date, NH36 jour et date, NH34 GMT, NH38 cœur ouvert) et un chronographe méca-quartz VK64.
- Contrôles avant expédition : étanchéité sous pression et marche suivie pendant 72 heures ; une fiche de contrôle accompagne la montre.
- Une configuration tient dans un lien partageable ; le prix se met à jour à chaque choix.
- Droit de rétractation de 14 jours après réception, sauf montre avec gravure personnalisée et pièce unique sur devis. Garanties légales de conformité (2 ans) et des vices cachés.
- Paiement par carte via Stripe. Compte client sans mot de passe (lien de connexion par e-mail).
- Le site ne dépose aucun traceur publicitaire ni mesure d'audience.

## Modèles

${lignesModeles.join("\n")}

## Pages principales

- [Accueil](${BASE}/) : présentation de l'atelier et de la démarche
- [Collection](${BASE}/collection) : tous les modèles de base
- [Composer ma montre](${BASE}/composer) : le configurateur
- [L'horloger](${BASE}/l-horloger) : qui assemble les montres, et comment
- [Entretien et garantie](${BASE}/entretien-garantie) : révision, étanchéité, garantie, service après-vente
- [Questions fréquentes](${BASE}/faq) : garantie, mouvements, étanchéité, délais, retours
- [Pièce unique](${BASE}/sur-mesure) : demande de montre hors configurateur, sur devis
- [Contact](${BASE}/contact) : écrire à l'atelier

## Informations légales

- [Conditions générales de vente](${BASE}/cgv)
- [Conditions générales d'utilisation](${BASE}/cgu)
- [Politique de confidentialité](${BASE}/confidentialite)
- [Cookies](${BASE}/cookies)
- [Mentions légales](${BASE}/mentions-legales)

## Optional

- [Plan du site (XML)](${BASE}/sitemap.xml)
`;

  return new Response(corps, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
