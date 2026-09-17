export interface EntreeCrm {
  href: string;
  label: string;
  /** Ce que l'horloger vient y faire, affiché en légende dans la barre latérale. */
  aide: string;
}

export const NAV_CRM: { titre: string; entrees: EntreeCrm[] }[] = [
  {
    titre: "Atelier",
    entrees: [
      { href: "/atelier", label: "Tableau de bord", aide: "Ce qu'il y a à faire aujourd'hui" },
      { href: "/atelier/commandes", label: "Commandes", aide: "Kanban par étape d'atelier" },
      { href: "/atelier/stock", label: "Stock", aide: "Pièces, réservations, alertes" },
    ],
  },
  {
    titre: "Relation",
    entrees: [
      { href: "/atelier/clients", label: "Clients", aide: "Fiches, historique, RGPD" },
      { href: "/atelier/demandes", label: "Demandes", aide: "Contact et sur-mesure" },
      { href: "/atelier/sav", label: "Après-vente", aide: "Garanties et réparations" },
    ],
  },
  {
    titre: "Configuration",
    entrees: [
      { href: "/atelier/catalogue", label: "Catalogue", aide: "Modèles, options, règles" },
      { href: "/atelier/fournisseurs", label: "Fournisseurs", aide: "Contacts et commandes" },
      { href: "/atelier/parametres", label: "Paramètres", aide: "Délais, port, e-mails" },
    ],
  },
];
