import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Sessions des comptes à mot de passe.
 *
 * Auth.js garde ses sessions en base (stratégie « database ») : c'est ce qui permet
 * de couper un accès sur-le-champ (suppression de compte, rôle retiré). Son
 * fournisseur « Credentials » imposerait des jetons JWT, impossibles à révoquer.
 * On ouvre donc la session nous-mêmes, exactement comme Auth.js le ferait : une
 * ligne `Session` et le cookie qu'`auth()` relit ensuite via l'adaptateur Prisma.
 */
export const DUREE_SESSION_S = 60 * 60 * 24 * 30;

// En https (vps.orvanes.tech), le cookie devient Secure.
const SECURISE = (process.env.AUTH_URL ?? "").startsWith("https:");

/** Nom standard d'Auth.js : le proxy (src/proxy.ts) et la page /cookies le connaissent. */
export const COOKIE_SESSION = SECURISE ? "__Secure-authjs.session-token" : "authjs.session-token";

/** Options du cookie, partagées avec la configuration d'Auth.js (src/auth.ts). */
export const OPTIONS_COOKIE_SESSION = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: BASE_PATH,
  secure: SECURISE,
};

export async function ouvrirSession(userId: string): Promise<void> {
  const sessionToken = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + DUREE_SESSION_S * 1000);
  await prisma.session.create({ data: { sessionToken, userId, expires } });
  (await cookies()).set(COOKIE_SESSION, sessionToken, { ...OPTIONS_COOKIE_SESSION, expires });
}
