/** Navigation principale. Une seule source pour l'en-tête, le tiroir et le pied de page. */
export const NAV_PRINCIPALE = [
  { href: "/collection", label: "Collection" },
  { href: "/l-horloger", label: "L'horloger" },
  { href: "/entretien-garantie", label: "Entretien & garantie" },
  { href: "/contact", label: "Contact" },
] as const;

export const NAV_PIED = {
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
    { href: "/confidentialite", label: "Confidentialité" },
    { href: "/cookies", label: "Cookies" },
  ],
} as const;
