import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormulaireConnexion } from "@/components/compte/formulaire-connexion";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Se connecter",
  robots: { index: false, follow: false },
};

export default async function Connexion(props: PageProps<"/connexion">) {
  const session = await auth();
  const { suite } = await props.searchParams;
  const destination = typeof suite === "string" && suite.startsWith("/") ? suite : "/compte";

  if (session?.user) redirect(destination);

  return (
    <Section fond="papier">
      <div className="mx-auto max-w-[34rem]">
        <p className="type-mono text-fg-soft">Votre compte</p>
        <h1 className="type-display-2 mt-4">Se connecter</h1>
        <p className="type-body mt-6 text-fg-soft">
          Pas de mot de passe à retenir : indiquez votre adresse, vous recevez un lien de connexion
          valable trente minutes. C&apos;est aussi ce lien qui crée votre compte la première fois.
        </p>

        <div className="mt-10 rounded-card border border-rule bg-panel p-7 sm:p-8">
          <FormulaireConnexion suite={destination} />
        </div>

        <p className="type-caption mt-8 text-fg-soft">
          En vous connectant, vous acceptez les{" "}
          <Link href="/cgv" className="link-underline text-accent">
            conditions de vente
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" className="link-underline text-accent">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
