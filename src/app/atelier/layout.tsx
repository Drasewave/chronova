import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { CrmShell } from "@/components/atelier/crm-shell";
import { COOKIE_THEME, lireTheme } from "@/lib/atelier/theme";

export const metadata = {
  title: { default: "Atelier", template: "%s · Atelier Chronova" },
  robots: { index: false, follow: false },
};

/**
 * Accès au back-office.
 *
 * Un visiteur non administrateur reçoit un 404, pas un 403 : répondre
 * « interdit » confirmerait que l'adresse existe.
 */
export default async function AtelierLayout(props: LayoutProps<"/atelier">) {
  const session = await auth();
  if (!session?.user) redirect("/connexion?suite=/atelier");
  if (session.user.role !== "ADMIN") notFound();

  const theme = lireTheme((await cookies()).get(COOKIE_THEME)?.value);

  return (
    <CrmShell nom={session.user.name ?? session.user.email ?? "Atelier"} theme={theme}>
      {props.children}
    </CrmShell>
  );
}
