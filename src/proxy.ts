import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (ex-middleware, renommé dans Next 16).
 *
 * Il ne fait qu'un contrôle OPTIMISTE : présence d'un cookie de session. Il ne
 * lit pas la base et ne décide donc d'aucun droit — la vraie vérification, rôle
 * compris, est faite dans les gabarits `/compte` et `/atelier`, au plus près de
 * la donnée. Un cookie forgé ne donne accès à rien.
 */
const COOKIES_SESSION = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const protegee =
    request.nextUrl.pathname.startsWith("/compte") ||
    request.nextUrl.pathname.startsWith("/atelier");

  if (!protegee) return NextResponse.next();

  const connecte = COOKIES_SESSION.some((nom) => request.cookies.has(nom));
  if (connecte) return NextResponse.next();

  const connexion = new URL("/connexion", request.url);
  connexion.searchParams.set("suite", request.nextUrl.pathname);
  return NextResponse.redirect(connexion);
}

export const config = {
  matcher: ["/compte/:path*", "/atelier/:path*"],
};
