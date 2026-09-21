import type { Metadata } from "next";
import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";
import { fraisDePort } from "@/lib/commandes/creation";
import { lireIdentiteLegale, mediateurChoisi } from "@/lib/content/legal";
import { VERSION_CGV } from "@/lib/content/versions";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description:
    "Conditions de vente des montres Chronova : prix, commande, paiement, livraison, droit de rétractation de 14 jours, garanties légales et médiation.",
  alternates: { canonical: "/cgv" },
};

export const revalidate = 86400;

export default async function Cgv() {
  const [identite, port, garantie] = await Promise.all([
    lireIdentiteLegale(),
    fraisDePort(0),
    prisma.setting.findUnique({ where: { key: "garantie.duree_mois" } }),
  ]);
  const garantieMois = (garantie?.value as { mois?: number } | null)?.mois ?? 0;

  return (
    <LegalPage
      surtitre="Conditions de vente"
      titre="Conditions générales de vente"
      chapo="Ce document décrit ce qui est vendu, comment, à quel prix et dans quelles conditions. Il est volontairement écrit en français courant. Il s'applique aux ventes conclues sur ce site avec des consommateurs."
      miseAJour={`[à dater lors de la mise en ligne] · version ${VERSION_CGV}`}
    >
      <p className="type-mono text-alert">
        Document à faire relire par un avocat avant toute mise en ligne. À retirer ensuite.
      </p>

      <h2>1. Vendeur</h2>
      {identite.raisonSociale ? (
        <p>
          {identite.raisonSociale}, entrepreneur individuel (EI), exerçant sous le nom commercial
          Chronova{identite.adresse ? ` — ${identite.adresse}` : ""}
          {identite.siret ? ` — SIRET ${identite.siret}` : ""}
          {identite.email ? ` — ${identite.email}` : ""}
          {identite.telephone ? ` — ${identite.telephone}` : ""}.
        </p>
      ) : (
        <FillMe>identité complète du vendeur (se remplit depuis Atelier › Paramètres › Identité légale)</FillMe>
      )}
      <p>
        L&apos;identité complète figure dans les <Link href="/mentions-legales">mentions légales</Link>.
        Dans la suite, « l&apos;atelier » désigne le vendeur et « vous » le client, consommateur au
        sens du Code de la consommation.
      </p>

      <h2>2. Objet</h2>
      <p>
        Les présentes conditions régissent la vente à distance de montres assemblées à la demande
        à partir du configurateur du site. Les pièces uniques qui sortent du configurateur font
        l&apos;objet d&apos;un devis séparé, qui complète ces conditions. Passer commande suppose
        d&apos;avoir accepté ces conditions, par une case à cocher, avant le paiement.
      </p>

      <h2>3. Produits</h2>
      <p>
        Chaque montre est assemblée après commande, selon la configuration que vous avez choisie.
        Les caractéristiques essentielles (dimensions, matériaux, mouvement, étanchéité) sont
        indiquées sur la fiche du modèle et dans le récapitulatif de votre configuration.
      </p>
      <p>
        Les rendus affichés sont des illustrations fidèles mais schématiques : ils ne remplacent pas
        une photographie, et de légères différences de teinte sont possibles entre l&apos;écran et
        la pièce réelle.
      </p>
      <p>
        L&apos;étanchéité est exprimée selon la norme ISO 22810 et correspond à une pression
        statique en laboratoire, non à une profondeur d&apos;utilisation.
      </p>

      <h2>4. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. Le prix d&apos;une montre est
        celui de sa configuration, affiché en direct dans le configurateur. Les frais de livraison
        sont indiqués dans le panier, avant le paiement. Le prix dû est celui affiché sur la page
        de paiement au moment de la commande.
      </p>
      {identite.tva ? (
        <p>
          TVA intracommunautaire : <span data-numeric>{identite.tva}</span>.
        </p>
      ) : (
        <FillMe>régime de TVA : « TVA non applicable, article 293 B du CGI » en franchise en base, sinon renseigner le numéro de TVA dans les Paramètres</FillMe>
      )}

      <h2>5. Commande</h2>
      <p>
        Commander demande un compte client et une adresse de livraison. Le panier récapitule les
        montres, leur prix, les frais de livraison et le total ; vous pouvez y corriger chaque
        configuration avant de payer. Le contrat est conclu à la confirmation du paiement. Un
        e-mail de confirmation reprend la commande, son prix et le délai d&apos;assemblage estimé ;
        la commande reste consultable depuis votre compte.
      </p>
      <p>
        L&apos;atelier peut refuser une commande en cas d&apos;indisponibilité durable d&apos;une
        pièce ou de litige de paiement antérieur ; vous en êtes informé et intégralement remboursé.
      </p>

      <h2>6. Paiement</h2>
      <p>
        Le paiement s&apos;effectue en ligne, par carte bancaire, sur la page sécurisée de Stripe.
        Le montant est débité à la commande. Aucune donnée de carte ne transite par ce site ni
        n&apos;y est conservée. Une facture est mise à votre disposition pour chaque commande.
      </p>

      <h2>7. Délais et livraison</h2>
      <p>
        Le délai d&apos;assemblage est affiché dans le configurateur et le panier, puis rappelé
        dans l&apos;e-mail de confirmation ; il court à compter du paiement. L&apos;envoi est suivi
        et assuré{port > 0 ? `, au tarif de ${formatPrice(port)} pour la France` : ""}. Le numéro de
        suivi apparaît dans votre compte à l&apos;expédition.
      </p>
      <FillMe>pays livrés, transporteur, délai d&apos;acheminement, et seuil de livraison offerte s&apos;il est maintenu</FillMe>
      <p>
        Si la montre n&apos;est pas livrée à la date annoncée — ou, à défaut de date, dans les
        trente jours suivant la commande — vous pouvez mettre l&apos;atelier en demeure de livrer
        dans un délai supplémentaire raisonnable, puis, sans résultat, annuler la commande par
        écrit : vous êtes alors remboursé sous quatorze jours (articles L216-1 et suivants du Code
        de la consommation). Le risque de perte ou de dommage vous est transféré à la remise du
        colis. Vérifiez-le à réception et signalez tout dommage à l&apos;atelier sans attendre.
      </p>

      <h2>8. Droit de rétractation</h2>
      <h3>Le principe : quatorze jours</h3>
      <p>
        Vous disposez de quatorze jours à compter de la réception de la montre pour vous rétracter,
        sans avoir à donner de motif. Il suffit d&apos;en informer l&apos;atelier avant la fin du
        délai, par une déclaration dénuée d&apos;ambiguïté : le formulaire en annexe, un e-mail, ou
        le <Link href="/contact">formulaire de contact</Link>.
      </p>
      <p>
        Vous renvoyez ensuite la montre, dans son écrin, au plus tard quatorze jours après avoir
        annoncé votre rétractation. <strong>Les frais de retour sont à votre charge</strong> ;
        l&apos;atelier recommande un envoi suivi et assuré à la valeur de la montre.
      </p>
      <p>
        L&apos;atelier vous rembourse la totalité des sommes versées, frais de livraison standard
        compris, au plus tard quatorze jours après avoir été informé de votre décision, par le
        moyen de paiement utilisé à la commande. Ce remboursement peut être différé jusqu&apos;à
        réception de la montre ou de la preuve de son expédition.
      </p>
      <p>
        Vous pouvez examiner et essayer la montre comme vous le feriez en boutique. Des
        manipulations qui vont au-delà — port prolongé, rayures, bracelet mis à taille de façon
        irréversible, ouverture du boîtier — engagent votre responsabilité pour la perte de valeur
        qui en résulte.
      </p>

      <h3>L&apos;exception : gravure personnalisée et pièces uniques</h3>
      <p>
        Le droit de rétractation ne s&apos;applique pas aux biens confectionnés selon vos
        spécifications ou nettement personnalisés (article L221-28 3° du Code de la consommation).
        Sont concernées : les montres comportant une <strong>gravure personnalisée</strong>, et les{" "}
        <strong>pièces uniques réalisées sur devis</strong>. Cette absence de droit de rétractation
        vous est rappelée dans le panier, avant le paiement, et sur le devis.
      </p>
      <p>
        Une montre simplement composée à partir des options du configurateur, sans gravure,
        bénéficie du droit de rétractation. Dans tous les cas, l&apos;exception ne retire rien aux
        garanties légales ci-dessous : un défaut reste un défaut.
      </p>

      <h2>9. Garanties légales</h2>
      <p>
        Indépendamment de toute garantie commerciale, l&apos;atelier est tenu de la garantie légale
        de conformité et de la garantie des vices cachés. Pour les exercer, écrivez à
        l&apos;adresse de contact ou passez par le <Link href="/contact">formulaire</Link>.
      </p>
      <div className="not-prose type-caption my-8 flex flex-col gap-3 border border-fg-soft p-6 text-fg">
        <p>
          Le consommateur dispose d&apos;un délai de deux ans à compter de la délivrance du bien
          pour obtenir la mise en œuvre de la garantie légale de conformité en cas
          d&apos;apparition d&apos;un défaut de conformité. Durant ce délai, le consommateur
          n&apos;est tenu d&apos;établir que l&apos;existence du défaut de conformité et non la date
          d&apos;apparition de celui-ci.
        </p>
        <p>
          La garantie légale de conformité donne au consommateur droit à la réparation ou au
          remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans
          inconvénient majeur pour lui.
        </p>
        <p>
          Si le bien est réparé dans le cadre de la garantie légale de conformité, le consommateur
          bénéficie d&apos;une extension de six mois de la garantie initiale.
        </p>
        <p>
          Si le consommateur demande la réparation du bien, mais que le vendeur impose le
          remplacement, la garantie légale de conformité est renouvelée pour une période de deux
          ans à compter de la date de remplacement du bien.
        </p>
        <p>
          Le consommateur peut obtenir une réduction du prix d&apos;achat en conservant le bien ou
          mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien,
          si : 1° le professionnel refuse de réparer ou de remplacer le bien ; 2° la réparation ou
          le remplacement du bien intervient après un délai de trente jours ; 3° la réparation ou
          le remplacement du bien occasionne un inconvénient majeur pour le consommateur, notamment
          lorsque le consommateur supporte définitivement les frais de reprise ou d&apos;enlèvement
          du bien non conforme, ou s&apos;il supporte les frais d&apos;installation du bien réparé
          ou de remplacement ; 4° la non-conformité du bien persiste en dépit de la tentative de
          mise en conformité du vendeur restée infructueuse.
        </p>
        <p>
          Le consommateur a également droit à une réduction du prix du bien ou à la résolution du
          contrat lorsque le défaut de conformité est si grave qu&apos;il justifie que la réduction
          du prix ou la résolution du contrat soit immédiate. Le consommateur n&apos;est alors pas
          tenu de demander la réparation ou le remplacement du bien au préalable.
        </p>
        <p>
          Le consommateur n&apos;a pas droit à la résolution de la vente si le défaut de conformité
          est mineur.
        </p>
        <p>
          Toute période d&apos;immobilisation du bien en vue de sa réparation ou de son
          remplacement suspend la garantie qui restait à courir jusqu&apos;à la délivrance du bien
          remis en état.
        </p>
        <p>
          Les droits mentionnés ci-dessus résultent de l&apos;application des articles L. 217-1 à
          L. 217-32 du code de la consommation.
        </p>
        <p>
          Le vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de
          conformité encourt une amende civile d&apos;un montant maximal de 300 000 euros, qui peut
          être porté jusqu&apos;à 10 % du chiffre d&apos;affaires moyen annuel (article L. 241-5 du
          code de la consommation).
        </p>
        <p>
          Le consommateur bénéficie également de la garantie légale des vices cachés en application
          des articles 1641 à 1649 du code civil, pendant une durée de deux ans à compter de la
          découverte du défaut. Cette garantie donne droit à une réduction de prix si le bien est
          conservé ou à un remboursement intégral contre restitution du bien.
        </p>
      </div>

      <h2>10. Garantie commerciale de l&apos;atelier</h2>
      {garantieMois > 0 ? (
        <p>
          En plus des garanties légales, l&apos;atelier garantit le mouvement et l&apos;assemblage
          pendant {garantieMois} mois à compter de la livraison : tout défaut de montage ou de
          fonctionnement est repris à l&apos;atelier, sans frais. Elle ne couvre ni l&apos;usure
          normale, ni les chocs, ni l&apos;ouverture de la montre par un tiers. Le détail figure
          sur la page <Link href="/entretien-garantie">Entretien &amp; garantie</Link>.
        </p>
      ) : (
        <FillMe>durée de la garantie commerciale (Atelier › Paramètres), étendue et modalités — ou supprimer cet article s&apos;il n&apos;y en a pas</FillMe>
      )}

      <h2>11. Réclamations et médiation</h2>
      <p>
        Toute réclamation s&apos;adresse d&apos;abord à l&apos;atelier, par écrit
        {identite.email ? ` (${identite.email})` : ""} : c&apos;est l&apos;horloger qui répond.
      </p>
      {mediateurChoisi(identite) ? (
        <p>
          Si aucune solution n&apos;est trouvée dans les deux mois, vous pouvez saisir gratuitement
          le médiateur de la consommation dont relève l&apos;atelier (article L612-1 du Code de la
          consommation) : {identite.mediateurNom}
          {identite.mediateurAdresse ? `, ${identite.mediateurAdresse}` : ""},{" "}
          <a href={identite.mediateurSite} rel="noopener noreferrer">
            {identite.mediateurSite}
          </a>
          .
        </p>
      ) : (
        <FillMe>[MÉDIATEUR À CHOISIR] nom, adresse postale et site du médiateur de la consommation, après adhésion</FillMe>
      )}

      <h2>12. Reprise des produits usagés</h2>
      <p>
        Une montre contenant une pile ou un composant électrique (chronographe méca-quartz) ne se
        jette pas avec les ordures ménagères. L&apos;atelier reprend gratuitement votre ancienne
        montre du même type lors d&apos;un achat, et les piles usagées.
      </p>
      {identite.identifiantRep ? (
        <p>
          Identifiant unique REP : <span data-numeric>{identite.identifiantRep}</span>.
        </p>
      ) : (
        <FillMe>identifiant unique REP (ADEME) après adhésion aux éco-organismes concernés</FillMe>
      )}

      <h2>13. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>. Si vous indiquez votre
        numéro de téléphone, vous pouvez vous inscrire gratuitement sur la liste d&apos;opposition
        au démarchage téléphonique Bloctel ; l&apos;atelier ne pratique aucun démarchage.
      </p>

      <h2>14. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution
        amiable est recherchée en priorité. À défaut, les tribunaux compétents sont ceux désignés
        par le Code de la consommation : vous pouvez saisir la juridiction de votre domicile.
      </p>

      <h2>Annexe — formulaire type de rétractation</h2>
      <p>
        À compléter et renvoyer uniquement si vous souhaitez vous rétracter. Un e-mail reprenant
        ces informations a la même valeur.
      </p>
      <div className="not-prose type-body my-8 flex flex-col gap-3 border border-fg-soft p-6 text-fg">
        <p>
          À l&apos;attention de{" "}
          {identite.raisonSociale
            ? `${identite.raisonSociale} (Chronova)${identite.adresse ? `, ${identite.adresse}` : ""}${identite.email ? `, ${identite.email}` : ""}`
            : "[nom, adresse postale et adresse e-mail du vendeur — à compléter]"}{" "}
          :
        </p>
        <p>
          Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien
          ci-dessous :
        </p>
        <p>Numéro de commande : ……………………………</p>
        <p>Commandé le : …………………… / reçu le : ……………………</p>
        <p>Nom du consommateur : ……………………………</p>
        <p>Adresse du consommateur : ……………………………</p>
        <p>Signature (uniquement en cas d&apos;envoi sur papier) : ……………………</p>
        <p>Date : ……………………</p>
      </div>
    </LegalPage>
  );
}
