import type { Metadata } from "next";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  alternates: { canonical: "/cgv" },
};

export default function Cgv() {
  return (
    <LegalPage
      surtitre="Conditions de vente"
      titre="Conditions générales de vente"
      chapo="Ce document décrit ce qui est vendu, comment, à quel prix et dans quelles conditions. Il est volontairement écrit en français courant."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <p className="type-mono text-alert">
        Document à faire relire par un juriste avant toute mise en ligne. Le texte ci-dessous en
        fixe la structure et les points à traiter ; il n&apos;a pas valeur de conseil juridique.
      </p>

      <h2>1. Objet et vendeur</h2>
      <FillMe>identité complète du vendeur, reprise des mentions légales</FillMe>
      <p>
        Les présentes conditions régissent la vente de montres mécaniques assemblées à la demande,
        ainsi que les prestations d&apos;entretien associées.
      </p>

      <h2>2. Produits</h2>
      <p>
        Chaque montre est assemblée après commande, selon la configuration choisie par le client
        dans le configurateur. Les rendus affichés sont des représentations fidèles mais
        schématiques : elles ne remplacent pas une photographie et de légères différences de teinte
        sont possibles entre l&apos;écran et la pièce réelle.
      </p>
      <p>
        Les caractéristiques techniques annoncées (diamètre, étanchéité, calibre) sont celles des
        pièces employées. L&apos;étanchéité est exprimée selon la norme ISO 22810 et correspond à
        une pression statique en laboratoire, non à une profondeur d&apos;utilisation.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison affichés
        avant validation de la commande. Le prix retenu est celui affiché au moment de la commande.
      </p>
      <FillMe>régime de TVA applicable (assujetti ou franchise en base)</FillMe>

      <h2>4. Commande</h2>
      <p>
        La commande devient ferme à la validation du paiement. Un e-mail de confirmation récapitule
        la configuration, le prix et le délai d&apos;assemblage estimé.
      </p>
      <p>
        L&apos;atelier se réserve le droit de refuser une commande en cas d&apos;indisponibilité
        durable d&apos;une pièce ; le client en est informé et intégralement remboursé.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s&apos;effectue en ligne par carte bancaire via Stripe. Aucune donnée de carte
        ne transite par ce site ni n&apos;y est conservée.
      </p>

      <h2>6. Délais et livraison</h2>
      <p>
        Le délai annoncé court à compter du paiement. Il dépend des pièces à commander et est affiché
        avant la validation, puis rappelé dans l&apos;e-mail de confirmation. En cas de retard
        significatif, le client est informé et peut demander l&apos;annulation avec remboursement.
      </p>
      <FillMe>zones de livraison, transporteurs et délais d&apos;acheminement</FillMe>

      <h2>7. Droit de rétractation</h2>
      <p>
        Les montres vendues sur ce site sont assemblées selon une configuration choisie par le
        client. Elles relèvent <strong>a priori</strong> de l&apos;exception au droit de
        rétractation prévue à l&apos;article L221-28 3° du Code de la consommation, qui vise les
        biens confectionnés selon les spécifications du consommateur ou nettement personnalisés.
      </p>
      <p className="type-mono text-alert">
        [À FAIRE VALIDER PAR UN JURISTE] — la portée exacte de cette exception dépend du degré de
        personnalisation. Une configuration assemblée à partir de pièces de catalogue pourrait ne
        pas être considérée comme « nettement personnalisée ». Faire trancher avant mise en ligne,
        et adapter en conséquence le récapitulatif de commande, qui doit recueillir l&apos;accord
        exprès du client sur la perte de son droit de rétractation.
      </p>
      <p>
        Cette exception ne retire rien aux garanties légales ci-dessous : un défaut reste un défaut.
      </p>

      <h2>8. Garanties légales</h2>
      <p>
        Indépendamment de toute garantie commerciale, le vendeur reste tenu de la garantie légale de
        conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie des
        vices cachés (articles 1641 et suivants du Code civil).
      </p>
      <p>
        La garantie de conformité s&apos;exerce pendant deux ans à compter de la délivrance, sans
        que le consommateur ait à prouver l&apos;antériorité du défaut.
      </p>

      <h2>9. Garantie commerciale de l&apos;atelier</h2>
      <FillMe>durée, étendue et modalités de la garantie commerciale</FillMe>

      <h2>10. Réclamations et médiation</h2>
      <FillMe>adresse de réclamation et coordonnées du médiateur de la consommation</FillMe>

      <h2>11. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la politique de confidentialité, qui
        fait partie intégrante des présentes conditions.
      </p>

      <h2>12. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution
        amiable sera recherchée avant toute action judiciaire.
      </p>
    </LegalPage>
  );
}
