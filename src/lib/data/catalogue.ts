import { createCatalogue, type Catalogue } from "@/lib/configurateur/catalogue";
import type { CompatibilityRule, Part, Step } from "@/lib/configurateur/types";

/**
 * CATALOGUE DE DÉMONSTRATION.
 *
 * Libellés, teintes, suppléments et disponibilités sont des EXEMPLES. Tout est
 * repris tel quel par le seed Prisma (phase 5) puis modifiable depuis le CRM,
 * sans toucher au code : ajouter un coloris, changer un prix, désactiver une
 * option ou écrire une règle de compatibilité s'y fait à la souris.
 *
 * Le champ `render` est la seule passerelle vers le dessin : il applique un
 * correctif à la configuration rendue. Les clés `svgPartKey` du registre y sont
 * référencées par les valeurs (`glaive`, `mercedes`, `cuir`…).
 */

export const STEPS: Step[] = [
  {
    key: "boitier",
    label: "Boîtier",
    intro: "Le diamètre est fixé par le boîtier : c'est lui qui décide du reste.",
    groups: [
      {
        key: "taille",
        label: "Diamètre",
        help: "Mesuré hors couronne. Le tour de poignet se choisit à l'étape bracelet.",
        selection: "unique",
        options: [
          { key: "37", label: "37 mm", priceDeltaCents: 0, partRef: "BOI-37", render: { caseSize: 37 } },
          { key: "38", label: "38 mm", priceDeltaCents: 0, partRef: "BOI-38", render: { caseSize: 38 } },
          { key: "39", label: "39 mm", priceDeltaCents: 0, partRef: "BOI-39", render: { caseSize: 39 } },
          { key: "40", label: "40 mm", priceDeltaCents: 0, partRef: "BOI-40", render: { caseSize: 40 } },
        ],
      },
      {
        key: "finition",
        label: "Finition",
        help: "Le brossé masque les micro-rayures, le poli les révèle mais accroche la lumière.",
        selection: "unique",
        options: [
          {
            key: "brosse",
            label: "Brossé",
            description: "Grain circulaire sur les flancs, arêtes polies.",
            priceDeltaCents: 0,
            render: { caseFinish: "brosse" },
          },
          {
            key: "poli",
            label: "Poli",
            description: "Miroir intégral. Plus habillé, plus sensible aux traces.",
            priceDeltaCents: 4000,
            render: { caseFinish: "poli" },
          },
          {
            key: "microbille",
            label: "Microbillé",
            description: "Mat profond, sans reflet. Le choix des montres de terrain.",
            priceDeltaCents: 4000,
            render: { caseFinish: "microbille" },
          },
        ],
      },
    ],
  },
  {
    key: "cadran",
    label: "Cadran",
    intro: "La pièce qu'on regarde cent fois par jour. Teinte, finition, index.",
    groups: [
      {
        key: "cadran-teinte",
        label: "Teinte",
        selection: "unique",
        options: [
          { key: "creme", label: "Crème émail", colorName: "Crème", colorHex: "#EFE7D6", priceDeltaCents: 0, partRef: "CAD-CRE", render: { dialColor: "#EFE7D6" } },
          { key: "bleu-abysse", label: "Bleu abysse", colorName: "Bleu abysse", colorHex: "#1E3448", priceDeltaCents: 0, partRef: "CAD-BLE", render: { dialColor: "#1E3448" } },
          { key: "vert-sauge", label: "Vert sauge", colorName: "Vert sauge", colorHex: "#3F4B39", priceDeltaCents: 0, partRef: "CAD-VER", render: { dialColor: "#3F4B39" } },
          { key: "saumon", label: "Saumon", colorName: "Saumon", colorHex: "#C98263", priceDeltaCents: 6000, partRef: "CAD-SAU", render: { dialColor: "#C98263" } },
          { key: "gris-ardoise", label: "Gris ardoise", colorName: "Gris ardoise", colorHex: "#474B50", priceDeltaCents: 0, partRef: "CAD-GRI", render: { dialColor: "#474B50" } },
          { key: "noir-mat", label: "Noir mat", colorName: "Noir mat", colorHex: "#26241F", priceDeltaCents: 0, partRef: "CAD-NOI", render: { dialColor: "#26241F" } },
        ],
      },
      {
        key: "cadran-finition",
        label: "Finition du cadran",
        selection: "unique",
        options: [
          {
            key: "soleille",
            label: "Soleillé",
            description: "Rayons fins depuis le centre : la teinte change avec l'angle.",
            priceDeltaCents: 0,
            render: { dialTexture: "soleille" },
          },
          {
            key: "mat",
            label: "Mat",
            description: "Aucune réflexion. Lecture garantie en plein soleil.",
            priceDeltaCents: 0,
            render: { dialTexture: "mat" },
          },
          {
            key: "emaille",
            label: "Émail",
            description: "Couches cuites puis polies. Profondeur laiteuse, teintes claires seulement.",
            priceDeltaCents: 9000,
            leadDaysDelta: 5,
            render: { dialTexture: "emaille" },
          },
        ],
      },
      {
        key: "index",
        label: "Index",
        selection: "unique",
        options: [
          {
            key: "batons",
            label: "Index bâtons",
            description: "Appliqués, cadre métal et remplissage luminescent.",
            priceDeltaCents: 0,
            render: { indexStyle: "batons" },
          },
          {
            key: "arabes",
            label: "Chiffres arabes",
            description: "Imprimés pleins, lecture immédiate de loin.",
            priceDeltaCents: 0,
            render: { indexStyle: "arabes" },
          },
        ],
      },
      {
        key: "date",
        label: "Guichet de date",
        selection: "unique",
        options: [
          { key: "avec", label: "Avec date", priceDeltaCents: 0, render: { showDate: true } },
          {
            key: "sans",
            label: "Sans date",
            description: "Cadran nu à 3 h. Le mouvement garde sa date, elle n'est pas affichée.",
            priceDeltaCents: 0,
            render: { showDate: false },
          },
        ],
      },
    ],
  },
  {
    key: "aiguilles",
    label: "Aiguilles",
    intro: "Chassées une à une au potence, puis vérifiées à la loupe.",
    groups: [
      {
        key: "aiguilles-forme",
        label: "Forme",
        selection: "unique",
        options: [
          { key: "glaive", label: "Glaive", description: "Deux arêtes vives qui se rejoignent en pointe.", priceDeltaCents: 0, partRef: "AIG-GLA", render: { handShape: "glaive" } },
          { key: "mercedes", label: "Mercedes", description: "Cercle à trois branches sur l'aiguille des heures.", priceDeltaCents: 3000, partRef: "AIG-MER", render: { handShape: "mercedes" } },
          { key: "crayon", label: "Crayon", description: "Bâtons droits à bout arrondi, largement luminescents.", priceDeltaCents: 0, partRef: "AIG-CRA", render: { handShape: "crayon" } },
        ],
      },
      {
        key: "aiguilles-metal",
        label: "Traitement",
        selection: "unique",
        options: [
          { key: "acier", label: "Acier poli", colorName: "Acier", colorHex: "#B0A899", priceDeltaCents: 0, render: { handMetal: "acier" } },
          { key: "dore", label: "Doré", colorName: "Doré", colorHex: "#C09755", priceDeltaCents: 5000, render: { handMetal: "dore" } },
          { key: "bleui", label: "Bleui au feu", colorName: "Bleu acier", colorHex: "#3F4F6C", priceDeltaCents: 7000, render: { handMetal: "bleui" } },
        ],
      },
      {
        key: "luminova",
        label: "Luminova",
        selection: "unique",
        options: [
          { key: "avec", label: "Avec luminova", description: "Index et aiguilles chargés à la lumière du jour.", priceDeltaCents: 0, render: { lume: true } },
          { key: "sans", label: "Sans luminova", description: "Aiguilles pleines. Plus sobre, invisible la nuit.", priceDeltaCents: 0, render: { lume: false } },
        ],
      },
    ],
  },
  {
    key: "lunette",
    label: "Lunette",
    intro: "Elle décide de l'allure générale bien plus que le cadran.",
    groups: [
      {
        key: "lunette-style",
        label: "Style",
        selection: "unique",
        options: [
          { key: "lisse", label: "Lisse", description: "Fine, sans relief. Elle s'efface.", priceDeltaCents: 0, partRef: "LUN-LIS", render: { bezelStyle: "lisse" } },
          { key: "cannelee", label: "Cannelée", description: "Soixante-douze crans, reflets en étoile.", priceDeltaCents: 6000, partRef: "LUN-CAN", render: { bezelStyle: "cannelee" } },
          { key: "plongee", label: "Plongée, 120 clics", description: "Unidirectionnelle, graduée soixante minutes.", priceDeltaCents: 12000, partRef: "LUN-PLO", render: { bezelStyle: "plongee" } },
        ],
      },
      {
        key: "insert-matiere",
        label: "Matière de l'insert",
        selection: "unique",
        optional: true,
        options: [
          { key: "aluminium", label: "Aluminium", description: "Patine avec le temps, se raye, se remplace facilement.", priceDeltaCents: 0, render: { insertMaterial: "aluminium" } },
          { key: "ceramique", label: "Céramique", description: "Garde sa teinte au soleil et ne se raye pratiquement pas.", priceDeltaCents: 8000, leadDaysDelta: 2, render: { insertMaterial: "ceramique" } },
        ],
      },
      {
        key: "insert-teinte",
        label: "Teinte de l'insert",
        selection: "unique",
        optional: true,
        options: [
          { key: "noir", label: "Noir", colorName: "Noir", colorHex: "#22201D", priceDeltaCents: 0, partRef: "INS-NOI", render: { insertColor: "#22201D" } },
          { key: "bleu-nuit", label: "Bleu nuit", colorName: "Bleu nuit", colorHex: "#1B2E42", priceDeltaCents: 0, partRef: "INS-BLE", render: { insertColor: "#1B2E42" } },
          { key: "vert-foret", label: "Vert forêt", colorName: "Vert forêt", colorHex: "#2C3B2C", priceDeltaCents: 0, partRef: "INS-VER", render: { insertColor: "#2C3B2C" } },
          { key: "gris-ardoise", label: "Gris ardoise", colorName: "Gris ardoise", colorHex: "#4A4E52", priceDeltaCents: 0, partRef: "INS-GRI", render: { insertColor: "#4A4E52" } },
        ],
      },
    ],
  },
  {
    key: "couronne",
    label: "Couronne",
    intro: "On la manipule chaque matin : sa prise compte autant que son dessin.",
    groups: [
      {
        key: "couronne-signature",
        label: "Signature",
        selection: "unique",
        options: [
          { key: "signee", label: "Signée Chronova", description: "Initiale gravée puis noircie à la main.", priceDeltaCents: 3000, partRef: "COU-SIG", render: { crownStyle: "signee" } },
          { key: "lisse", label: "Lisse", description: "Cannelures seules, aucune marque.", priceDeltaCents: 0, partRef: "COU-LIS", render: { crownStyle: "lisse" } },
        ],
      },
      {
        key: "couronne-metal",
        label: "Teinte",
        selection: "unique",
        options: [
          { key: "acier", label: "Acier", colorName: "Acier", colorHex: "#B0A899", priceDeltaCents: 0, render: { crownMetal: "acier" } },
          { key: "dore", label: "Doré", colorName: "Doré", colorHex: "#C09755", priceDeltaCents: 4000, render: { crownMetal: "dore" } },
          { key: "noir", label: "Noir PVD", colorName: "Noir", colorHex: "#3D372F", priceDeltaCents: 3000, render: { crownMetal: "noir" } },
        ],
      },
      {
        key: "couronne-vissee",
        label: "Vissage",
        selection: "unique",
        options: [
          { key: "vissee", label: "Vissée", description: "Deux joints, indispensable au-delà de 100 m.", priceDeltaCents: 4000 },
          { key: "poussoir", label: "Non vissée", description: "Simple poussoir. Réglage plus rapide, étanchéité moindre.", priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    key: "bracelet",
    label: "Bracelet",
    intro: "Le même boîtier change complètement de caractère selon le brin.",
    groups: [
      {
        key: "bracelet-type",
        label: "Type",
        selection: "unique",
        options: [
          { key: "acier-3-maillons", label: "Acier, trois maillons", priceDeltaCents: 0, partRef: "BRA-3M", render: { strapKind: "acier-3-maillons", strapColor: "#B0A899" } },
          { key: "acier-jubile", label: "Acier, jubilé", description: "Cinq maillons, les trois centraux polis.", priceDeltaCents: 9000, partRef: "BRA-JUB", render: { strapKind: "acier-jubile", strapColor: "#B0A899" } },
          { key: "cuir", label: "Cuir", description: "Tannage végétal, coutures à la main.", priceDeltaCents: 0, partRef: "BRA-CUI", render: { strapKind: "cuir" } },
          { key: "caoutchouc", label: "Caoutchouc", description: "Vulcanisé, insensible à l'eau de mer.", priceDeltaCents: 0, partRef: "BRA-CAO", render: { strapKind: "caoutchouc" } },
          { key: "nato", label: "NATO", description: "Sangle tissée, passe sous le boîtier.", priceDeltaCents: 0, partRef: "BRA-NAT", render: { strapKind: "nato" } },
        ],
      },
      {
        key: "bracelet-teinte",
        label: "Teinte",
        selection: "unique",
        optional: true,
        options: [
          { key: "fauve", label: "Cuir fauve", colorName: "Fauve", colorHex: "#8A5A33", priceDeltaCents: 0, render: { strapColor: "#8A5A33" } },
          { key: "chocolat", label: "Cuir chocolat", colorName: "Chocolat", colorHex: "#4A3728", priceDeltaCents: 0, render: { strapColor: "#4A3728" } },
          { key: "cuir-noir", label: "Cuir noir", colorName: "Noir", colorHex: "#2A2622", priceDeltaCents: 0, render: { strapColor: "#2A2622" } },
          { key: "caoutchouc-noir", label: "Caoutchouc noir", colorName: "Noir", colorHex: "#262320", priceDeltaCents: 0, render: { strapColor: "#262320" } },
          { key: "caoutchouc-bleu", label: "Caoutchouc bleu", colorName: "Bleu", colorHex: "#24384A", priceDeltaCents: 0, render: { strapColor: "#24384A" } },
          { key: "nato-kaki", label: "NATO kaki", colorName: "Kaki", colorHex: "#5D6152", priceDeltaCents: 0, render: { strapColor: "#5D6152" } },
          { key: "nato-marine", label: "NATO marine", colorName: "Marine", colorHex: "#2E3B4A", priceDeltaCents: 0, render: { strapColor: "#2E3B4A" } },
          { key: "nato-sable", label: "NATO sable", colorName: "Sable", colorHex: "#A08E6E", priceDeltaCents: 0, render: { strapColor: "#A08E6E" } },
        ],
      },
      {
        key: "poignet",
        label: "Tour de poignet",
        help: "Mesuré au mètre ruban, à plat, juste au-dessus de l'os. Le brin est ajusté avant l'envoi.",
        selection: "mesure",
        options: [
          { key: "150", label: "150 mm", priceDeltaCents: 0 },
          { key: "160", label: "160 mm", priceDeltaCents: 0 },
          { key: "170", label: "170 mm", priceDeltaCents: 0 },
          { key: "180", label: "180 mm", priceDeltaCents: 0 },
          { key: "190", label: "190 mm", priceDeltaCents: 0 },
          { key: "200", label: "200 mm", priceDeltaCents: 0 },
          { key: "210", label: "210 mm", priceDeltaCents: 0 },
        ],
      },
    ],
  },
  {
    key: "verre",
    label: "Verre",
    intro: "Saphir dans tous les cas : rien d'autre ne tient à l'usage quotidien.",
    groups: [
      {
        key: "verre-forme",
        label: "Forme",
        selection: "unique",
        options: [
          { key: "plat", label: "Saphir plat", description: "Silhouette basse, aucune déformation sur les bords.", priceDeltaCents: 0, partRef: "VER-PLA", render: { crystal: "plat" } },
          { key: "bombe", label: "Saphir bombé", description: "Galbe ancien ; la lumière file sur tout le pourtour.", priceDeltaCents: 7000, partRef: "VER-BOM", render: { crystal: "bombe" } },
        ],
      },
      {
        key: "antireflet",
        label: "Traitement antireflet",
        selection: "unique",
        options: [
          { key: "interne", label: "Antireflet interne", description: "Déposé sous le verre : il ne s'use pas au frottement.", priceDeltaCents: 4000, render: { antiGlare: true } },
          { key: "sans", label: "Sans traitement", priceDeltaCents: 0, render: { antiGlare: false } },
        ],
      },
    ],
  },
  {
    key: "mouvement",
    label: "Mouvement",
    intro: "Trois calibres automatiques japonais, tous réparables par n'importe quel horloger.",
    groups: [
      {
        key: "mouvement",
        label: "Calibre",
        selection: "unique",
        options: [
          {
            key: "nh35",
            label: "NH35 · automatique",
            description: "24 rubis, 21 600 A/h, arrêt de la trotteuse, remontage manuel, ~41 h de réserve.",
            priceDeltaCents: 0,
            partRef: "MOU-NH35",
            render: { movement: "NH35" },
          },
          {
            key: "nh34",
            label: "NH34 · GMT",
            description: "Ajoute une aiguille 24 h réglable indépendamment, pour un second fuseau.",
            priceDeltaCents: 18000,
            leadDaysDelta: 3,
            partRef: "MOU-NH34",
            render: { movement: "NH34" },
          },
          {
            key: "nh38",
            label: "NH38 · cœur ouvert",
            description: "Sans date, avec une ouverture sur le balancier à 9 h.",
            priceDeltaCents: 15000,
            leadDaysDelta: 2,
            partRef: "MOU-NH38",
            render: { movement: "NH38" },
          },
        ],
      },
      {
        key: "aiguille-24h",
        label: "Aiguille 24 heures",
        selection: "unique",
        optional: true,
        options: [
          { key: "fleche", label: "Flèche évidée", description: "Ne masque pas l'heure locale.", priceDeltaCents: 0 },
          { key: "baton-lume", label: "Bâton luminescent", description: "Lisible de nuit comme les autres aiguilles.", priceDeltaCents: 2000 },
        ],
      },
    ],
  },
  {
    key: "fond",
    label: "Fond",
    intro: "La face que vous ne verrez presque jamais, et qui reste la plus personnelle.",
    groups: [
      {
        key: "fond-type",
        label: "Type de fond",
        selection: "unique",
        options: [
          { key: "plein", label: "Fond plein", description: "Acier vissé, joint torique. Le plus étanche.", priceDeltaCents: 0, partRef: "FON-PLE", render: { caseback: "plein" } },
          { key: "transparent", label: "Fond transparent", description: "Saphir vissé : le mouvement travaille sous les yeux.", priceDeltaCents: 9000, leadDaysDelta: 2, partRef: "FON-TRA", render: { caseback: "transparent" } },
        ],
      },
      {
        key: "gravure",
        label: "Gravure personnalisée",
        help: "Trente caractères au maximum. Gravée au laser puis noircie. Aperçu en direct sur la vue de dos.",
        selection: "texte",
        optional: true,
        maxLength: 30,
        filledPriceCents: 4500,
        filledLeadDays: 4,
        options: [],
      },
    ],
  },
];

/**
 * Règles de compatibilité.
 *
 * Une seule forme couvre tous les cas : cette option EXIGE L'UNE DE / EXCLUT
 * ces options, avec la phrase affichée au client. Le CRM les édite dans un
 * formulaire, elles ne sont jamais écrites en dur ailleurs.
 */
export const RULES: CompatibilityRule[] = [
  {
    subject: "lunette-style:plongee",
    kind: "exige-une-de",
    targets: ["taille:40"],
    message: "La lunette de plongée n'est usinée qu'en 40 mm.",
  },
  {
    subject: "lunette-style:plongee",
    kind: "exige-une-de",
    targets: ["couronne-vissee:vissee"],
    message: "Une lunette de plongée suppose une couronne vissée.",
  },
  {
    subject: "insert-matiere:ceramique",
    kind: "exige-une-de",
    targets: ["lunette-style:plongee"],
    message: "Un insert ne se pose que sur une lunette de plongée.",
  },
  {
    subject: "insert-matiere:aluminium",
    kind: "exige-une-de",
    targets: ["lunette-style:plongee"],
    message: "Un insert ne se pose que sur une lunette de plongée.",
  },
  {
    subject: "cadran-finition:emaille",
    kind: "exige-une-de",
    targets: ["cadran-teinte:creme", "cadran-teinte:saumon", "cadran-teinte:bleu-abysse"],
    message: "L'émail n'est cuit que sur crème, saumon et bleu abysse.",
  },
  {
    subject: "date:avec",
    kind: "exclut",
    targets: ["mouvement:nh38"],
    message: "Le NH38 n'a pas de quantième : ce calibre se porte sans date.",
  },
  {
    subject: "aiguille-24h:fleche",
    kind: "exige-une-de",
    targets: ["mouvement:nh34"],
    message: "Nécessite le mouvement GMT NH34.",
  },
  {
    subject: "aiguille-24h:baton-lume",
    kind: "exige-une-de",
    targets: ["mouvement:nh34"],
    message: "Nécessite le mouvement GMT NH34.",
  },
  {
    subject: "aiguille-24h:baton-lume",
    kind: "exige-une-de",
    targets: ["luminova:avec"],
    message: "Sans luminova sur le reste de la montre, ce choix n'aurait pas de sens.",
  },
  // Une teinte d'insert n'a de sens que s'il y a un insert à teindre.
  ...["noir", "bleu-nuit", "vert-foret", "gris-ardoise"].map((teinte) => ({
    subject: `insert-teinte:${teinte}`,
    kind: "exige-une-de" as const,
    targets: ["lunette-style:plongee"],
    message: "Un insert ne se pose que sur une lunette de plongée.",
  })),
  // Les teintes de brin suivent la matière du bracelet.
  ...(
    [
      ["fauve", "cuir"],
      ["chocolat", "cuir"],
      ["cuir-noir", "cuir"],
      ["caoutchouc-noir", "caoutchouc"],
      ["caoutchouc-bleu", "caoutchouc"],
      ["nato-kaki", "nato"],
      ["nato-marine", "nato"],
      ["nato-sable", "nato"],
    ] as const
  ).map(([teinte, type]) => ({
    subject: `bracelet-teinte:${teinte}`,
    kind: "exige-une-de" as const,
    targets: [`bracelet-type:${type}`],
    message:
      type === "cuir"
        ? "Teinte réservée aux bracelets cuir."
        : type === "nato"
          ? "Teinte réservée aux bracelets NATO."
          : "Teinte réservée aux bracelets caoutchouc.",
  })),
];

/**
 * Stock de l'atelier — quinzaine de pièces, données d'exemple.
 * Deux références sont volontairement à zéro pour montrer l'état « de retour
 * bientôt » côté configurateur et l'alerte côté CRM.
 */
export const PARTS: Part[] = [
  { ref: "BOI-37", name: "Boîtier acier 316L 37 mm", category: "boitier", supplier: "Atelier Suwa", purchasePriceCents: 8200, quantityOnHand: 6, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "BOI-38", name: "Boîtier acier 316L 38 mm", category: "boitier", supplier: "Atelier Suwa", purchasePriceCents: 8200, quantityOnHand: 9, quantityReserved: 2, reorderThreshold: 3, restockDays: 24 },
  { ref: "BOI-39", name: "Boîtier acier 316L 39 mm", category: "boitier", supplier: "Atelier Suwa", purchasePriceCents: 8600, quantityOnHand: 4, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "BOI-40", name: "Boîtier acier 316L 40 mm, protège-couronne", category: "boitier", supplier: "Atelier Suwa", purchasePriceCents: 9400, quantityOnHand: 11, quantityReserved: 3, reorderThreshold: 4, restockDays: 24 },
  { ref: "CAD-CRE", name: "Cadran crème émail", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 5600, quantityOnHand: 7, quantityReserved: 1, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-BLE", name: "Cadran bleu abysse soleillé", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 12, quantityReserved: 4, reorderThreshold: 4, restockDays: 32 },
  { ref: "CAD-VER", name: "Cadran vert sauge", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-SAU", name: "Cadran saumon", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 7100, quantityOnHand: 2, quantityReserved: 1, reorderThreshold: 2, restockDays: 45 },
  { ref: "CAD-GRI", name: "Cadran gris ardoise", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 6, quantityReserved: 1, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-NOI", name: "Cadran noir mat", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4400, quantityOnHand: 10, quantityReserved: 2, reorderThreshold: 4, restockDays: 32 },
  { ref: "AIG-GLA", name: "Jeu d'aiguilles glaive", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 1900, quantityOnHand: 14, quantityReserved: 3, reorderThreshold: 5, restockDays: 18 },
  { ref: "AIG-MER", name: "Jeu d'aiguilles Mercedes", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 2400, quantityOnHand: 8, quantityReserved: 2, reorderThreshold: 4, restockDays: 18 },
  { ref: "AIG-CRA", name: "Jeu d'aiguilles crayon", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 1900, quantityOnHand: 9, quantityReserved: 1, reorderThreshold: 4, restockDays: 18 },
  { ref: "LUN-LIS", name: "Lunette lisse", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 2600, quantityOnHand: 8, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "LUN-CAN", name: "Lunette cannelée", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 3900, quantityOnHand: 5, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "LUN-PLO", name: "Lunette plongée 120 clics", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 5200, quantityOnHand: 7, quantityReserved: 2, reorderThreshold: 3, restockDays: 24 },
  { ref: "INS-NOI", name: "Insert céramique noir", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3100, quantityOnHand: 9, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "INS-BLE", name: "Insert céramique bleu nuit", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3100, quantityOnHand: 6, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "INS-VER", name: "Insert céramique vert forêt", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3300, quantityOnHand: 0, quantityReserved: 0, reorderThreshold: 2, restockDays: 38 },
  { ref: "INS-GRI", name: "Insert aluminium gris ardoise", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 1700, quantityOnHand: 4, quantityReserved: 0, reorderThreshold: 2, restockDays: 38 },
  { ref: "COU-SIG", name: "Couronne signée Chronova", category: "couronne", supplier: "Horotec Supply", purchasePriceCents: 2200, quantityOnHand: 12, quantityReserved: 3, reorderThreshold: 4, restockDays: 18 },
  { ref: "COU-LIS", name: "Couronne lisse", category: "couronne", supplier: "Horotec Supply", purchasePriceCents: 1400, quantityOnHand: 10, quantityReserved: 1, reorderThreshold: 4, restockDays: 18 },
  { ref: "BRA-3M", name: "Bracelet acier trois maillons", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 6800, quantityOnHand: 7, quantityReserved: 2, reorderThreshold: 3, restockDays: 21 },
  { ref: "BRA-JUB", name: "Bracelet acier jubilé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 8900, quantityOnHand: 4, quantityReserved: 1, reorderThreshold: 2, restockDays: 21 },
  { ref: "BRA-CUI", name: "Bracelet cuir tannage végétal", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 3400, quantityOnHand: 15, quantityReserved: 3, reorderThreshold: 5, restockDays: 12 },
  { ref: "BRA-CAO", name: "Bracelet caoutchouc vulcanisé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 2600, quantityOnHand: 2, quantityReserved: 2, reorderThreshold: 4, restockDays: 12 },
  { ref: "BRA-NAT", name: "Bracelet NATO tissé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 1600, quantityOnHand: 18, quantityReserved: 2, reorderThreshold: 6, restockDays: 12 },
  { ref: "VER-PLA", name: "Saphir plat", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 2100, quantityOnHand: 13, quantityReserved: 3, reorderThreshold: 5, restockDays: 38 },
  { ref: "VER-BOM", name: "Saphir bombé", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 3600, quantityOnHand: 6, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "MOU-NH35", name: "Mouvement Seiko NH35", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 5200, quantityOnHand: 16, quantityReserved: 5, reorderThreshold: 6, restockDays: 28 },
  { ref: "MOU-NH34", name: "Mouvement Seiko NH34 GMT", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 9800, quantityOnHand: 3, quantityReserved: 2, reorderThreshold: 3, restockDays: 42 },
  { ref: "MOU-NH38", name: "Mouvement Seiko NH38 cœur ouvert", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 7400, quantityOnHand: 5, quantityReserved: 1, reorderThreshold: 3, restockDays: 28 },
  { ref: "FON-PLE", name: "Fond plein vissé", category: "fond", supplier: "Atelier Suwa", purchasePriceCents: 1800, quantityOnHand: 14, quantityReserved: 3, reorderThreshold: 5, restockDays: 24 },
  { ref: "FON-TRA", name: "Fond saphir transparent", category: "fond", supplier: "Atelier Suwa", purchasePriceCents: 3900, quantityOnHand: 6, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
];

/**
 * Catalogue d'exemple, prêt à l'emploi.
 *
 * C'est la source du seed (`prisma/seed.ts`) et la fixture des tests. En
 * production, la même structure est construite à partir de la base par
 * `src/lib/data/queries.ts` : le CRM édite la base, pas ce fichier.
 */
export const SAMPLE_CATALOGUE: Catalogue = createCatalogue({
  steps: STEPS,
  rules: RULES,
  parts: PARTS,
});
