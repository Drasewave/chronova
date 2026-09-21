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
    intro: "Le boîtier fixe le diamètre, et certaines options des étapes suivantes en dépendent.",
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
          { key: "41", label: "41 mm", priceDeltaCents: 0, partRef: "BOI-41", render: { caseSize: 41 } },
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
            description: "Mat profond, sans reflet. Courant sur les montres de terrain.",
            priceDeltaCents: 4000,
            render: { caseFinish: "microbille" },
          },
        ],
      },
      {
        key: "boitier-forme",
        label: "Forme de la carrure",
        help: "De face, la carrure coussin paraît plus large ; au poignet elle est plus courte, parce que ses cornes le sont.",
        selection: "unique",
        options: [
          {
            key: "rond",
            label: "Ronde",
            description: "Carrure cylindrique, quatre cornes élancées.",
            priceDeltaCents: 0,
            render: { caseShape: "rond" },
          },
          {
            key: "coussin",
            label: "Coussin",
            description: "Galet large aux flancs bombés et aux cornes courtes, comme les plongeuses japonaises des années 70. Le flanc enveloppe la couronne.",
            priceDeltaCents: 9000,
            leadDaysDelta: 2,
            render: { caseShape: "coussin" },
          },
        ],
      },
    ],
  },
  {
    key: "cadran",
    label: "Cadran",
    intro: "C'est la pièce que vous regarderez le plus. Choisissez sa teinte, sa finition et ses index.",
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
          { key: "noir-mat", label: "Noir mat", colorName: "Noir mat", colorHex: "#1C1E21", priceDeltaCents: 0, partRef: "CAD-NOI", render: { dialColor: "#1C1E21" } },
          { key: "vert-montagne", label: "Vert montagne", colorName: "Vert montagne", colorHex: "#1D4A37", priceDeltaCents: 3000, partRef: "CAD-MON", render: { dialColor: "#1D4A37" } },
          { key: "bleu-glacier", label: "Bleu glacier", colorName: "Bleu glacier", colorHex: "#9CBDD4", priceDeltaCents: 3000, partRef: "CAD-GLA", render: { dialColor: "#9CBDD4" } },
          { key: "orange-plongee", label: "Orange plongée", colorName: "Orange plongée", colorHex: "#D6621F", priceDeltaCents: 3000, partRef: "CAD-ORA", render: { dialColor: "#D6621F" } },
          { key: "argent", label: "Argent", colorName: "Argent", colorHex: "#D5D8DB", priceDeltaCents: 0, partRef: "CAD-ARG", render: { dialColor: "#D5D8DB" } },
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
            description: "Aucune réflexion : lisible en plein soleil.",
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
          {
            key: "soleil-profond",
            label: "Soleil profond",
            description: "Soleillage gaufré sous laque transparente, fumé vers le bord : le cadran passe du clair au presque noir quand le poignet tourne.",
            priceDeltaCents: 7000,
            leadDaysDelta: 3,
            render: { dialTexture: "soleil-profond" },
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
          {
            key: "plongee",
            label: "Ronds et triangle",
            description: "Triangle à midi, bâtons aux quarts, ronds ailleurs : la disposition habituelle des montres de plongée.",
            priceDeltaCents: 2000,
            render: { indexStyle: "plongee" },
          },
          {
            key: "montagne",
            label: "Chiffres pairs appliqués",
            description: "Chiffres en métal poli aux heures paires, index en pointe aux heures impaires, un point luminescent au pied de chacun : le cadran des montres de montagne.",
            priceDeltaCents: 4000,
            partRef: "IDX-MON",
            render: { indexStyle: "montagne" },
          },
          {
            key: "terrain-24h",
            label: "Double échelle 12/24 h",
            description: "Douze grands chiffres luminescents, et sous chacun l'heure de l'après-midi en petit, de 13 à 24 : la lecture des montres de terrain.",
            priceDeltaCents: 2000,
            render: { indexStyle: "terrain-24h" },
          },
        ],
      },
      {
        key: "index-metal",
        label: "Métal des index",
        help: "Sans choix, les index appliqués suivent le métal du boîtier.",
        selection: "unique",
        optional: true,
        options: [
          { key: "dore", label: "Index dorés", colorName: "Doré", colorHex: "#C99A45", priceDeltaCents: 3000, render: { indexMetal: "dore" } },
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
          {
            key: "jour-date",
            label: "Jour et date",
            description: "Guichet élargi à 3 h : le jour de la semaine, en français, puis le quantième.",
            priceDeltaCents: 3000,
            render: { showDate: true, dateWindow: "jour-date" },
          },
        ],
      },
      {
        key: "rehaut",
        label: "Réhaut",
        help: "La bague inclinée entre le cadran et le verre.",
        selection: "unique",
        options: [
          { key: "aucun", label: "Réhaut simple", priceDeltaCents: 0, render: { innerRing: "aucun" } },
          {
            key: "boussole",
            label: "Réhaut boussole",
            description: "Rose des vents tournante, commandée par une seconde couronne à 4 h : l'aiguille des heures pointée sur le soleil, le réhaut donne le sud.",
            priceDeltaCents: 12000,
            leadDaysDelta: 3,
            partRef: "REH-BOU",
            render: { innerRing: "boussole" },
          },
        ],
      },
    ],
  },
  {
    key: "aiguilles",
    label: "Aiguilles",
    intro: "Je les chasse une à une au potence, puis je les vérifie à la loupe.",
    groups: [
      {
        key: "aiguilles-forme",
        label: "Forme",
        selection: "unique",
        options: [
          { key: "glaive", label: "Glaive", description: "Deux arêtes vives qui se rejoignent en pointe.", priceDeltaCents: 0, partRef: "AIG-GLA", render: { handShape: "glaive" } },
          { key: "mercedes", label: "Mercedes", description: "Cercle à trois branches sur l'aiguille des heures.", priceDeltaCents: 3000, partRef: "AIG-MER", render: { handShape: "mercedes" } },
          { key: "crayon", label: "Crayon", description: "Bâtons droits à bout arrondi, largement luminescents.", priceDeltaCents: 0, partRef: "AIG-CRA", render: { handShape: "crayon" } },
          { key: "fleche", label: "Flèche", description: "Heure en flèche large et courte, minute en glaive large, trotteuse à pastille lumineuse : le jeu des plongeuses japonaises.", priceDeltaCents: 2000, partRef: "AIG-FLE", render: { handShape: "fleche" } },
          { key: "dauphine", label: "Dauphine", description: "Deux versants polis séparés par une arête vive. Habillées, sans luminova par tradition.", priceDeltaCents: 3000, partRef: "AIG-DAU", render: { handShape: "dauphine" } },
          { key: "cathedrale", label: "Cathédrale", description: "Ajourées comme un vitrail, à segments luminescents : les aiguilles des montres de montagne.", priceDeltaCents: 4000, partRef: "AIG-CAT", render: { handShape: "cathedrale" } },
        ],
      },
      {
        key: "aiguilles-metal",
        label: "Traitement",
        selection: "unique",
        options: [
          { key: "acier", label: "Acier poli", colorName: "Acier", colorHex: "#A9AFB6", priceDeltaCents: 0, render: { handMetal: "acier" } },
          { key: "dore", label: "Doré", colorName: "Doré", colorHex: "#C99A45", priceDeltaCents: 5000, render: { handMetal: "dore" } },
          { key: "bleui", label: "Bleui au feu", colorName: "Bleu acier", colorHex: "#3A4E82", priceDeltaCents: 7000, render: { handMetal: "bleui" } },
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
    intro: "La lunette compte plus que le cadran dans l'allure générale de la montre.",
    groups: [
      {
        key: "lunette-style",
        label: "Style",
        selection: "unique",
        options: [
          { key: "lisse", label: "Lisse", description: "Fine, sans relief, pour laisser la place au cadran.", priceDeltaCents: 0, partRef: "LUN-LIS", render: { bezelStyle: "lisse" } },
          { key: "cannelee", label: "Cannelée", description: "Soixante-douze crans, reflets en étoile.", priceDeltaCents: 6000, partRef: "LUN-CAN", render: { bezelStyle: "cannelee" } },
          { key: "plongee", label: "Plongée, 120 clics", description: "Unidirectionnelle, graduée soixante minutes.", priceDeltaCents: 12000, partRef: "LUN-PLO", render: { bezelStyle: "plongee" } },
          { key: "gmt", label: "GMT, 24 heures", description: "Bidirectionnelle, graduée vingt-quatre heures : un second fuseau se lit sur la lunette.", priceDeltaCents: 14000, partRef: "LUN-GMT", render: { bezelStyle: "gmt" } },
          { key: "tachymetre", label: "Tachymètre, fixe", description: "Insert aluminium noir gravé d'une échelle de vitesse, de 60 à 500 : la trotteuse du chronographe y pointe une moyenne sur un kilomètre.", priceDeltaCents: 9000, partRef: "LUN-TAC", render: { bezelStyle: "tachymetre", insertColor: "#17191C", insertMaterial: "aluminium" } },
        ],
      },
      {
        key: "insert-matiere",
        label: "Matière de l'insert",
        selection: "unique",
        optional: true,
        options: [
          { key: "aluminium", label: "Aluminium", description: "Patine avec le temps, se raye, se remplace facilement.", priceDeltaCents: 0, render: { insertMaterial: "aluminium" } },
          { key: "ceramique", label: "Céramique", description: "Garde sa teinte au soleil et ne se raye presque pas.", priceDeltaCents: 8000, leadDaysDelta: 2, render: { insertMaterial: "ceramique" } },
        ],
      },
      {
        key: "insert-teinte",
        label: "Teinte de l'insert",
        selection: "unique",
        optional: true,
        options: [
          { key: "noir", label: "Noir", colorName: "Noir", colorHex: "#17191C", priceDeltaCents: 0, partRef: "INS-NOI", render: { insertColor: "#17191C" } },
          { key: "bleu-nuit", label: "Bleu nuit", colorName: "Bleu nuit", colorHex: "#1B2E42", priceDeltaCents: 0, partRef: "INS-BLE", render: { insertColor: "#1B2E42" } },
          { key: "vert-foret", label: "Vert forêt", colorName: "Vert forêt", colorHex: "#2C3B2C", priceDeltaCents: 0, partRef: "INS-VER", render: { insertColor: "#2C3B2C" } },
          { key: "gris-ardoise", label: "Gris ardoise", colorName: "Gris ardoise", colorHex: "#4A4E52", priceDeltaCents: 0, partRef: "INS-GRI", render: { insertColor: "#4A4E52" } },
        ],
      },
      {
        key: "insert-bicolore",
        label: "Demi-lunette de jour",
        help: "Sur une lunette GMT, la moitié basse (6 h – 18 h) peut prendre une seconde teinte : le jour et la nuit du second fuseau se lisent d'un coup d'œil.",
        selection: "unique",
        optional: true,
        options: [
          { key: "rouge", label: "Rouge", colorName: "Rouge", colorHex: "#8C1D2B", priceDeltaCents: 4000, render: { insertColor2: "#8C1D2B" } },
          { key: "bleu-roi", label: "Bleu roi", colorName: "Bleu roi", colorHex: "#1F4E8C", priceDeltaCents: 4000, render: { insertColor2: "#1F4E8C" } },
          { key: "gris", label: "Gris", colorName: "Gris", colorHex: "#5E6369", priceDeltaCents: 4000, render: { insertColor2: "#5E6369" } },
        ],
      },
      {
        key: "insert-secteur",
        label: "Secteur des vingt minutes",
        help: "Sur une lunette de plongée, les vingt premières minutes peuvent prendre une seconde teinte : la plage des paliers se repère sans lire un chiffre.",
        selection: "unique",
        optional: true,
        options: [
          { key: "rouge", label: "Rouge", colorName: "Rouge", colorHex: "#A3202E", priceDeltaCents: 4000, render: { insertColor2: "#A3202E" } },
        ],
      },
    ],
  },
  {
    key: "couronne",
    label: "Couronne",
    intro: "Vous la manipulerez souvent : regardez sa prise en main autant que son dessin.",
    groups: [
      {
        key: "couronne-signature",
        label: "Signature",
        selection: "unique",
        options: [
          { key: "signee", label: "Signée Chronova", description: "Initiale gravée puis noircie à la main.", priceDeltaCents: 3000, partRef: "COU-SIG", render: { crownStyle: "signee" } },
          { key: "lisse", label: "Lisse", description: "Cannelures seules, aucune marque.", priceDeltaCents: 0, partRef: "COU-LIS", render: { crownStyle: "lisse" } },
          { key: "oignon", label: "Oignon", description: "Plus grosse et bombée, cannelures galbées : elle se saisit du bout des doigts. Non signée.", priceDeltaCents: 3000, partRef: "COU-OIG", render: { crownStyle: "oignon" } },
        ],
      },
      {
        key: "couronne-metal",
        label: "Teinte",
        selection: "unique",
        options: [
          { key: "acier", label: "Acier", colorName: "Acier", colorHex: "#A9AFB6", priceDeltaCents: 0, render: { crownMetal: "acier" } },
          { key: "dore", label: "Doré", colorName: "Doré", colorHex: "#C99A45", priceDeltaCents: 4000, render: { crownMetal: "dore" } },
          { key: "noir", label: "Noir PVD", colorName: "Noir", colorHex: "#33373C", priceDeltaCents: 3000, render: { crownMetal: "noir" } },
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
      {
        key: "couronne-position",
        label: "Position",
        help: "À 4 h, la couronne ne marque plus le dos de la main quand le poignet se plie.",
        selection: "unique",
        options: [
          { key: "3h", label: "À 3 h", priceDeltaCents: 0, render: { crownAt: 3 } },
          { key: "4h", label: "À 4 h, déportée", description: "La carrure est percée à 4 h : la signature des plongeuses japonaises.", priceDeltaCents: 4000, render: { crownAt: 4 } },
        ],
      },
    ],
  },
  {
    key: "bracelet",
    label: "Bracelet",
    intro: "Selon le brin, un même boîtier paraît plus sportif ou plus habillé.",
    groups: [
      {
        key: "bracelet-type",
        label: "Type",
        selection: "unique",
        options: [
          { key: "acier-3-maillons", label: "Acier, trois maillons", priceDeltaCents: 0, partRef: "BRA-3M", render: { strapKind: "acier-3-maillons", strapColor: "#A9AFB6" } },
          { key: "acier-jubile", label: "Acier, jubilé", description: "Cinq maillons, les trois centraux polis.", priceDeltaCents: 9000, partRef: "BRA-JUB", render: { strapKind: "acier-jubile", strapColor: "#A9AFB6" } },
          { key: "cuir", label: "Cuir", description: "Tannage végétal, coutures à la main.", priceDeltaCents: 0, partRef: "BRA-CUI", render: { strapKind: "cuir" } },
          { key: "caoutchouc", label: "Caoutchouc", description: "Vulcanisé, insensible à l'eau de mer.", priceDeltaCents: 0, partRef: "BRA-CAO", render: { strapKind: "caoutchouc" } },
          { key: "nato", label: "NATO", description: "Sangle tissée, passe sous le boîtier.", priceDeltaCents: 0, partRef: "BRA-NAT", render: { strapKind: "nato" } },
          { key: "cuir-glace", label: "Cuir glacé", description: "Veau glacé, brillant, rembordé, à surpiqûre fine ton sur ton : le brin des habillées.", priceDeltaCents: 4000, partRef: "BRA-GLA", render: { strapKind: "cuir-glace" } },
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
          { key: "cuir-noir", label: "Cuir noir", colorName: "Noir", colorHex: "#1E1F21", priceDeltaCents: 0, render: { strapColor: "#1E1F21" } },
          { key: "caoutchouc-noir", label: "Caoutchouc noir", colorName: "Noir", colorHex: "#1B1D20", priceDeltaCents: 0, render: { strapColor: "#1B1D20" } },
          { key: "caoutchouc-bleu", label: "Caoutchouc bleu", colorName: "Bleu", colorHex: "#24384A", priceDeltaCents: 0, render: { strapColor: "#24384A" } },
          { key: "nato-kaki", label: "NATO kaki", colorName: "Kaki", colorHex: "#5D6152", priceDeltaCents: 0, render: { strapColor: "#5D6152" } },
          { key: "nato-marine", label: "NATO marine", colorName: "Marine", colorHex: "#2E3B4A", priceDeltaCents: 0, render: { strapColor: "#2E3B4A" } },
          { key: "nato-sable", label: "NATO sable", colorName: "Sable", colorHex: "#A08E6E", priceDeltaCents: 0, render: { strapColor: "#A08E6E" } },
          { key: "glace-noir", label: "Cuir glacé noir", colorName: "Noir", colorHex: "#17181B", priceDeltaCents: 0, render: { strapColor: "#17181B" } },
          { key: "glace-brun", label: "Cuir glacé brun", colorName: "Brun", colorHex: "#3B2418", priceDeltaCents: 0, render: { strapColor: "#3B2418" } },
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
    intro: "Je ne monte que du saphir, qui résiste aux rayures du quotidien.",
    groups: [
      {
        key: "verre-forme",
        label: "Forme",
        selection: "unique",
        options: [
          { key: "plat", label: "Saphir plat", description: "Silhouette basse, aucune déformation sur les bords.", priceDeltaCents: 0, partRef: "VER-PLA", render: { crystal: "plat" } },
          { key: "bombe", label: "Saphir bombé", description: "Galbe à l'ancienne, avec des reflets sur tout le pourtour.", priceDeltaCents: 7000, partRef: "VER-BOM", render: { crystal: "bombe" } },
          { key: "box", label: "Saphir box", description: "Très saillant, flancs droits et dessus bombé, comme les verres acryliques d'autrefois : le bord du cadran s'y dédouble.", priceDeltaCents: 11000, leadDaysDelta: 2, partRef: "VER-BOX", render: { crystal: "box" } },
        ],
      },
      {
        key: "loupe",
        label: "Loupe de quantième",
        help: "Une lentille collée sur le verre, au droit du guichet : elle grossit le quantième deux fois et demie.",
        selection: "unique",
        options: [
          { key: "sans", label: "Sans loupe", priceDeltaCents: 0, render: { cyclops: false } },
          { key: "avec", label: "Avec loupe", description: "Posée et collée à la main sur un saphir plat, centrée sur le guichet.", priceDeltaCents: 5000, leadDaysDelta: 1, partRef: "VER-LOU", render: { cyclops: true } },
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
          {
            key: "vk64",
            label: "VK64 · chronographe",
            description: "Meca-quartz : trotteuse et compteurs entraînés mécaniquement par la couronne, minuterie à quartz. Sans date.",
            priceDeltaCents: 45000,
            leadDaysDelta: 5,
            partRef: "MOU-VK64",
            render: { movement: "VK64" },
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
      {
        key: "aiguille-fonction-teinte",
        label: "Teinte de l'aiguille de fonction",
        help: "L'aiguille 24 heures d'un GMT ou la trotteuse centrale d'un chronographe peut être laquée : on ne la confond plus avec les autres.",
        selection: "unique",
        optional: true,
        options: [
          { key: "rouge", label: "Laquée rouge", colorName: "Rouge", colorHex: "#C8202B", priceDeltaCents: 2000, render: { accentHandColor: "#C8202B" } },
        ],
      },
      {
        key: "compteurs",
        label: "Compteurs chronographe",
        help: "60 secondes à 9 h, 30 minutes à 3 h. Un chronographe se lit mieux en course quand les compteurs contrastent avec le cadran.",
        selection: "unique",
        optional: true,
        options: [
          {
            key: "panda",
            label: "Panda",
            description: "Compteurs clairs sur cadran sombre, comme sur les chronographes de course classiques.",
            priceDeltaCents: 0,
            render: { subdialColor: "#EFE7D6" },
          },
          {
            key: "inverse",
            label: "Panda inversé",
            description: "Compteurs sombres sur cadran clair.",
            priceDeltaCents: 0,
            render: { subdialColor: "#1C1E21" },
          },
        ],
      },
    ],
  },
  {
    key: "fond",
    label: "Fond",
    intro: "Vous verrez peu cette face de la montre. Vous pouvez y faire graver un texte.",
    groups: [
      {
        key: "fond-type",
        label: "Type de fond",
        selection: "unique",
        options: [
          { key: "plein", label: "Fond plein", description: "Acier vissé, joint torique. Le plus étanche.", priceDeltaCents: 0, partRef: "FON-PLE", render: { caseback: "plein" } },
          { key: "transparent", label: "Fond transparent", description: "Saphir vissé : vous voyez le mouvement tourner.", priceDeltaCents: 9000, leadDaysDelta: 2, partRef: "FON-TRA", render: { caseback: "transparent" } },
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
    targets: ["taille:39", "taille:40"],
    message: "La lunette de plongée n'est usinée qu'en 39 et 40 mm.",
  },
  {
    subject: "lunette-style:plongee",
    kind: "exige-une-de",
    targets: ["couronne-vissee:vissee"],
    message: "Une lunette de plongée suppose une couronne vissée.",
  },
  {
    subject: "lunette-style:gmt",
    kind: "exige-une-de",
    targets: ["mouvement:nh34"],
    message: "La lunette 24 heures se lit avec l'aiguille GMT du calibre NH34.",
  },
  {
    subject: "insert-matiere:ceramique",
    kind: "exige-une-de",
    targets: ["lunette-style:plongee", "lunette-style:gmt"],
    message: "Un insert ne se pose que sur une lunette de plongée ou GMT.",
  },
  {
    subject: "insert-matiere:aluminium",
    kind: "exige-une-de",
    targets: ["lunette-style:plongee", "lunette-style:gmt"],
    message: "Un insert ne se pose que sur une lunette de plongée ou GMT.",
  },
  ...["rouge", "bleu-roi"].map((teinte) => ({
    subject: `insert-bicolore:${teinte}`,
    kind: "exige-une-de" as const,
    targets: ["lunette-style:gmt"],
    message: "L'insert bicolore n'existe que sur la lunette GMT.",
  })),
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
  // Jour-date et quantième suivent le calibre : ni le NH38 ni le VK64 n'en ont.
  {
    subject: "date:avec",
    kind: "exclut",
    targets: ["mouvement:vk64"],
    message: "Le VK64 n'a pas de quantième : le chronographe se porte sans date.",
  },
  {
    subject: "date:jour-date",
    kind: "exclut",
    targets: ["mouvement:nh38"],
    message: "Le NH38 n'a ni jour ni quantième : ce calibre se porte sans date.",
  },
  {
    subject: "date:jour-date",
    kind: "exclut",
    targets: ["mouvement:vk64"],
    message: "Le VK64 n'a ni jour ni quantième : le chronographe se porte sans date.",
  },
  {
    subject: "boitier-forme:coussin",
    kind: "exige-une-de",
    targets: ["taille:40"],
    message: "La carrure coussin n'est usinée qu'en 40 mm.",
  },
  {
    subject: "couronne-position:4h",
    kind: "exclut",
    targets: ["mouvement:vk64"],
    message: "Sur le chronographe, le poussoir de remise à zéro occupe déjà 4 h.",
  },
  {
    subject: "rehaut:boussole",
    kind: "exclut",
    targets: ["couronne-position:4h"],
    message: "La couronne du réhaut boussole se loge à 4 h : celle de remontage reste à 3 h.",
  },
  {
    subject: "rehaut:boussole",
    kind: "exclut",
    targets: ["mouvement:nh34"],
    message: "Le réhaut du GMT porte déjà l'échelle 24 heures.",
  },
  {
    subject: "rehaut:boussole",
    kind: "exclut",
    targets: ["mouvement:vk64"],
    message: "Sur le chronographe, le poussoir de remise à zéro occupe la place de la seconde couronne.",
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
    message: "Le bâton luminescent suppose le luminova sur le reste de la montre.",
  },
  {
    subject: "mouvement:vk64",
    kind: "exige-une-de",
    targets: ["taille:41"],
    message: "Le module chronographe n'est usiné que dans le boîtier 41 mm.",
  },
  {
    subject: "compteurs:panda",
    kind: "exige-une-de",
    targets: ["mouvement:vk64"],
    message: "Les compteurs supposent le mouvement chronographe VK64.",
  },
  {
    subject: "compteurs:inverse",
    kind: "exige-une-de",
    targets: ["mouvement:vk64"],
    message: "Les compteurs supposent le mouvement chronographe VK64.",
  },
  {
    subject: "insert-bicolore:gris",
    kind: "exige-une-de",
    targets: ["lunette-style:gmt"],
    message: "L'insert bicolore n'existe que sur la lunette GMT.",
  },
  {
    subject: "insert-secteur:rouge",
    kind: "exige-une-de",
    targets: ["lunette-style:plongee"],
    message: "Le secteur des vingt minutes n'existe que sur la lunette de plongée.",
  },
  {
    subject: "lunette-style:tachymetre",
    kind: "exige-une-de",
    targets: ["mouvement:vk64"],
    message: "L'échelle tachymétrique se lit avec la trotteuse du chronographe VK64.",
  },
  {
    subject: "aiguille-fonction-teinte:rouge",
    kind: "exige-une-de",
    targets: ["mouvement:nh34", "mouvement:vk64"],
    message: "Seules l'aiguille 24 heures du NH34 et la trotteuse du chronographe VK64 se laquent.",
  },
  {
    subject: "loupe:avec",
    kind: "exige-une-de",
    targets: ["date:avec"],
    message: "La loupe grossit un quantième seul : il faut le guichet de date simple.",
  },
  {
    subject: "loupe:avec",
    kind: "exige-une-de",
    targets: ["verre-forme:plat"],
    message: "La loupe ne se colle que sur un saphir plat.",
  },
  ...["glace-noir", "glace-brun"].map((teinte) => ({
    subject: `bracelet-teinte:${teinte}`,
    kind: "exige-une-de" as const,
    targets: ["bracelet-type:cuir-glace"],
    message: "Teinte réservée au cuir glacé.",
  })),
  // Une teinte d'insert n'a de sens que s'il y a un insert à teindre.
  ...["noir", "bleu-nuit", "vert-foret", "gris-ardoise"].map((teinte) => ({
    subject: `insert-teinte:${teinte}`,
    kind: "exige-une-de" as const,
    targets: ["lunette-style:plongee", "lunette-style:gmt"],
    message: "Un insert ne se pose que sur une lunette de plongée ou GMT.",
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
  { ref: "BOI-41", name: "Boîtier acier 316L 41 mm, poussoirs", category: "boitier", supplier: "Atelier Suwa", purchasePriceCents: 10800, quantityOnHand: 5, quantityReserved: 1, reorderThreshold: 3, restockDays: 30 },
  { ref: "CAD-CRE", name: "Cadran crème émail", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 5600, quantityOnHand: 7, quantityReserved: 1, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-BLE", name: "Cadran bleu abysse soleillé", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 12, quantityReserved: 4, reorderThreshold: 4, restockDays: 32 },
  { ref: "CAD-VER", name: "Cadran vert sauge", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-SAU", name: "Cadran saumon", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 7100, quantityOnHand: 2, quantityReserved: 1, reorderThreshold: 2, restockDays: 45 },
  { ref: "CAD-GRI", name: "Cadran gris ardoise", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 6, quantityReserved: 1, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-NOI", name: "Cadran noir mat", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4400, quantityOnHand: 10, quantityReserved: 2, reorderThreshold: 4, restockDays: 32 },
  { ref: "CAD-MON", name: "Cadran vert montagne", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 5200, quantityOnHand: 6, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-GLA", name: "Cadran bleu glacier", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 5200, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "CAD-ORA", name: "Cadran orange plongée", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 5200, quantityOnHand: 4, quantityReserved: 0, reorderThreshold: 2, restockDays: 32 },
  { ref: "CAD-ARG", name: "Cadran argent soleillé", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 4800, quantityOnHand: 6, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "IDX-MON", name: "Jeu d'index montagne, chiffres appliqués", category: "cadran", supplier: "Kobayashi Dials", purchasePriceCents: 2100, quantityOnHand: 6, quantityReserved: 0, reorderThreshold: 3, restockDays: 32 },
  { ref: "REH-BOU", name: "Réhaut boussole tournant et sa couronne", category: "cadran", supplier: "Atelier Suwa", purchasePriceCents: 4600, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 2, restockDays: 30 },
  { ref: "AIG-GLA", name: "Jeu d'aiguilles glaive", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 1900, quantityOnHand: 14, quantityReserved: 3, reorderThreshold: 5, restockDays: 18 },
  { ref: "AIG-MER", name: "Jeu d'aiguilles Mercedes", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 2400, quantityOnHand: 8, quantityReserved: 2, reorderThreshold: 4, restockDays: 18 },
  { ref: "AIG-CRA", name: "Jeu d'aiguilles crayon", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 1900, quantityOnHand: 9, quantityReserved: 1, reorderThreshold: 4, restockDays: 18 },
  { ref: "AIG-FLE", name: "Jeu d'aiguilles flèche, plongée", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 2300, quantityOnHand: 10, quantityReserved: 0, reorderThreshold: 4, restockDays: 18 },
  { ref: "AIG-DAU", name: "Jeu d'aiguilles dauphine", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 2600, quantityOnHand: 7, quantityReserved: 0, reorderThreshold: 3, restockDays: 18 },
  { ref: "AIG-CAT", name: "Jeu d'aiguilles cathédrale", category: "aiguilles", supplier: "Horotec Supply", purchasePriceCents: 2900, quantityOnHand: 6, quantityReserved: 0, reorderThreshold: 3, restockDays: 18 },
  { ref: "LUN-LIS", name: "Lunette lisse", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 2600, quantityOnHand: 8, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "LUN-CAN", name: "Lunette cannelée", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 3900, quantityOnHand: 5, quantityReserved: 1, reorderThreshold: 3, restockDays: 24 },
  { ref: "LUN-PLO", name: "Lunette plongée 120 clics", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 5200, quantityOnHand: 7, quantityReserved: 2, reorderThreshold: 3, restockDays: 24 },
  { ref: "LUN-GMT", name: "Lunette GMT 24 heures", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 5600, quantityOnHand: 4, quantityReserved: 0, reorderThreshold: 2, restockDays: 24 },
  { ref: "LUN-TAC", name: "Lunette tachymètre fixe, insert aluminium noir", category: "lunette", supplier: "Atelier Suwa", purchasePriceCents: 4300, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 2, restockDays: 24 },
  { ref: "INS-NOI", name: "Insert céramique noir", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3100, quantityOnHand: 9, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "INS-BLE", name: "Insert céramique bleu nuit", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3100, quantityOnHand: 6, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "INS-VER", name: "Insert céramique vert forêt", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 3300, quantityOnHand: 0, quantityReserved: 0, reorderThreshold: 2, restockDays: 38 },
  { ref: "INS-GRI", name: "Insert aluminium gris ardoise", category: "insert", supplier: "Ceramtech Nagano", purchasePriceCents: 1700, quantityOnHand: 4, quantityReserved: 0, reorderThreshold: 2, restockDays: 38 },
  { ref: "COU-SIG", name: "Couronne signée Chronova", category: "couronne", supplier: "Horotec Supply", purchasePriceCents: 2200, quantityOnHand: 12, quantityReserved: 3, reorderThreshold: 4, restockDays: 18 },
  { ref: "COU-LIS", name: "Couronne lisse", category: "couronne", supplier: "Horotec Supply", purchasePriceCents: 1400, quantityOnHand: 10, quantityReserved: 1, reorderThreshold: 4, restockDays: 18 },
  { ref: "COU-OIG", name: "Couronne oignon", category: "couronne", supplier: "Horotec Supply", purchasePriceCents: 1900, quantityOnHand: 6, quantityReserved: 0, reorderThreshold: 3, restockDays: 18 },
  { ref: "BRA-3M", name: "Bracelet acier trois maillons", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 6800, quantityOnHand: 7, quantityReserved: 2, reorderThreshold: 3, restockDays: 21 },
  { ref: "BRA-JUB", name: "Bracelet acier jubilé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 8900, quantityOnHand: 4, quantityReserved: 1, reorderThreshold: 2, restockDays: 21 },
  { ref: "BRA-CUI", name: "Bracelet cuir tannage végétal", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 3400, quantityOnHand: 15, quantityReserved: 3, reorderThreshold: 5, restockDays: 12 },
  { ref: "BRA-GLA", name: "Bracelet cuir glacé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 4200, quantityOnHand: 8, quantityReserved: 0, reorderThreshold: 3, restockDays: 12 },
  { ref: "BRA-CAO", name: "Bracelet caoutchouc vulcanisé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 2600, quantityOnHand: 2, quantityReserved: 2, reorderThreshold: 4, restockDays: 12 },
  { ref: "BRA-NAT", name: "Bracelet NATO tissé", category: "bracelet", supplier: "Strapworks Lyon", purchasePriceCents: 1600, quantityOnHand: 18, quantityReserved: 2, reorderThreshold: 6, restockDays: 12 },
  { ref: "VER-PLA", name: "Saphir plat", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 2100, quantityOnHand: 13, quantityReserved: 3, reorderThreshold: 5, restockDays: 38 },
  { ref: "VER-BOM", name: "Saphir bombé", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 3600, quantityOnHand: 6, quantityReserved: 2, reorderThreshold: 3, restockDays: 38 },
  { ref: "VER-BOX", name: "Saphir box", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 5400, quantityOnHand: 5, quantityReserved: 0, reorderThreshold: 2, restockDays: 38 },
  { ref: "VER-LOU", name: "Loupe de quantième saphir", category: "verre", supplier: "Ceramtech Nagano", purchasePriceCents: 1200, quantityOnHand: 8, quantityReserved: 0, reorderThreshold: 3, restockDays: 38 },
  { ref: "MOU-NH35", name: "Mouvement Seiko NH35", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 5200, quantityOnHand: 16, quantityReserved: 5, reorderThreshold: 6, restockDays: 28 },
  { ref: "MOU-NH34", name: "Mouvement Seiko NH34 GMT", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 9800, quantityOnHand: 3, quantityReserved: 2, reorderThreshold: 3, restockDays: 42 },
  { ref: "MOU-NH38", name: "Mouvement Seiko NH38 cœur ouvert", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 7400, quantityOnHand: 5, quantityReserved: 1, reorderThreshold: 3, restockDays: 28 },
  { ref: "MOU-VK64", name: "Mouvement Seiko VK64 meca-quartz", category: "mouvement", supplier: "Time Module Europe", purchasePriceCents: 14200, quantityOnHand: 4, quantityReserved: 1, reorderThreshold: 2, restockDays: 45 },
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
