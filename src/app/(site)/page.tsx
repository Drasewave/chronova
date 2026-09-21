import type { Metadata } from "next";
import { ClosingCta } from "@/components/home/closing-cta";
import { ExplodedView } from "@/components/home/exploded-view";
import { FaqSection } from "@/components/home/faq-section";
import { Hero } from "@/components/home/hero";
import { ModelsSection } from "@/components/home/models-section";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { Watchmaker } from "@/components/home/watchmaker";
import { getCatalogue, getModels } from "@/lib/data/queries";

export const metadata: Metadata = {
  // `absolute` : sans lui le gabarit « %s · Chronova » ajouterait une seconde
  // fois le nom de la maison au titre de l'accueil.
  title: { absolute: "Chronova — montres mécaniques assemblées à la main" },
  description:
    "Quatre bases mécaniques à composer : cadran, aiguilles, lunette, couronne, bracelet. Chaque montre est assemblée, réglée et contrôlée 72 heures dans un atelier indépendant.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chronova.fr";

/**
 * Données structurées de l'atelier : ce que les moteurs et les assistants IA
 * lisent pour savoir qui parle. Volontairement sans adresse ni téléphone tant
 * qu'ils ne sont pas saisis — on n'annonce rien d'inventé.
 */
const ORGANISATION = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  "@id": `${SITE}/#atelier`,
  name: "Chronova",
  url: SITE,
  description:
    "Atelier horloger indépendant : montres mécaniques composées en ligne par leur propriétaire, puis assemblées, réglées et contrôlées à la main.",
  inLanguage: "fr-FR",
  areaServed: "FR",
  currenciesAccepted: "EUR",
  hasMerchantReturnPolicy: {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "FR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    merchantReturnLink: `${SITE}/cgv`,
  },
};

/** Le catalogue vient de la base : on rafraîchit la page plutôt que de la figer. */
export const revalidate = 300;

export default async function Accueil() {
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);
  const vedette = modeles.find((modele) => modele.slug === "abysse-40") ?? modeles[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION) }}
      />
      {vedette && <Hero catalogue={catalogue} vedette={vedette} />}
      <ModelsSection catalogue={catalogue} modeles={modeles} />
      <ExplodedView />
      <Process />
      <Watchmaker />
      <Testimonials />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
