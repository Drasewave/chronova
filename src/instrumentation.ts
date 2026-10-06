import type { Instrumentation } from "next";

export async function register() {
  // Node seulement : env.ts est réservé au serveur et lit process.env.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { SITE, validerEnv } = await import("@/lib/env");
  validerEnv();
  console.log(JSON.stringify({ niveau: "info", message: "démarrage", site: SITE }));
}

/** Erreurs serveur en JSON, une ligne par erreur : exploitable dans le journal systemd. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const e = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      niveau: "erreur",
      message: e.message,
      digest: e.digest,
      chemin: request.path,
      methode: request.method,
      route: context.routePath,
      type: context.routeType,
    }),
  );
};
