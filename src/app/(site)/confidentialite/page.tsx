import type { Metadata } from "next";
import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
};

export default function Confidentialite() {
  return (
    <LegalPage
      surtitre="Données personnelles"
      titre="Politique de confidentialité"
      chapo="Quelles données sont collectées, pourquoi, combien de temps elles sont conservées, et comment en reprendre la main."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Responsable du traitement</h2>
      <FillMe>identité et coordonnées du responsable de traitement</FillMe>
      <p>
        Aucun délégué à la protection des données n&apos;est désigné : l&apos;atelier n&apos;entre
        pas dans les cas où la désignation est obligatoire. Les demandes se font directement à
        l&apos;adresse de contact.
      </p>

      <h2>Données collectées et pourquoi</h2>
      <h3>Pour exécuter une commande</h3>
      <p>
        Nom, adresse e-mail, adresse de livraison, téléphone si vous le renseignez, tour de poignet,
        et le détail de votre configuration. Base légale : l&apos;exécution du contrat. Sans ces
        données, la montre ne peut être ni assemblée ni livrée.
      </p>

      <h3>Pour vous répondre</h3>
      <p>
        Nom, adresse e-mail et contenu de votre message, lorsque vous utilisez un formulaire de
        contact ou de demande sur mesure. Base légale : votre demande elle-même.
      </p>

      <h3>Pour la lettre d&apos;information</h3>
      <p>
        Adresse e-mail uniquement, et seulement si vous vous inscrivez. Base légale : votre
        consentement, révocable à tout moment par le lien de désinscription ou sur simple demande.
      </p>

      <h3>Pour faire fonctionner le site</h3>
      <p>
        Un cookie de session et le contenu de votre panier, stockés dans votre navigateur. Aucune
        mesure d&apos;audience n&apos;est active à ce jour ; si elle l&apos;était, elle ne serait
        déposée qu&apos;après votre accord, et son refus serait aussi simple que son acceptation.
        Voir <Link href="/cookies">la page cookies</Link>.
      </p>

      <h2>Qui y a accès</h2>
      <p>Vos données ne sont ni vendues, ni louées, ni transmises à des fins publicitaires.</p>
      <p>Elles sont traitées par un petit nombre de prestataires, chacun pour une tâche précise :</p>
      <ul>
        <li>
          <strong>Stripe</strong> — encaissement des paiements. Les données de carte bancaire ne
          transitent jamais par ce site.
        </li>
        <li>
          <strong>Resend</strong> — envoi des e-mails de connexion et de suivi de commande.
        </li>
        <li>
          <strong>Vercel</strong> — hébergement du site.
        </li>
        <li>
          <FillMe inline>hébergeur de la base de données</FillMe>
        </li>
        <li>
          <FillMe inline>transporteur, pour la livraison</FillMe>
        </li>
      </ul>
      <p>
        Certains de ces prestataires sont établis hors de l&apos;Union européenne. Les transferts
        s&apos;appuient alors sur les clauses contractuelles types de la Commission européenne.
      </p>

      <h2>Combien de temps</h2>
      <ul>
        <li>
          <strong>Commandes et factures</strong> : dix ans, durée de conservation comptable imposée
          par le Code de commerce.
        </li>
        <li>
          <strong>Compte client</strong> : tant que le compte existe, puis trois ans après le
          dernier contact.
        </li>
        <li>
          <strong>Messages de contact</strong> : trois ans après le dernier échange.
        </li>
        <li>
          <strong>Inscription à la lettre</strong> : jusqu&apos;à votre désinscription.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Le règlement général sur la protection des données vous donne le droit d&apos;accéder à vos
        données, de les faire rectifier, de les faire effacer, de limiter leur traitement, de vous
        opposer à certains traitements, et de les récupérer dans un format lisible par une machine.
      </p>
      <p>
        Depuis votre compte, l&apos;export et la suppression de vos données sont accessibles
        directement. Pour toute autre demande, écrivez à l&apos;adresse de contact : la réponse est
        due sous un mois.
      </p>
      <p>
        L&apos;effacement ne peut pas porter sur les données que la loi impose de conserver — une
        facture reste une facture. Dans ce cas, les données personnelles sont anonymisées et seules
        les informations comptables subsistent.
      </p>

      <h2>Réclamation</h2>
      <p>
        Si une réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de
        l&apos;informatique et des libertés (CNIL), 3 place de Fontenoy, 75007 Paris.
      </p>
    </LegalPage>
  );
}
