import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { BASE_PATH } from "@/lib/base-path";
import { COOKIE_SESSION, DUREE_SESSION_S, OPTIONS_COOKIE_SESSION } from "@/lib/securite/session";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "CLIENT" | "ADMIN" } & DefaultSession["user"];
  }
}

/**
 * Comptes à adresse e-mail et mot de passe.
 *
 * La connexion et l'inscription sont des Actions (src/app/actions/auth.ts) qui
 * vérifient le mot de passe puis ouvrent la session en base (src/lib/securite/session.ts).
 * Auth.js ne fait plus que lire et fermer ces sessions : `auth()`, `signOut()`.
 * Aucun fournisseur n'est déclaré — le lien magique a été retiré.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [],
  session: { strategy: "database", maxAge: DUREE_SESSION_S },
  cookies: { sessionToken: { name: COOKIE_SESSION, options: OPTIONS_COOKIE_SESSION } },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  callbacks: {
    /** Le rôle voyage dans la session : le CRM le vérifie à chaque écriture. */
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: "CLIENT" | "ADMIN" }).role ?? "CLIENT";
      return session;
    },
  },
  trustHost: true,
  // L'API d'Auth.js vit sous le préfixe du site.
  basePath: `${BASE_PATH}/api/auth`,
});
