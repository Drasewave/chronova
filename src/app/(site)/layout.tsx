import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import { IntroCurtain } from "@/components/intro/intro-curtain";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Sans JavaScript, rien ne peut déclencher les apparitions au défilement :
          on rend leur état visible par défaut. */}
      <noscript>
        <style>{`[data-reveal="pending"]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      <IntroCurtain />
      <SmoothScroll />
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      {/* Pas de bandeau de consentement : le site ne dépose que des traceurs
          strictement nécessaires (session, panier), exemptés par la CNIL. Le
          jour où une mesure d'audience ou un service tiers traçant arrive, il
          faut AVANT un bandeau « Tout refuser / Tout accepter » de même poids,
          un chargement du script après accord seulement, un choix conservé six
          mois au plus, et un lien « Gérer mes cookies » dans le pied de page.
          L'ancien bandeau est dans l'historique git (cookie-banner.tsx). */}
    </>
  );
}
