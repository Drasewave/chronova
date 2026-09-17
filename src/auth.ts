import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/db";
import { envoyerCourriel } from "@/lib/email";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "CLIENT" | "ADMIN" } & DefaultSession["user"];
  }
}

/**
 * Connexion par lien magique.
 *
 * Aucun mot de passe n'est stocké : il n'y a donc rien à faire fuiter, et aucun
 * parcours « mot de passe oublié » à maintenir. Le jeton de vérification vit en
 * base et expire en trente minutes.
 */
const lienMagique: Provider = {
  id: "resend",
  type: "email",
  name: "Lien par e-mail",
  from: process.env.RESEND_FROM ?? "Chronova <atelier@exemple.fr>",
  maxAge: 30 * 60,
  options: {},
  async sendVerificationRequest({ identifier, url }) {
    await envoyerCourriel({
      to: identifier,
      subject: "Votre lien de connexion à Chronova",
      text: [
        "Bonjour,",
        "",
        "Voici votre lien de connexion à Chronova. Il est valable trente minutes et ne peut servir qu'une fois :",
        "",
        url,
        "",
        "Si vous n'avez pas demandé à vous connecter, ignorez ce message : personne ne peut accéder à votre compte sans ce lien.",
        "",
        "— L'atelier Chronova",
      ].join("\n"),
    });
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [lienMagique],
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion/verification",
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
});
