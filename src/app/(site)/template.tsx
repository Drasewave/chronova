import { ViewTransition, type ReactNode } from "react";

/**
 * Transition de page du site public.
 *
 * Un gabarit (`template`) est remonté à chaque navigation, contrairement à une
 * mise en page : c'est ce qui fait jouer `exit` sur la page quittée et `enter`
 * sur la nouvelle. Sans lui, seules les navigations portant un élément partagé
 * (la montre d'une carte vers sa fiche) s'animaient ; toutes les autres
 * coupaient net.
 *
 * Le mouvement lui-même est dans `globals.css` (`.page`) : fondu enchaîné et
 * 6 px de montée. `default="none"` : une mise à jour à l'intérieur d'une page
 * (filtres, configurateur) n'anime rien ici.
 */
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
