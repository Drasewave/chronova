import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormulaireConnexion, FormulaireInscription } from "@/components/compte/formulaire-connexion";
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
        <h1 className="type-display-2">Se connecter</h1>
        <p className="type-body mt-6 text-fg-soft">
          Avec votre adresse e-mail et votre mot de passe. Pas encore de compte ? Créez-le juste
          en dessous : il sert à suivre vos commandes et vos demandes à l&apos;atelier.
        </p>

        <div className="mt-10 rounded-card border border-rule bg-panel p-7 sm:p-8">
          <FormulaireConnexion suite={destination} />
        </div>

        <h2 className="type-title-1 mt-14">Créer un compte</h2>
        <div className="mt-6 rounded-card border border-rule bg-panel p-7 sm:p-8">
          <FormulaireInscription suite={destination} />
        </div>

        <p className="type-caption mt-8 text-fg-soft">
          Votre adresse e-mail sert à vous identifier, puis à vous envoyer les e-mails de suivi de
          vos commandes. Votre mot de passe n&apos;est jamais conservé en clair. Rien d&apos;autre : le détail est dans la{" "}
          <Link href="/confidentialite" className="link-underline text-accent-ink">
            politique de confidentialité
          </Link>
          . Les conditions de vente ne vous sont demandées qu&apos;au moment de commander.
        </p>
      </div>
    </Section>
  );
}
