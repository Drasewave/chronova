import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { BASE_PATH } from "@/lib/base-path";

/**
 * Next retire le préfixe du site (`/chronova`) avant d'appeler la route, alors
 * qu'Auth.js attend son chemin complet (`/chronova/api/auth/...`) : sans cette
 * correction il ne reconnaît pas l'action et répond « Bad request ».
 */
function avecPrefixe(requete: NextRequest): NextRequest {
  const url = new URL(requete.url);
  if (url.pathname.startsWith(`${BASE_PATH}/`)) return requete;
  url.pathname = `${BASE_PATH}${url.pathname}`;
  return new NextRequest(url, requete);
}

export const GET = (requete: NextRequest) => handlers.GET(avecPrefixe(requete));
export const POST = (requete: NextRequest) => handlers.POST(avecPrefixe(requete));
