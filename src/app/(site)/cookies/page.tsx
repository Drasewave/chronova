import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Cookies",
  description:
    "La liste complète des cookies et traceurs déposés par le site Chronova : uniquement ceux nécessaires à la connexion et au panier.",
  alternates: { canonical: "/cookies" },
};

/** Inventaire tenu à la main : toute nouvelle écriture dans le navigateur s'ajoute ici. */
const TRACEURS = [
  {
    nom: "authjs.session-token",
    type: "Cookie",
    emetteur: "Chronova",
    finalite: "Vous garde connecté d'une page à l'autre. Déposé seulement si vous vous connectez.",
    duree: "30 jours, effacé à la déconnexion",
  },
  {
    nom: "authjs.csrf-token, authjs.callback-url",
    type: "Cookies",
    emetteur: "Chronova",
    finalite: "Protègent le formulaire de connexion contre les requêtes forgées et mémorisent la page où vous ramener.",
    duree: "Le temps de la session du navigateur",
  },
  {
    nom: "chronova:panier",
    type: "Stockage local",
    emetteur: "Chronova",
    finalite: "Conserve les montres que vous avez composées. Jamais envoyé au serveur tant que vous ne commandez pas.",
    duree: "Jusqu'à la commande ou au vidage du panier",
  },
  {
    nom: "chronova:intro",
    type: "Stockage de session",
    emetteur: "Chronova",
    finalite: "Se souvient que l'animation d'accueil a déjà été jouée.",
    duree: "Jusqu'à la fermeture de l'onglet",
  },
] as const;

export default function Cookies() {
  return (
    <LegalPage
      surtitre="Traceurs"
      titre="Cookies"
      chapo="Ce site en dépose le strict minimum. Voici lesquels, qui les dépose, à quoi ils servent et combien de temps ils restent."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Pourquoi vous n&apos;avez pas vu de bandeau</h2>
      <p>
        Parce qu&apos;il n&apos;y a rien à accepter ni à refuser. Un bandeau de consentement
        n&apos;est exigé que pour les traceurs qui ne sont pas strictement nécessaires au service
        que vous demandez. Ce site n&apos;en dépose aucun : pas de mesure d&apos;audience, pas de
        pixel publicitaire, pas de bouton de réseau social, pas de vidéo ni de carte embarquée, et
        les polices de caractères sont servies depuis ce site, pas depuis un service tiers.
      </p>

      <h2>Ce qui est déposé</h2>
      <p>
        Uniquement des éléments <strong>nécessaires au fonctionnement</strong>, exemptés de
        consentement :
      </p>
      <div className="not-prose my-8 overflow-x-auto">
        <table className="type-caption w-full border-collapse text-left text-fg">
          <caption className="sr-only">Cookies et traceurs déposés par le site</caption>
          <thead>
            <tr className="border-b border-fg-soft">
              <th scope="col" className="py-3 pr-4 font-medium">Nom</th>
              <th scope="col" className="py-3 pr-4 font-medium">Type</th>
              <th scope="col" className="py-3 pr-4 font-medium">Émetteur</th>
              <th scope="col" className="py-3 pr-4 font-medium">Finalité</th>
              <th scope="col" className="py-3 font-medium">Durée</th>
            </tr>
          </thead>
          <tbody>
            {TRACEURS.map((traceur) => (
              <tr key={traceur.nom} className="border-b border-rule align-top">
                <th scope="row" className="type-mono py-3 pr-4 font-normal">{traceur.nom}</th>
                <td className="py-3 pr-4">{traceur.type}</td>
                <td className="py-3 pr-4">{traceur.emetteur}</td>
                <td className="py-3 pr-4 text-fg-soft">{traceur.finalite}</td>
                <td className="py-3 text-fg-soft">{traceur.duree}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Au moment du paiement</h2>
      <p>
        Le paiement se déroule sur une page de Stripe, à une autre adresse que ce site. Stripe y
        dépose ses propres cookies, nécessaires à la sécurité du paiement et à la lutte contre la
        fraude. Ils ne sont pas déposés tant que vous n&apos;allez pas payer, et relèvent de la{" "}
        <a href="https://stripe.com/fr/legal/cookies-policy" rel="noopener noreferrer">
          politique de cookies de Stripe
        </a>
        .
      </p>

      <h2>Si cela change</h2>
      <p>
        Si une mesure d&apos;audience ou un service tiers traçant est ajouté un jour, il sera listé
        ici, un bandeau vous demandera votre accord avant tout dépôt, refuser sera aussi simple
        qu&apos;accepter, et un lien en pied de page permettra de revenir sur ce choix.
      </p>

      <h2>Depuis votre navigateur</h2>
      <p>
        Tous les navigateurs permettent de bloquer ou de supprimer les cookies, site par site. Le
        blocage des cookies nécessaires empêchera la connexion et le panier de fonctionner.
      </p>
      <p>
        Pour le reste des données que nous traitons, voir la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
