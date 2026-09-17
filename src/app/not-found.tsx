import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function Introuvable() {
  return (
    <>
      <Header />
      <main
        id="contenu"
        className="mx-auto flex max-w-content flex-col items-start"
        style={{ paddingInline: "var(--gutter)", paddingBlock: "var(--section-y)" }}
      >
        <p className="type-mono text-fg-soft">Erreur 404</p>
        <h1 className="type-display-2 mt-4 max-w-[18ch]">Cette page n&apos;existe pas.</h1>
        <p className="type-lead measure mt-6 text-fg-soft">
          Le lien est peut-être ancien, ou la page a changé d&apos;adresse. La collection et le
          configurateur, eux, sont toujours là.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <ButtonLink href="/composer">Composer ma montre</ButtonLink>
          <ButtonLink href="/" variant="contour">
            Retour à l&apos;accueil
          </ButtonLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
