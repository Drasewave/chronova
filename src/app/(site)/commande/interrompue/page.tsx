import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Paiement interrompu",
  robots: { index: false, follow: false },
};

export default function Interrompue() {
  return (
    <Section fond="papier">
      <div className="mx-auto max-w-[40rem]">
        <p className="type-mono text-fg-soft">Rien n&apos;a été débité</p>
        <h1 className="type-display-2 mt-4">Paiement interrompu</h1>
        <p className="type-lead mt-6 text-fg-soft">
          Le paiement n&apos;est pas allé à son terme, et aucune somme n&apos;a été prélevée. Votre
          panier vous attend tel que vous l&apos;aviez laissé.
        </p>
        <p className="type-body mt-6 text-fg-soft">
          Si quelque chose a coincé — une carte refusée, une page qui ne répondait plus —
          dites-le-moi : il est possible de prendre la commande autrement.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <ButtonLink href="/panier">Revenir au panier</ButtonLink>
          <ButtonLink href="/contact" variant="contour">
            Signaler un problème
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
