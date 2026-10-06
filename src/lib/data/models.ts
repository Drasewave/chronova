import type { OptionRef, Selections } from "@/lib/configurateur/types";
import type { WatchStyleKey } from "./types";

/**
 * Modèles de base, en DONNÉES D'EXEMPLE.
 *
 * `WatchModelView` est la forme qu'attendent les pages : les fixtures ci-dessous
 * et le chargement depuis la base (`queries.ts`) produisent exactement la même.
 *
 * Un modèle n'est pas un dessin : c'est un prix de base, des caractéristiques de
 * boîtier, et une configuration de départ. Le rendu se déduit des sélections par
 * `resolveRender` — il n'existe donc qu'une seule description de chaque montre,
 * celle que le configurateur manipule.
 *
 * Prix, délais et disponibilités sont fictifs, repérés par `isSample`, affichés
 * avec une pastille « Exemple » et modifiables depuis le CRM (phase 5).
 */

export interface WatchModelView {
  slug: string;
  name: string;
  style: WatchStyleKey;
  styleLabel: string;
  tagline: string;
  summary: string;
  /** Diamètre de la configuration de départ. */
  diameterMm: number;
  /** Diamètres proposés sur cette ligne ; les autres sont exclus du configurateur. */
  availableSizes: string[];
  lugToLugMm: number;
  thicknessMm: number;
  lugWidthMm: number;
  waterResistM: number;
  movementNote: string;
  basePriceCents: number;
  assemblyDays: number;
  isSample: boolean;
  defaultSelections: Selections;
  /** Second coloris montré au survol de la carte : un correctif, pas un doublon. */
  altSelections: Selections;
}

const COMMUN: Selections = {
  finition: "brosse",
  cadran: "romains-blanc-argent",
  date: "avec",
  "aiguilles-forme": "glaive",
  "aiguilles-metal": "acier",
  luminova: "avec",
  "lunette-style": "lisse",
  "couronne-signature": "signee",
  "couronne-metal": "acier",
  "couronne-vissee": "vissee",
  "couronne-position": "3h",
  "boitier-forme": "rond",
  rehaut: "aucun",
  loupe: "sans",
  "bracelet-type": "acier-3-maillons",
  poignet: "180",
  "verre-forme": "plat",
  antireflet: "interne",
  mouvement: "nh35",
  "fond-type": "plein",
};

export const SAMPLE_MODELS: WatchModelView[] = [
  {
    slug: "abysse-40",
    name: "Abysse 40",
    style: "plongee",
    styleLabel: "Plongée",
    tagline: "Carrure coussin, couronne à 4 h, lunette 120 crans, 200 mètres.",
    summary:
      "Une plongeuse à carrure coussin : un galet large aux cornes courtes, dont le flanc enveloppe une couronne vissée déportée à 4 h. Lunette unidirectionnelle à 120 crans, large insert céramique, aiguilles flèche, cadran bleu à chiffres arabes orientaux et guichet jour-date.",
    diameterMm: 40,
    availableSizes: ["40"],
    lugToLugMm: 47.5,
    thicknessMm: 12.8,
    lugWidthMm: 20,
    waterResistM: 200,
    movementNote: "Automatique NH36 à jour et date, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 129000,
    assemblyDays: 18,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "40",
      // Cible : la plongeuse coussin japonaise de 1976, celle que sa carapace a
      // fait surnommer d'un nom de reptile. Carrure coussin, couronne déportée à
      // 4 h et noyée dans le flanc, large insert, aiguilles flèche, jour-date,
      // gros index ronds, deux lignes de texte en bas du cadran.
      "boitier-forme": "coussin",
      cadran: "arabes-chapitre-bleu",
      date: "jour-date",
      // Le jour de la semaine suppose le NH36 : le NH35 n'a que le quantième.
      mouvement: "nh36",
      "aiguilles-forme": "fleche",
      "lunette-style": "plongee",
      "insert-matiere": "ceramique",
      "insert-teinte": "bleu-nuit",
      "couronne-signature": "lisse",
      "couronne-position": "4h",
      "verre-forme": "bombe",
    },
    // Second coloris : la même en noir, sur caoutchouc gaufré.
    altSelections: {
      cadran: "arabes-chapitre-noir-or",
      "insert-teinte": "noir",
      "bracelet-type": "caoutchouc",
      "bracelet-teinte": "caoutchouc-noir",
    },
  },
  {
    slug: "sentier-38",
    name: "Sentier 38",
    style: "terrain",
    styleLabel: "Pilote",
    tagline: "Chiffres romains dorés sur cadran champagne, aiguilles cathédrale, cuir chocolat.",
    summary:
      "Une montre de montagne habillée : chiffres romains dorés appliqués aux heures paires et bâtons fins aux heures impaires sur un cadran champagne soleillé, aiguilles cathédrale dorées à segments luminescents, boîtier poli.",
    diameterMm: 38,
    availableSizes: ["38", "39"],
    lugToLugMm: 45.2,
    thicknessMm: 11.4,
    lugWidthMm: 20,
    waterResistM: 100,
    movementNote: "Automatique, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 109000,
    assemblyDays: 14,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "38",
      // Cible : la montre de montagne japonaise à cadran vert et index dorés,
      // deux couronnes (3 h et 4 h), réhaut boussole, boîtier poli.
      finition: "poli",
      cadran: "romains-champagne",
      rehaut: "aucun",
      "aiguilles-forme": "cathedrale",
      "aiguilles-metal": "dore",
      "couronne-signature": "lisse",
      "bracelet-type": "cuir",
      "bracelet-teinte": "chocolat",
      poignet: "170",
      "verre-forme": "bombe",
    },
    altSelections: {
      cadran: "romains-noir-or",
      "bracelet-teinte": "fauve",
    },
  },
  {
    slug: "meridien-39",
    name: "Méridien 39",
    style: "gmt",
    styleLabel: "GMT",
    tagline: "Deuxième fuseau, disque 24 h, lunette 24 h bicolore, aiguille GMT rouge, mouvement NH34.",
    summary:
      "Une aiguille laquée rouge fait un tour de cadran en vingt-quatre heures et se règle indépendamment. Le second fuseau se lit sur la lunette bicolore, nuit en haut, jour en bas. Couronne à 4 h entre ses épaulements, loupe sur le quantième, jubilé à maillons centraux polis.",
    diameterMm: 39,
    availableSizes: ["39", "40"],
    lugToLugMm: 46.4,
    thicknessMm: 12.1,
    lugWidthMm: 20,
    waterResistM: 100,
    movementNote: "Automatique GMT, aiguille 24 h indépendante.",
    basePriceCents: 148000,
    assemblyDays: 21,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "39",
      // Cible : le GMT sport bicolore japonais, bâti sur la boîte de la plongeuse
      // ronde à couronne 4 h. Lunette 24 h noir et gris, aiguille 24 h rouge,
      // quantième sous loupe, jubilé.
      cadran: "sky-noir-or",
      "aiguilles-forme": "fleche",
      "lunette-style": "gmt",
      "insert-matiere": "aluminium",
      "insert-teinte": "noir",
      "insert-bicolore": "gris",
      "couronne-signature": "lisse",
      "couronne-position": "4h",
      "bracelet-type": "acier-jubile",
      loupe: "avec",
      mouvement: "nh34",
      "aiguille-24h": "fleche",
      "aiguille-fonction-teinte": "rouge",
    },
    // Second coloris : cadran bleu, lunette bleu et rouge.
    altSelections: {
      cadran: "sky-blanc-or",
      "insert-teinte": "bleu-nuit",
      "insert-bicolore": "rouge",
    },
  },
  {
    slug: "soiree-37",
    name: "Soirée 37",
    style: "habillee",
    styleLabel: "Habillée",
    tagline: "Chiffres romains sur cadran blanc, index or, verre box, couronne oignon, cuir glacé.",
    summary:
      "Un cadran blanc à chiffres romains dorés, sous un saphir box très bombé. Aiguilles dauphine polies, sans luminova, quantième encadré à 3 h, couronne oignon et cuir glacé.",
    diameterMm: 37,
    availableSizes: ["37", "38"],
    lugToLugMm: 43.8,
    thicknessMm: 10.2,
    lugWidthMm: 18,
    waterResistM: 50,
    movementNote: "Automatique, quantième à 3 h, fond saphir.",
    basePriceCents: 119000,
    assemblyDays: 14,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "37",
      finition: "poli",
      // Cible : l'habillée japonaise à cadran glacé. Cadran
      // très soleillé et bombé, index facettés, dauphine, quantième encadré,
      // grosse couronne oignon, verre box, cuir brillant.
      cadran: "romains-blanc-or",
      "aiguilles-forme": "dauphine",
      luminova: "sans",
      "couronne-signature": "oignon",
      "couronne-vissee": "poussoir",
      "bracelet-type": "cuir-glace",
      "bracelet-teinte": "glace-noir",
      poignet: "170",
      "verre-forme": "box",
      "fond-type": "transparent",
    },
    altSelections: {
      cadran: "romains-blanc-rose",
      "aiguilles-metal": "dore",
      "couronne-metal": "dore",
      "bracelet-teinte": "glace-brun",
    },
  },
  {
    slug: "rallye-41",
    name: "Rallye 41",
    style: "chronographe",
    styleLabel: "Chronographe sport",
    tagline: "Cadran gris à bâtons fins, lunette tachymètre, poussoirs à piston, trotteuse rouge.",
    summary:
      "Un mouvement méca-quartz entraîne mécaniquement la trotteuse et les deux compteurs, commandés par les deux poussoirs ; la minuterie reste au quartz, sans date. Cadran gris à bâtons fins et compteurs noirs, lunette fixe à échelle tachymétrique, poussoirs à piston à 2 h et 4 h sur un boîtier de 41 mm.",
    diameterMm: 41,
    availableSizes: ["41"],
    lugToLugMm: 48.4,
    thicknessMm: 14.6,
    lugWidthMm: 20,
    waterResistM: 100,
    movementNote: "Chronographe méca-quartz, trotteuse et compteurs mécaniques, minuterie à quartz.",
    basePriceCents: 179000,
    assemblyDays: 21,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "41",
      // Cible : le chronographe « panda » de sport japonais. Cadran blanc cassé,
      // compteurs noirs, lunette tachymètre noire, poussoirs à piston, aiguilles
      // bâtons luminescentes, trotteuse centrale rouge, bracelet acier.
      cadran: "diary-gris",
      "aiguilles-forme": "crayon",
      "lunette-style": "tachymetre",
      "couronne-signature": "lisse",
      "verre-forme": "bombe",
      date: "sans",
      mouvement: "vk64",
      "aiguille-fonction-teinte": "rouge",
      compteurs: "inverse",
    },
    altSelections: {
      cadran: "diary-noir-or",
    },
  },
  {
    slug: "piste-39",
    name: "Piste 39",
    style: "terrain",
    styleLabel: "Pilote",
    tagline: "Bâtons fins sur cadran bleu, couronne à 4 h, NATO kaki.",
    summary:
      "La version d'entrée de la ligne terrain : cadran bleu à bâtons fins et minuterie fine, aiguilles flèche et guichet jour-date, sur un boîtier microbillé à couronne déportée à 4 h, avec une sangle NATO qui passe sous le boîtier.",
    diameterMm: 39,
    availableSizes: ["38", "39"],
    lugToLugMm: 45.8,
    thicknessMm: 11.6,
    lugWidthMm: 20,
    waterResistM: 100,
    movementNote: "Automatique NH36 à jour et date, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 99000,
    assemblyDays: 12,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "39",
      finition: "microbille",
      // Cible : la « field » sport japonaise, bâtie sur la boîte de la plongeuse
      // ronde. Cadran mat à double échelle 12/24 h, jour-date, couronne 4 h, NATO.
      cadran: "diary-bleu",
      date: "jour-date",
      // Le jour de la semaine suppose le NH36 : le NH35 n'a que le quantième.
      mouvement: "nh36",
      "aiguilles-forme": "fleche",
      "couronne-signature": "lisse",
      "couronne-position": "4h",
      "bracelet-type": "nato",
      "bracelet-teinte": "nato-kaki",
      poignet: "180",
    },
    altSelections: {
      cadran: "diary-cuivre",
      "bracelet-teinte": "nato-sable",
    },
  },
  {
    slug: "corail-39",
    name: "Corail 39",
    style: "plongee",
    styleLabel: "Plongée",
    tagline: "Boîtier rond, couronne à 4 h entre ses épaulements, insert aluminium, 200 mètres.",
    summary:
      "Le même cahier des charges que l'Abysse dans un boîtier rond plus discret : lunette unidirectionnelle à 120 crans et large insert aluminium, cadran à chiffres romains or rose, jour-date, couronne vissée à 4 h protégée par deux épaulements, bracelet jubilé. Je l'ai conçue pour les petits poignets, avec le même équipement de plongée.",
    diameterMm: 39,
    availableSizes: ["39"],
    lugToLugMm: 46.0,
    thicknessMm: 12.2,
    lugWidthMm: 20,
    waterResistM: 200,
    movementNote: "Automatique NH36 à jour et date, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 124000,
    assemblyDays: 16,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "39",
      // Cible : la plongeuse ronde japonaise à couronne 4 h, la plus portée des
      // années 90-2000. Tout noir sur jubilé ; en second coloris, l'insert bleu
      // aux vingt premières minutes rouges, sur caoutchouc.
      cadran: "romains-or-rose",
      date: "jour-date",
      // Le jour de la semaine suppose le NH36 : le NH35 n'a que le quantième.
      mouvement: "nh36",
      "aiguilles-forme": "fleche",
      "lunette-style": "plongee",
      "insert-matiere": "aluminium",
      "insert-teinte": "noir",
      "couronne-signature": "lisse",
      "couronne-position": "4h",
      "bracelet-type": "acier-jubile",
    },
    altSelections: {
      cadran: "romains-turquoise",
      "insert-teinte": "bleu-nuit",
      "insert-secteur": "rouge",
      "bracelet-type": "caoutchouc",
      "bracelet-teinte": "caoutchouc-noir",
    },
  },
  {
    slug: "lucarne-38",
    name: "Lucarne 38",
    style: "habillee",
    styleLabel: "Habillée",
    tagline: "Cœur ouvert sur le balancier, chiffres romains sur cadran bleu nuit, sans date, cuir glacé.",
    summary:
      "Une ouverture à 9 h, cerclée d'un jonc poli, laisse voir le balancier battre sous son pont. Cadran bleu nuit à chiffres romains, aiguilles dauphine, fond saphir : une habillée qui montre un peu de mécanique sans devenir une montre-outil.",
    diameterMm: 38,
    availableSizes: ["37", "38"],
    lugToLugMm: 44.6,
    thicknessMm: 10.8,
    lugWidthMm: 19,
    waterResistM: 50,
    movementNote: "Automatique, cœur ouvert sur le balancier, sans date, fond saphir.",
    basePriceCents: 134000,
    assemblyDays: 16,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "38",
      // Cible : l'habillée japonaise à cœur ouvert. Lucarne cerclée à 9 h sur le
      // balancier et son pont, cadran soleillé argent ou bleu nuit, dauphine.
      finition: "poli",
      cadran: "romains-bleu-nuit",
      date: "sans",
      "aiguilles-forme": "dauphine",
      luminova: "sans",
      "couronne-signature": "oignon",
      "couronne-vissee": "poussoir",
      "bracelet-type": "cuir-glace",
      "bracelet-teinte": "glace-noir",
      poignet: "170",
      "verre-forme": "bombe",
      mouvement: "nh38",
      "fond-type": "transparent",
    },
    altSelections: {
      cadran: "romains-noir-or",
      "bracelet-teinte": "glace-brun",
    },
  },
  {
    slug: "circuit-41",
    name: "Circuit 41",
    style: "chronographe",
    styleLabel: "Chronographe sport",
    tagline: "Cadran bleu nuit à bâtons fins, compteurs clairs, lunette tachymètre, acier.",
    summary:
      "Même base méca-quartz que la Rallye, dans la livrée inverse : cadran bleu nuit à bâtons fins, compteurs clairs à haut contraste, lunette fixe à échelle tachymétrique et bracelet acier.",
    diameterMm: 41,
    availableSizes: ["41"],
    lugToLugMm: 48.4,
    thicknessMm: 14.6,
    lugWidthMm: 20,
    waterResistM: 100,
    movementNote: "Chronographe méca-quartz, trotteuse et compteurs mécaniques, minuterie à quartz.",
    basePriceCents: 184000,
    assemblyDays: 22,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "41",
      // Cible : le même chronographe de sport japonais, en livrée inverse.
      cadran: "diary-bleu-nuit",
      "aiguilles-forme": "crayon",
      "lunette-style": "tachymetre",
      "couronne-signature": "lisse",
      "verre-forme": "bombe",
      date: "sans",
      mouvement: "vk64",
      compteurs: "panda",
    },
    altSelections: {
      cadran: "diary-blanc-or",
      "bracelet-type": "caoutchouc",
      "bracelet-teinte": "caoutchouc-noir",
    },
  },
];

export function getSampleModel(slug: string): WatchModelView | undefined {
  return SAMPLE_MODELS.find((model) => model.slug === slug);
}

/**
 * Diamètres qu'une ligne ne propose pas. Le configurateur les grise avec la
 * raison, plutôt que de les masquer : on comprend ainsi que le choix existe
 * ailleurs dans la collection.
 */
export function excludedOptionsFor(model: WatchModelView): ReadonlySet<OptionRef> {
  const toutes = ["37", "38", "39", "40", "41"];
  return new Set(
    toutes.filter((taille) => !model.availableSizes.includes(taille)).map((taille) => `taille:${taille}`),
  );
}
