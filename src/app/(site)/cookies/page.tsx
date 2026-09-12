import type { Metadata } from "next";
import Link from "next/link";
import { GestionCookies } from "@/components/layout/gestion-cookies";
import { LegalPage } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Cookies",
  alternates: { canonical: "/cookies" },
};

export default function Cookies() {
  return (
    <LegalPage
      surtitre="Traceurs"
      titre="Cookies"
      chapo="Ce site en dépose le strict minimum. Voici lesquels, à quoi ils servent, et comment revenir sur votre choix."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Ce qui est déposé aujourd&apos;hui</h2>
      <p>
        Uniquement des éléments <strong>nécessaires au fonctionnement</strong> du site. Ils ne
        demandent pas de consentement, parce que sans eux le site ne marche pas.
      </p>
      <ul>
        <li>
          <strong>Session de connexion</strong> — vous garde connecté d&apos;une page à l&apos;autre.
          Déposé seulement si vous vous connectez, effacé à la déconnexion.
        </li>
        <li>
          <strong>Panier</strong> — conserve les montres que vous avez composées, dans votre
          navigateur. Ni lu ni copié par l&apos;atelier tant que vous ne commandez pas.
        </li>
        <li>
          <strong>Rideau d&apos;entrée</strong> — se souvient, le temps de votre visite, que
          l&apos;animation d&apos;accueil a déjà été jouée.
        </li>
        <li>
          <strong>Choix de cookies</strong> — enregistre la décision prise sur le bandeau, pour ne
          plus vous la redemander.
        </li>
      </ul>

      <h2>Ce qui n&apos;est pas déposé</h2>
      <p>
        Aucune mesure d&apos;audience, aucun pixel publicitaire, aucun bouton de réseau social
        traçant. Si une mesure d&apos;audience est mise en place un jour, elle sera annoncée ici et
        ne se déclenchera qu&apos;après un accord explicite.
      </p>

      <h2>Revenir sur votre choix</h2>
      <p>
        Votre décision est enregistrée dans votre navigateur, pas sur nos serveurs. Vous pouvez
        l&apos;effacer ici pour que le bandeau réapparaisse à la prochaine page.
      </p>

      <GestionCookies />

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
