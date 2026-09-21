import type { Metadata } from "next";
import Link from "next/link";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";
import { HEBERGEUR, lireIdentiteLegale, mediateurChoisi } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Éditeur, hébergeur, directeur de la publication et médiateur de la consommation du site Chronova.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/mentions-legales" },
};

/* Les informations légales viennent du CRM : elles changent une fois, à
   l'immatriculation, puis plus jamais. Une revalidation quotidienne suffit,
   et l'écran Paramètres invalide la page à l'enregistrement. */
export const revalidate = 86400;

export default async function MentionsLegales() {
  const identite = await lireIdentiteLegale();

  return (
    <LegalPage
      titre="Mentions légales"
      chapo="Les informations que tout site marchand français doit rendre accessibles, en application de l'article 1-1 de la loi du 21 juin 2004 pour la confiance dans l'économie numérique."
      miseAJour="[à dater lors de la mise en ligne]"
    >
      <h2>Éditeur du site</h2>
      {identite.raisonSociale ? (
        <p>
          {identite.raisonSociale}, entrepreneur individuel (EI), exerçant sous le nom commercial
          Chronova.
        </p>
      ) : (
        <FillMe>nom et prénom de l&apos;entrepreneur individuel, suivis de « EI »</FillMe>
      )}
      {identite.adresse ? (
        <p className="whitespace-pre-line">{identite.adresse}</p>
      ) : (
        <FillMe>adresse de l&apos;établissement</FillMe>
      )}
      {identite.siret ? (
        <p>
          SIRET <span data-numeric>{identite.siret}</span>
        </p>
      ) : (
        <FillMe>numéro SIRET</FillMe>
      )}
      {identite.immatriculation ? (
        <p>{identite.immatriculation}</p>
      ) : (
        <FillMe>immatriculation au RNE (artisan) ou au RCS (commerçant), avec la ville</FillMe>
      )}
      {identite.tva ? (
        <p>
          TVA intracommunautaire <span data-numeric>{identite.tva}</span>
        </p>
      ) : (
        <FillMe>
          numéro de TVA intracommunautaire, ou la mention « TVA non applicable, article 293 B du CGI » en franchise en base
        </FillMe>
      )}
      {identite.email ? (
        <p>
          E-mail : <a href={`mailto:${identite.email}`}>{identite.email}</a>
        </p>
      ) : (
        <FillMe>adresse e-mail de contact</FillMe>
      )}
      {identite.telephone ? (
        <p>
          Téléphone : <span data-numeric>{identite.telephone}</span>
        </p>
      ) : (
        <FillMe>numéro de téléphone</FillMe>
      )}

      <h2>Directeur de la publication</h2>
      {identite.directeurPublication ? (
        <p>{identite.directeurPublication}</p>
      ) : (
        <FillMe>nom du directeur de la publication (l&apos;entrepreneur lui-même)</FillMe>
      )}

      <h2>Hébergement</h2>
      <p>
        Le site et sa base de données sont hébergés sur {HEBERGEUR.service}, service fourni par{" "}
        {HEBERGEUR.nom}, {HEBERGEUR.adresse}. Téléphone :{" "}
        <span data-numeric>{HEBERGEUR.telephone}</span>.
      </p>
      <p>
        <FillMe inline>région Oracle Cloud de l&apos;instance, et entité Oracle figurant au contrat</FillMe>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes et illustrations de ce site, y compris les rendus de montres générés par le
        configurateur, sont la propriété de l&apos;éditeur. Leur reproduction sans autorisation
        écrite est interdite.
      </p>
      <p>
        Les noms de calibres cités (NH34, NH35, NH36, NH38, VK64) sont des références de mouvements
        produits par leur fabricant et sont mentionnés à titre d&apos;information technique.
        Chronova n&apos;est ni affiliée à ce fabricant, ni agréée par lui.
      </p>

      <h2>Médiation de la consommation</h2>
      {mediateurChoisi(identite) ? (
        <>
          <p>
            Conformément à l&apos;article L612-1 du Code de la consommation, tout consommateur peut
            recourir gratuitement au médiateur dont relève l&apos;atelier, après une réclamation
            écrite restée sans solution :
          </p>
          <p>
            {identite.mediateurNom}
            {identite.mediateurAdresse ? `, ${identite.mediateurAdresse}` : ""},{" "}
            <a href={identite.mediateurSite} rel="noopener noreferrer">
              {identite.mediateurSite}
            </a>
          </p>
        </>
      ) : (
        <FillMe>[MÉDIATEUR À CHOISIR] nom, adresse postale et site du médiateur, après adhésion</FillMe>
      )}

      <h2>Filières de reprise (REP)</h2>
      {identite.identifiantRep ? (
        <p>
          Identifiant unique délivré par l&apos;ADEME :{" "}
          <span data-numeric>{identite.identifiantRep}</span>.
        </p>
      ) : (
        <FillMe>identifiant unique REP délivré par l&apos;ADEME (emballages ; piles et équipements électriques pour le chronographe méca-quartz)</FillMe>
      )}

      <h2>Conditions et données personnelles</h2>
      <p>
        La vente est régie par les <Link href="/cgv">conditions générales de vente</Link>,
        l&apos;usage du site et du compte par les{" "}
        <Link href="/cgu">conditions générales d&apos;utilisation</Link>. Le traitement des données
        personnelles est décrit dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Signaler un contenu</h2>
      <p>
        Pour toute demande de rectification ou signalement concernant ce site, écrivez à
        l&apos;adresse de contact ci-dessus ou passez par le{" "}
        <Link href="/contact">formulaire de contact</Link>.
      </p>
    </LegalPage>
  );
}
