import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Contrôle d'accès à l'atelier, au plus près de la donnée.
 *
 * Un layout ne protège pas ses pages enfants (elles se rendent en parallèle) :
 * chaque page atelier appelle donc `exigerAdmin()` en tête. `cache` évite de
 * relire la session plusieurs fois dans une même requête (layout, page, actions).
 */
const lireAdmin = cache(async () => {
  const session = await auth();
  return session?.user ? { user: session.user, admin: session.user.role === "ADMIN" } : null;
});

/**
 * Pages : visiteur anonyme → connexion, autre rôle → 404 (répondre « interdit »
 * confirmerait que l'adresse existe).
 */
export async function exigerAdmin() {
  const acces = await lireAdmin();
  if (!acces) redirect("/connexion?suite=/atelier");
  if (!acces.admin) notFound();
  return acces.user;
}

/** Actions serveur : l'accès refusé est une erreur levée. */
export async function exigerAdminAction() {
  const acces = await lireAdmin();
  if (!acces?.admin) throw new Error("Accès refusé.");
  return acces.user;
}
