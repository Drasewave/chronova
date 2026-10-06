import { cookies } from "next/headers";
import { CrmShell } from "@/components/atelier/crm-shell";
import { exigerAdmin } from "@/lib/securite/acces";
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
  const admin = await exigerAdmin();

  const theme = lireTheme((await cookies()).get(COOKIE_THEME)?.value);

  return (
    <CrmShell nom={admin.name ?? admin.email ?? "Atelier"} theme={theme}>
      {props.children}
    </CrmShell>
  );
}
