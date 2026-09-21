import type { Metadata } from "next";
import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";
import { lireIdentiteLegale } from "@/lib/content/legal";
import { VERSION_CGU } from "@/lib/content/versions";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Règles d'usage du site Chronova, du configurateur et du compte client : accès, comportements interdits, fermeture du compte, propriété intellectuelle, responsabilité.",
  alternates: { canonical: "/cgu" },
};

export const revalidate = 86400;

export default async function Cgu() {
  const identite = await lireIdentiteLegale();

  return (
    <LegalPage
      titre="Conditions générales d'utilisation"
      chapo="Les règles d'usage du site, du configurateur et du compte client. La vente elle-même relève des conditions générales de vente."
      miseAJour={`[à dater lors de la mise en ligne] · version ${VERSION_CGU}`}
    >
      <p className="type-mono text-alert">
        Document à faire relire par un avocat avant toute mise en ligne. À retirer ensuite.
      </p>

      <h2>1. Objet</h2>
      <p>
        Le site Chronova permet de découvrir les montres de l&apos;atelier, d&apos;en composer une
        dans le configurateur, d&apos;enregistrer et de partager une configuration par un lien, de
        passer commande, de suivre son assemblage depuis un compte client, et d&apos;écrire à
        l&apos;atelier. Il est édité par{" "}
        {identite.raisonSociale ? (
          `${identite.raisonSociale}, entrepreneur individuel`
        ) : (
          <FillMe inline>nom de l&apos;éditeur</FillMe>
        )}{" "}
        (voir les <Link href="/mentions-legales">mentions légales</Link>). Les ventes sont régies
        par les <Link href="/cgv">conditions générales de vente</Link>.
      </p>

      <h2>2. Accès au site et création du compte</h2>
      <p>
        La consultation du site et l&apos;usage du configurateur sont libres et gratuits, sans
        compte. Le compte est nécessaire pour commander. Il se crée en indiquant une adresse
        e-mail et en acceptant les présentes conditions : un lien de connexion, valable trente
        minutes et utilisable une seule fois, est envoyé à cette adresse. Il n&apos;y a pas de mot
        de passe.
      </p>
      <p>
        Le compte est réservé aux personnes majeures et capables de contracter. Il est personnel :
        quiconque a accès à votre boîte e-mail a accès à votre compte, sa sécurité dépend donc de
        celle de votre messagerie. Signalez sans attendre à l&apos;atelier tout usage que vous
        n&apos;auriez pas fait vous-même. L&apos;adresse e-mail du compte ne se modifie que sur
        demande à l&apos;atelier, pour éviter le détournement d&apos;un compte.
      </p>

      <h2>3. Règles d&apos;usage</h2>
      <p>Vous vous engagez à ne pas :</p>
      <ul>
        <li>fournir de fausses informations, ni créer un compte avec l&apos;adresse d&apos;un tiers ;</li>
        <li>
          faire graver ou écrire dans un formulaire un texte injurieux, haineux, contrefaisant une
          marque, ou portant atteinte aux droits d&apos;un tiers (l&apos;atelier peut refuser une
          gravure pour ce motif) ;
        </li>
        <li>
          perturber le site : tentative d&apos;intrusion, contournement des protections, envoi
          automatisé de formulaires, extraction massive du contenu ou du catalogue ;
        </li>
        <li>utiliser le site à des fins frauduleuses, notamment avec un moyen de paiement volé.</li>
      </ul>

      <h2>4. Fermeture du compte et sort des données</h2>
      <p>
        <strong>Par vous, à tout moment</strong> : depuis <Link href="/compte/profil">votre profil</Link>,
        « Effacer mes données » ferme le compte immédiatement. Votre profil, votre carnet
        d&apos;adresses, votre téléphone, vos préférences et vos messages sont effacés. Vos
        commandes et factures sont conservées dix ans avec le nom et l&apos;adresse qui y figurent,
        comme la loi l&apos;impose, et les garanties attachées à vos montres restent valables : il
        suffira d&apos;écrire à l&apos;atelier avec votre numéro de commande. Avant de fermer, vous
        pouvez télécharger l&apos;ensemble de vos données depuis la même page.
      </p>
      <p>
        <strong>Par l&apos;atelier</strong> : en cas de manquement grave aux présentes conditions
        (fraude, atteinte au site), le compte peut être suspendu ou fermé, après un message vous en
        indiquant le motif, sauf urgence. Les commandes déjà payées sont honorées ou remboursées.
        Un compte resté trois ans sans connexion ni commande est effacé dans les mêmes conditions
        qu&apos;une fermeture à votre demande.
      </p>

      <h2>5. Propriété intellectuelle</h2>
      <p>
        <strong>Le contenu de l&apos;atelier</strong> (textes, illustrations, rendus de montres,
        configurateur, marque Chronova) reste sa propriété. Vous pouvez partager librement le lien
        ou l&apos;image de votre configuration à titre personnel ; toute reprise commerciale
        demande un accord écrit.
      </p>
      <p>
        <strong>Le vôtre</strong> (texte de gravure, messages, préférences) reste à vous. Vous
        autorisez seulement l&apos;atelier à l&apos;utiliser pour traiter votre demande et réaliser
        votre montre, et vous garantissez avoir le droit de faire graver le texte choisi. Aucun
        avis, photo ou témoignage n&apos;est publié sans votre accord exprès.
      </p>

      <h2>6. Disponibilité du site</h2>
      <p>
        L&apos;atelier fait de son mieux pour que le site soit accessible en permanence, sans le
        garantir : il peut être interrompu pour maintenance, mise à jour ou panne, sans indemnité.
        Une interruption du site n&apos;a aucun effet sur une commande déjà payée.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        Les rendus du configurateur sont des illustrations ; les prix et délais affichés avant la
        commande sont recalculés et confirmés au moment du paiement. L&apos;atelier n&apos;est pas
        responsable des dommages résultant d&apos;un usage du site contraire aux présentes
        conditions, d&apos;une défaillance de votre équipement ou de votre messagerie, ou d&apos;un
        cas de force majeure. Rien dans ces conditions ne limite les droits que la loi reconnaît
        aux consommateurs, ni la responsabilité de l&apos;atelier en tant que vendeur.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link> et la page{" "}
        <Link href="/cookies">cookies</Link>.
      </p>

      <h2>9. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. La version applicable est celle en ligne au moment de votre
        usage du site ; sa date et son numéro figurent en tête de page. En cas de changement
        important, les titulaires d&apos;un compte sont prévenus par e-mail avant son entrée en
        vigueur, et peuvent fermer leur compte s&apos;ils le refusent. Une commande reste régie par
        les conditions acceptées le jour où elle a été passée.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de différend, écrivez
        d&apos;abord à l&apos;atelier ; à défaut d&apos;accord, les règles de médiation et de
        compétence décrites dans les <Link href="/cgv">conditions générales de vente</Link>{" "}
        s&apos;appliquent.
      </p>
    </LegalPage>
  );
}
