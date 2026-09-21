/**
 * Version des documents contractuels en vigueur.
 *
 * Elle est enregistrée avec chaque acceptation (commande, création de compte) :
 * c'est ce qui permet de savoir, des années plus tard, quel texte un client a
 * réellement accepté. À changer à CHAQUE modification de fond des CGV ou des
 * CGU, en même temps que la date « Mise à jour » de la page — et garder une
 * copie de l'ancienne version.
 */
export const VERSION_CGV = "cgv-1";
export const VERSION_CGU = "cgu-1";
