import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Vérifiez votre boîte mail",
  robots: { index: false, follow: false },
};

export default function Verification() {
  return (
    <Section fond="papier">
      <div className="mx-auto max-w-[34rem]">
        <p className="type-mono text-fg-soft">Presque</p>
        <h1 className="type-display-2 mt-4">Vérifiez votre boîte mail</h1>
        <p className="type-lead mt-6 text-fg-soft">
          Un lien de connexion vient de partir. Il est valable trente minutes et ne fonctionne
          qu&apos;une fois.
        </p>
        <p className="type-body mt-6 text-fg-soft">
          Rien n&apos;arrive ? Regardez dans les indésirables, puis vérifiez l&apos;orthographe de
          l&apos;adresse. Vous pouvez demander un nouveau lien sans attendre.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <ButtonLink href="/connexion" variant="contour">
            Demander un autre lien
          </ButtonLink>
          <ButtonLink href="/" variant="discret">
            Retour à l&apos;accueil
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
