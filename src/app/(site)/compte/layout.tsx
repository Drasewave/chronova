import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CompteNav } from "@/components/compte/compte-nav";
import { Section } from "@/components/ui/section";

/**
 * Le proxy n'a fait qu'un contrôle optimiste sur la présence d'un cookie.
 * La vraie vérification est ici, au plus près de la donnée.
 */
export default async function CompteLayout(props: LayoutProps<"/compte">) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/compte");

  return (
    <Section fond="papier">
      <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <CompteNav prenom={session.user.name ?? session.user.email ?? ""} />
        <div className="min-w-0">{props.children}</div>
      </div>
    </Section>
  );
}
