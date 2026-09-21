import type { Metadata } from "next";
import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";
import { HEBERGEUR, lireIdentiteLegale } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Quelles données personnelles Chronova collecte, pourquoi, pendant combien de temps, qui y a accès, et comment exercer vos droits.",
  alternates: { canonical: "/confidentialite" },
};

export const revalidate = 86400;

export default async function Confidentialite() {
  const identite = await lireIdentiteLegale();

  return (
    <LegalPage
      surtitre="Données personnelles"
      titre="Politique de confidentialité"
      chapo="Quelles données sont collectées, pourquoi, combien de temps elles sont conservées, qui y a accès, et comment en reprendre la main."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Responsable du traitement</h2>
      {identite.raisonSociale && identite.adresse ? (
        <p>
          {identite.raisonSociale}, entrepreneur individuel exerçant sous le nom Chronova —{" "}
          {identite.adresse}.
        </p>
      ) : (
        <FillMe>nom et adresse du responsable de traitement (repris des mentions légales)</FillMe>
      )}
      {identite.email ? (
        <p>
          Contact pour toute question ou demande sur vos données :{" "}
          <a href={`mailto:${identite.email}`}>{identite.email}</a>.
        </p>
      ) : (
        <FillMe>adresse e-mail à laquelle exercer ses droits</FillMe>
      )}
      <p>
        Aucun délégué à la protection des données n&apos;est désigné : l&apos;atelier n&apos;entre
        pas dans les cas où la désignation est obligatoire.
      </p>

      <h2>Ce qui est collecté, pourquoi, et sur quelle base</h2>

      <h3>Votre compte client</h3>
      <p>
        <strong>Données</strong> : adresse e-mail, et si vous les renseignez : nom, téléphone,
        carnet d&apos;adresses. La connexion se fait par un lien envoyé par e-mail : aucun mot de
        passe n&apos;est créé ni stocké. Un jeton de connexion à usage unique est conservé trente
        minutes, puis un identifiant de session trente jours au plus. La date et la version des
        conditions d&apos;utilisation que vous acceptez sont conservées comme preuve.
      </p>
      <p>
        <strong>Finalité</strong> : vous identifier, vous permettre de commander et de suivre vos
        commandes. <strong>Base légale</strong> : l&apos;exécution du contrat (les{" "}
        <Link href="/cgu">conditions d&apos;utilisation</Link> que vous acceptez en créant le
        compte).
      </p>

      <h3>Vos commandes</h3>
      <p>
        <strong>Données</strong> : e-mail, nom et adresse de livraison, téléphone pour le
        transporteur si vous l&apos;indiquez, détail de chaque configuration, texte de gravure
        éventuel, montants, étapes et numéro de suivi, photographies de votre montre prises à
        l&apos;atelier.
      </p>
      <p>
        <strong>Finalité</strong> : assembler, facturer, livrer et garantir la montre.{" "}
        <strong>Base légale</strong> : l&apos;exécution du contrat de vente, puis l&apos;obligation
        légale de conserver les pièces comptables.
      </p>

      <h3>Tour de poignet et préférences</h3>
      <p>
        <strong>Données</strong> : votre tour de poignet en millimètres et un texte libre de
        préférences, tous deux facultatifs. <strong>Finalité</strong> : ajuster le bracelet et
        monter la montre à votre goût. <strong>Base légale</strong> : l&apos;exécution du contrat.
        N&apos;y indiquez aucune information sensible (santé, opinions) : elle n&apos;a aucune
        utilité pour l&apos;atelier.
      </p>

      <h3>Le paiement</h3>
      <p>
        Le paiement se fait sur la page sécurisée de Stripe, vers laquelle vous êtes redirigé. Le
        site lui transmet votre e-mail, le numéro et le contenu de la commande. Les données de
        carte sont saisies chez Stripe : elles ne transitent jamais par ce site et n&apos;y sont
        jamais stockées. L&apos;atelier ne conserve qu&apos;un identifiant de transaction.{" "}
        <strong>Base légale</strong> : l&apos;exécution du contrat.
      </p>

      <h3>Vos messages (contact et pièce unique)</h3>
      <p>
        <strong>Données</strong> : nom, e-mail, sujet et contenu du message ; téléphone, budget et
        lien de configuration si vous les indiquez. <strong>Finalité</strong> : vous répondre et, le
        cas échéant, établir un devis. <strong>Base légale</strong> : les mesures précontractuelles
        prises à votre demande, ou l&apos;intérêt légitime de l&apos;atelier à répondre à qui lui
        écrit.
      </p>

      <h3>Service après-vente et garantie</h3>
      <p>
        <strong>Données</strong> : description du problème, diagnostic, réparation, coût éventuel,
        rattachés à votre commande. <strong>Base légale</strong> : l&apos;exécution du contrat et
        les garanties légales.
      </p>

      <h3>Le suivi de la relation client à l&apos;atelier</h3>
      <p>
        L&apos;horloger peut ajouter à votre fiche des notes internes et des étiquettes de
        classement (par exemple « Fidèle » ou « Sur-mesure »). Elles servent uniquement à
        suivre votre dossier, ne donnent lieu à aucune décision automatisée, et vous sont
        communiquées sur simple demande. <strong>Base légale</strong> : l&apos;intérêt légitime de
        l&apos;atelier à tenir un suivi de ses clients.
      </p>

      <h3>La lettre d&apos;information</h3>
      <p>
        <strong>Donnée</strong> : votre adresse e-mail, et seulement si vous cochez la case prévue
        dans votre profil — elle est décochée par défaut. Chaque accord et chaque retrait sont
        horodatés pour en garder la preuve. <strong>Base légale</strong> : votre consentement, que
        vous retirez en décochant la case ou par le lien présent dans chaque envoi.
      </p>

      <h3>Les e-mails de service</h3>
      <p>
        Lien de connexion, confirmation de commande, avancement de l&apos;assemblage, expédition.
        Ce ne sont pas des messages publicitaires : ils sont nécessaires à l&apos;exécution du
        contrat et ne peuvent pas être désactivés.
      </p>

      <h3>Les journaux techniques</h3>
      <p>
        Le serveur enregistre l&apos;adresse IP, la date et la page demandée, pour assurer la
        sécurité du site et diagnostiquer les pannes. <strong>Base légale</strong> : l&apos;intérêt
        légitime. Ces journaux ne sont ni croisés avec votre compte, ni utilisés pour mesurer
        l&apos;audience.
      </p>

      <h3>Cookies et stockage du navigateur</h3>
      <p>
        Uniquement ce qui est nécessaire au fonctionnement : session de connexion et panier. Aucune
        mesure d&apos;audience, aucun traceur publicitaire. Le détail est sur{" "}
        <Link href="/cookies">la page cookies</Link>.
      </p>

      <h2>Qui y a accès</h2>
      <p>
        L&apos;horloger, seul. Vos données ne sont ni vendues, ni louées, ni transmises à des fins
        publicitaires. Elles passent par un petit nombre de prestataires, chacun pour une tâche
        précise :
      </p>
      <ul>
        <li>
          <strong>{HEBERGEUR.nom}</strong> ({HEBERGEUR.service}) — hébergement du site et de la
          base de données. <FillMe inline>région du centre de données</FillMe>
        </li>
        <li>
          <strong>Stripe Payments Europe Ltd</strong> (Irlande) — encaissement des paiements.
        </li>
        <li>
          <strong>Resend, Inc.</strong> (États-Unis) — acheminement des e-mails de connexion et de
          suivi de commande : il voit votre adresse e-mail et le contenu de ces messages.
        </li>
        <li>
          <FillMe inline>transporteur, qui reçoit nom, adresse et téléphone pour la livraison</FillMe>
        </li>
      </ul>

      <h2>Transferts hors de l&apos;Union européenne</h2>
      <p>
        Resend est établi aux États-Unis, et Stripe comme Oracle appartiennent à des groupes
        américains susceptibles d&apos;y traiter certaines données. Ces transferts sont encadrés
        par la décision d&apos;adéquation de la Commission européenne du 10 juillet 2023 (Data
        Privacy Framework) pour les sociétés qui y sont certifiées, et à défaut par les clauses
        contractuelles types de la Commission.
      </p>
      <FillMe>vérifier la certification DPF de chaque prestataire et signer leur accord de sous-traitance (DPA)</FillMe>

      <h2>Combien de temps</h2>
      <ul>
        <li>
          <strong>Commandes et factures</strong> : dix ans, durée imposée par le Code de commerce.
        </li>
        <li>
          <strong>Compte client</strong> : tant qu&apos;il existe, puis effacement après trois ans
          sans connexion ni commande.
        </li>
        <li>
          <strong>Messages de contact et demandes sans suite</strong> : trois ans après le dernier
          échange.
        </li>
        <li>
          <strong>Dossiers de service après-vente</strong> : cinq ans après leur clôture.
        </li>
        <li>
          <strong>Lettre d&apos;information</strong> : jusqu&apos;au retrait du consentement ; la
          preuve du consentement, cinq ans de plus.
        </li>
        <li>
          <strong>Session de connexion</strong> : trente jours au plus.{" "}
          <strong>Journaux techniques</strong> : <FillMe inline>durée de rotation des journaux du serveur, six mois au plus</FillMe>
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Le règlement général sur la protection des données vous donne le droit d&apos;accéder à vos
        données, de les faire rectifier, de les faire effacer, de limiter leur traitement, de vous
        opposer aux traitements fondés sur l&apos;intérêt légitime, de retirer votre consentement,
        et de récupérer vos données dans un format lisible par une machine. Vous pouvez aussi
        laisser des directives sur le sort de vos données après votre décès.
      </p>
      <p>
        Depuis <Link href="/compte/profil">votre compte</Link>, la rectification, l&apos;export
        complet (fichier JSON) et l&apos;effacement sont accessibles directement, sans rien
        demander à personne. Pour toute autre demande, écrivez à l&apos;adresse de contact
        ci-dessus : la réponse est due sous un mois.
      </p>
      <p>
        L&apos;effacement ne peut pas porter sur ce que la loi impose de conserver : une commande
        et sa facture gardent le nom et l&apos;adresse qui y figurent pendant dix ans. Tout le
        reste — profil, carnet d&apos;adresses, téléphone, préférences, notes, messages — est
        effacé immédiatement.
      </p>
      <p>
        Fournir les données d&apos;une commande est nécessaire pour qu&apos;elle soit honorée ; tout
        le reste est facultatif. Aucune décision automatisée ni profilage n&apos;est pratiqué.
      </p>

      <h2>Réclamation</h2>
      <p>
        Si une réponse ne vous satisfait pas, vous pouvez saisir la Commission nationale de
        l&apos;informatique et des libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris
        Cedex 07 — <a href="https://www.cnil.fr/fr/plaintes">cnil.fr/fr/plaintes</a>.
      </p>
    </LegalPage>
  );
}
