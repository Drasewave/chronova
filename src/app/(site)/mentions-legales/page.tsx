import type { Metadata } from "next";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: true, follow: true },
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegales() {
  return (
    <LegalPage
      surtitre="Informations légales"
      titre="Mentions légales"
      chapo="Les informations que tout site marchand français doit rendre accessibles, en application de la loi pour la confiance dans l'économie numérique."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Éditeur du site</h2>
      <FillMe>raison sociale ou nom de l&apos;entrepreneur individuel</FillMe>
      <FillMe>forme juridique et capital social le cas échéant</FillMe>
      <FillMe>adresse du siège social</FillMe>
      <FillMe>numéro SIRET et ville du RCS ou du répertoire des métiers</FillMe>
      <FillMe>numéro de TVA intracommunautaire</FillMe>
      <FillMe>téléphone et adresse e-mail de contact</FillMe>
      <FillMe>nom du directeur de la publication</FillMe>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
      </p>
      <p>
        La base de données est hébergée dans l&apos;Union européenne.{" "}
        <FillMe inline>hébergeur de la base et région exacte</FillMe>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies et illustrations de ce site, y compris les rendus de montres, sont
        la propriété de l&apos;éditeur. Leur reproduction sans autorisation écrite est interdite.
      </p>
      <p>
        Les noms de calibres cités (NH34, NH35, NH38) sont des références de mouvements produits par
        leurs fabricants respectifs et sont mentionnés à titre d&apos;information technique.
      </p>

      <h2>Médiation de la consommation</h2>
      <p>
        Tout professionnel vendant à des consommateurs doit adhérer à un dispositif de médiation et
        en communiquer les coordonnées.
      </p>
      <FillMe>nom et coordonnées du médiateur de la consommation</FillMe>
      <p>
        La plateforme européenne de règlement en ligne des litiges est également accessible aux
        consommateurs.
      </p>

      <h2>Signaler un contenu</h2>
      <p>
        Pour toute demande de rectification ou signalement concernant ce site, écrivez à
        l&apos;adresse de contact ci-dessus. Une réponse vous parviendra dans les meilleurs délais.
      </p>
    </LegalPage>
  );
}
