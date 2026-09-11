import type { WatchRender, WatchStyleKey } from "./types";

/**
 * Quatre modèles de base, en DONNÉES D'EXEMPLE.
 *
 * Tous les prix, délais et disponibilités sont fictifs et repérés par
 * `isSample`. L'interface les affiche avec une pastille « exemple », et le CRM
 * (phase 5) les rend modifiables sans toucher au code. Ce module deviendra le
 * seed Prisma : les champs reprennent exactement ceux du modèle `WatchModel`.
 */

export interface SampleModel {
  slug: string;
  name: string;
  style: WatchStyleKey;
  styleLabel: string;
  tagline: string;
  /** Deux ou trois phrases, ton descriptif, aucune promesse commerciale. */
  summary: string;
  diameterMm: number;
  lugToLugMm: number;
  thicknessMm: number;
  lugWidthMm: number;
  waterResistM: number;
  movement: "NH35" | "NH34" | "NH38";
  movementNote: string;
  basePriceCents: number;
  assemblyDays: number;
  isSample: true;
  render: WatchRender;
  /** Second coloris montré au survol de la carte. */
  altRender: WatchRender;
}

const BASE: Omit<WatchRender, "dialColor" | "dialTexture" | "movement"> = {
  caseSize: 40,
  caseFinish: "brosse",
  caseMetal: "acier",
  bezelStyle: "lisse",
  indexStyle: "batons",
  handShape: "glaive",
  handMetal: "acier",
  lume: true,
  crownStyle: "signee",
  crownMetal: "acier",
  strapKind: "acier-3-maillons",
  strapColor: "#ADA69B",
  crystal: "bombe",
  caseback: "plein",
};

export const SAMPLE_MODELS: SampleModel[] = [
  {
    slug: "abysse-40",
    name: "Abysse 40",
    style: "plongee",
    styleLabel: "Plongée",
    tagline: "Lunette 120 clics, insert céramique, 200 mètres.",
    summary:
      "Un boîtier de plongée classique : lunette unidirectionnelle à 120 crans, couronne vissée, protège-couronne intégrés au flanc. L'insert céramique garde sa teinte au soleil, contrairement à l'aluminium.",
    diameterMm: 40,
    lugToLugMm: 47.5,
    thicknessMm: 12.8,
    lugWidthMm: 20,
    waterResistM: 200,
    movement: "NH35",
    movementNote: "Automatique, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 129000,
    assemblyDays: 18,
    isSample: true,
    render: {
      ...BASE,
      caseSize: 40,
      bezelStyle: "plongee",
      insertColor: "#1B2E42",
      insertMaterial: "ceramique",
      dialColor: "#1E3448",
      dialTexture: "soleille",
      handShape: "mercedes",
      movement: "NH35",
    },
    altRender: {
      ...BASE,
      caseSize: 40,
      bezelStyle: "plongee",
      insertColor: "#2C3B2C",
      insertMaterial: "aluminium",
      dialColor: "#3A4436",
      dialTexture: "soleille",
      handShape: "mercedes",
      movement: "NH35",
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
    lugToLugMm: 45.2,
    thicknessMm: 11.4,
    lugWidthMm: 20,
    waterResistM: 100,
    movement: "NH35",
    movementNote: "Automatique, 24 rubis, 41 h de réserve de marche.",
    basePriceCents: 109000,
    assemblyDays: 14,
    isSample: true,
    render: {
      ...BASE,
      caseSize: 38,
      caseFinish: "microbille",
      dialColor: "#26241F",
      dialTexture: "mat",
      indexStyle: "arabes",
      handShape: "crayon",
      strapKind: "cuir",
      strapColor: "#8A5A33",
      crystal: "plat",
      movement: "NH35",
    },
    altRender: {
      ...BASE,
      caseSize: 38,
      caseFinish: "microbille",
      dialColor: "#3D4A3A",
      dialTexture: "mat",
      indexStyle: "arabes",
      handShape: "crayon",
      strapKind: "nato",
      strapColor: "#5D6152",
      crystal: "plat",
      movement: "NH35",
    },
  },
  {
    slug: "meridien-39",
    name: "Méridien 39",
    style: "gmt",
    styleLabel: "GMT",
    tagline: "Deuxième fuseau, échelle 24 h, mouvement NH34.",
    summary:
      "Une aiguille supplémentaire fait un tour de cadran en vingt-quatre heures et se règle indépendamment. L'échelle imprimée sur le cadran reste lisible sans lunette tournante.",
    diameterMm: 39,
    lugToLugMm: 46.4,
    thicknessMm: 12.1,
    lugWidthMm: 20,
    waterResistM: 100,
    movement: "NH34",
    movementNote: "Automatique GMT, aiguille 24 h indépendante.",
    basePriceCents: 148000,
    assemblyDays: 21,
    isSample: true,
    render: {
      ...BASE,
      caseSize: 39,
      caseFinish: "poli",
      bezelStyle: "cannelee",
      dialColor: "#474B50",
      dialTexture: "soleille",
      strapKind: "acier-jubile",
      movement: "NH34",
    },
    altRender: {
      ...BASE,
      caseSize: 39,
      caseFinish: "poli",
      bezelStyle: "cannelee",
      dialColor: "#C98263",
      dialTexture: "soleille",
      handMetal: "dore",
      crownMetal: "dore",
      strapKind: "cuir",
      strapColor: "#4A3728",
      movement: "NH34",
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
    lugToLugMm: 43.8,
    thicknessMm: 10.2,
    lugWidthMm: 18,
    waterResistM: 50,
    movement: "NH35",
    movementNote: "Automatique, date masquée, fond gravé.",
    basePriceCents: 119000,
    assemblyDays: 14,
    isSample: true,
    render: {
      ...BASE,
      caseSize: 37,
      caseFinish: "poli",
      dialColor: "#EFE7D6",
      dialTexture: "emaille",
      handMetal: "bleui",
      lume: false,
      showDate: false,
      strapKind: "cuir",
      strapColor: "#4A3728",
      movement: "NH35",
    },
    altRender: {
      ...BASE,
      caseSize: 37,
      caseFinish: "poli",
      dialColor: "#C98263",
      dialTexture: "emaille",
      handMetal: "dore",
      crownMetal: "dore",
      lume: false,
      showDate: false,
      strapKind: "cuir",
      strapColor: "#3A2C22",
      movement: "NH35",
    },
  },
];

export function getSampleModel(slug: string): SampleModel | undefined {
  return SAMPLE_MODELS.find((model) => model.slug === slug);
}
