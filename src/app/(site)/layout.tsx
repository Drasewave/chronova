import type { ReactNode } from "react";
import { CookieBanner } from "@/components/layout/cookie-banner";
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
      <CookieBanner />
    </>
  );
}
