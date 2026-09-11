import type { Metadata } from "next";
import { ClosingCta } from "@/components/home/closing-cta";
import { ExplodedView } from "@/components/home/exploded-view";
import { FaqSection } from "@/components/home/faq-section";
import { Hero } from "@/components/home/hero";
import { ModelsSection } from "@/components/home/models-section";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { Watchmaker } from "@/components/home/watchmaker";

export const metadata: Metadata = {
  title: "Chronova — montres mécaniques assemblées à la main",
  description:
    "Quatre bases mécaniques à composer : cadran, aiguilles, lunette, couronne, bracelet. Chaque montre est assemblée, réglée et contrôlée 72 heures dans un atelier indépendant.",
  alternates: { canonical: "/" },
};

export default function Accueil() {
  return (
    <>
      <Hero />
      <ModelsSection />
      <ExplodedView />
      <Process />
      <Watchmaker />
      <Testimonials />
      <FaqSection />
      <ClosingCta />
    </>
  );
}
