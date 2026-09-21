import { ORDRE_GAMMES, cheminGamme } from "@/lib/content/gammes";
import { STYLE_LABELS } from "@/lib/data/types";

export interface LienNav {
  href: string;
  label: string;
}

export interface EntreeNav extends LienNav {
  /** Sous-entrées : un panneau au survol et au focus dans l'en-tête, une sous-liste dans le tiroir. */
  sousLiens?: readonly LienNav[];
}

/** Les gammes : une page par style de montre. */
export const NAV_GAMMES: readonly LienNav[] = ORDRE_GAMMES.map((style) => ({
  href: cheminGamme(style),
  label: STYLE_LABELS[style],
}));

/** L'ancre de la liste filtrable, sous les gammes, sur la page Collection. */
export const LIEN_TOUS_LES_MODELES: LienNav = {
  href: "/collection#tous-les-modeles",
  label: "Tous les modèles",
};

/** Navigation principale. Une seule source pour l'en-tête, le tiroir et le pied de page. */
export const NAV_PRINCIPALE: readonly EntreeNav[] = [
  { href: "/collection", label: "Collection", sousLiens: [...NAV_GAMMES, LIEN_TOUS_LES_MODELES] },
  { href: "/l-horloger", label: "L'horloger" },
  { href: "/entretien-garantie", label: "Entretien & garantie" },
  { href: "/contact", label: "Contact" },
];

export const NAV_PIED = {
  gammes: [...NAV_GAMMES, LIEN_TOUS_LES_MODELES],
  maison: [
    { href: "/l-horloger", label: "L'horloger" },
    { href: "/collection", label: "Collection" },
    { href: "/composer", label: "Composer ma montre" },
    { href: "/sur-mesure", label: "Pièce unique" },
  ],
  aide: [
    { href: "/faq", label: "Questions fréquentes" },
    { href: "/entretien-garantie", label: "Entretien & garantie" },
    { href: "/contact", label: "Nous écrire" },
    { href: "/compte/commandes", label: "Suivre ma commande" },
  ],
  legal: [
    { href: "/mentions-legales", label: "Mentions légales" },
    { href: "/cgv", label: "Conditions de vente" },
    { href: "/cgu", label: "Conditions d'utilisation" },
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/cookies", label: "Cookies" },
  ],
};
