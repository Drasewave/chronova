import type { OptionRef, Selections } from "@/lib/configurateur/types";
import type { WatchStyleKey } from "./types";

/**
 * Quatre modèles de base, en DONNÉES D'EXEMPLE.
 *
 * Un modèle n'est pas un dessin : c'est un prix de base, des caractéristiques de
 * boîtier, et une configuration de départ. Le rendu se déduit des sélections par
 * `resolveRender` — il n'existe donc qu'une seule description de chaque montre,
 * celle que le configurateur manipule.
 *
 * Prix, délais et disponibilités sont fictifs, repérés par `isSample`, affichés
 * avec une pastille « Exemple » et modifiables depuis le CRM (phase 5).
 */

export interface SampleModel {
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
  isSample: true;
  defaultSelections: Selections;
  /** Second coloris montré au survol de la carte : un correctif, pas un doublon. */
  altSelections: Selections;
}

const COMMUN: Selections = {
  finition: "brosse",
  "cadran-finition": "soleille",
  index: "batons",
  date: "avec",
  "aiguilles-forme": "glaive",
  "aiguilles-metal": "acier",
  luminova: "avec",
  "lunette-style": "lisse",
  "couronne-signature": "signee",
  "couronne-metal": "acier",
  "couronne-vissee": "vissee",
  "bracelet-type": "acier-3-maillons",
  poignet: "180",
  "verre-forme": "plat",
  antireflet: "interne",
  mouvement: "nh35",
  "fond-type": "plein",
};

export const SAMPLE_MODELS: SampleModel[] = [
  {
    slug: "abysse-40",
    name: "Abysse 40",
    style: "plongee",
    styleLabel: "Plongée",
    tagline: "Lunette 120 clics, insert céramique, 200 mètres.",
    summary:
      "Un boîtier de plongée classique : lunette unidirectionnelle à 120 crans, couronne vissée, protège-couronne venus de matière avec le flanc. L'insert céramique garde sa teinte au soleil, contrairement à l'aluminium.",
    diameterMm: 40,
    availableSizes: ["40"],
    lugToLugMm: 47.5,
    thicknessMm: 12.8,
    lugWidthMm: 20,
    waterResistM: 200,
    movementNote: "Automatique, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 129000,
    assemblyDays: 18,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "40",
      "cadran-teinte": "bleu-abysse",
      "aiguilles-forme": "mercedes",
      "lunette-style": "plongee",
      "insert-matiere": "ceramique",
      "insert-teinte": "bleu-nuit",
      "verre-forme": "bombe",
    },
    altSelections: {
      "cadran-teinte": "vert-sauge",
      "insert-matiere": "aluminium",
      "insert-teinte": "gris-ardoise",
    },
  },
  {
    slug: "sentier-38",
    name: "Sentier 38",
    style: "terrain",
    styleLabel: "Terrain",
    tagline: "Chiffres arabes, cadran mat, cuir fauve.",
    summary:
      "Une montre de terrain lisible dans toutes les lumières : chiffres arabes pleins, cadran mat sans reflet, aiguilles crayon largement luminescentes. Boîtier microbillé pour ne pas accrocher le soleil.",
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
      finition: "microbille",
      "cadran-teinte": "noir-mat",
      "cadran-finition": "mat",
      index: "arabes",
      "aiguilles-forme": "crayon",
      "couronne-signature": "lisse",
      "bracelet-type": "cuir",
      "bracelet-teinte": "fauve",
      poignet: "170",
    },
    altSelections: {
      "cadran-teinte": "vert-sauge",
      "bracelet-type": "nato",
      "bracelet-teinte": "nato-kaki",
    },
  },
  {
    slug: "meridien-39",
    name: "Méridien 39",
    style: "gmt",
    styleLabel: "GMT",
    tagline: "Deuxième fuseau, échelle 24 h, mouvement NH34.",
    summary:
      "Une aiguille supplémentaire fait un tour de cadran en vingt-quatre heures et se règle indépendamment. L'échelle imprimée sur le réhaut reste lisible sans lunette tournante.",
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
      finition: "poli",
      "cadran-teinte": "gris-ardoise",
      "lunette-style": "cannelee",
      "bracelet-type": "acier-jubile",
      "verre-forme": "bombe",
      mouvement: "nh34",
      "aiguille-24h": "fleche",
    },
    altSelections: {
      "cadran-teinte": "saumon",
      "aiguilles-metal": "dore",
      "couronne-metal": "dore",
      "bracelet-type": "cuir",
      "bracelet-teinte": "chocolat",
    },
  },
  {
    slug: "soiree-37",
    name: "Soirée 37",
    style: "habillee",
    styleLabel: "Habillée",
    tagline: "Cadran émail crème, sans date, cuir chocolat.",
    summary:
      "Le cadran est volontairement nu : pas de guichet, pas de texte superflu, des index appliqués et une minuterie fine. Le boîtier poli reste sous la manchette.",
    diameterMm: 37,
    availableSizes: ["37", "38"],
    lugToLugMm: 43.8,
    thicknessMm: 10.2,
    lugWidthMm: 18,
    waterResistM: 50,
    movementNote: "Automatique, date masquée, fond saphir.",
    basePriceCents: 119000,
    assemblyDays: 14,
    isSample: true,
    defaultSelections: {
      ...COMMUN,
      taille: "37",
      finition: "poli",
      "cadran-teinte": "creme",
      "cadran-finition": "emaille",
      date: "sans",
      "aiguilles-metal": "bleui",
      luminova: "sans",
      "couronne-vissee": "poussoir",
      "bracelet-type": "cuir",
      "bracelet-teinte": "chocolat",
      poignet: "170",
      "verre-forme": "bombe",
      "fond-type": "transparent",
    },
    altSelections: {
      "cadran-teinte": "saumon",
      "aiguilles-metal": "dore",
      "couronne-metal": "dore",
      "bracelet-teinte": "cuir-noir",
    },
  },
];

export function getSampleModel(slug: string): SampleModel | undefined {
  return SAMPLE_MODELS.find((model) => model.slug === slug);
}

/**
 * Diamètres qu'une ligne ne propose pas. Le configurateur les grise avec la
 * raison, plutôt que de les masquer : on comprend ainsi que le choix existe
 * ailleurs dans la collection.
 */
export function excludedOptionsFor(model: SampleModel): ReadonlySet<OptionRef> {
  const toutes = ["37", "38", "39", "40"];
  return new Set(
    toutes.filter((taille) => !model.availableSizes.includes(taille)).map((taille) => `taille:${taille}`),
  );
}
