/**
 * Configuration résolue consommée par le moteur de rendu.
 *
 * Ce type est la frontière entre la base et le dessin : le catalogue stocke des
 * clés d'options (`Option.svgPartKey`, `Option.colorHex`, `Option.renderMeta`),
 * une fonction de résolution les traduit en `WatchRender`. Le moteur ne connaît
 * ni Prisma, ni les prix, ni le stock — il ne sait que dessiner.
 */

export type CaseSize = 37 | 38 | 39 | 40;
export type CaseFinish = "brosse" | "poli" | "microbille";
export type MetalTone = "acier" | "dore" | "noir" | "bleui";
export type DialTexture = "emaille" | "soleille" | "mat";
export type IndexStyle = "batons" | "arabes";
export type HandShape = "glaive" | "mercedes" | "crayon";
export type BezelStyle = "lisse" | "cannelee" | "plongee";
export type InsertMaterial = "ceramique" | "aluminium";
export type CrownStyle = "signee" | "lisse";
export type StrapKind = "acier-3-maillons" | "acier-jubile" | "cuir" | "caoutchouc" | "nato";
export type Crystal = "plat" | "bombe";
export type Movement = "NH35" | "NH34" | "NH38";
export type Caseback = "plein" | "transparent";
export type WatchView = "face" | "profil" | "dos";

export interface WatchRender {
  caseSize: CaseSize;
  caseFinish: CaseFinish;
  caseMetal: MetalTone;

  bezelStyle: BezelStyle;
  insertColor?: string;
  insertMaterial?: InsertMaterial;

  dialColor: string;
  dialTexture: DialTexture;
  indexStyle: IndexStyle;

  handShape: HandShape;
  handMetal: MetalTone;
  lume: boolean;

  crownStyle: CrownStyle;
  crownMetal: MetalTone;

  strapKind: StrapKind;
  strapColor: string;

  crystal: Crystal;
  /** Traitement antireflet interne du saphir. */
  antiGlare: boolean;
  movement: Movement;
  /** Certains montages se passent de date : le cadran reste épuré. */
  showDate?: boolean;
  caseback: Caseback;
  engraving?: string;

  /** Heure figée du rendu. 10 h 10 : la position des photographies horlogères. */
  time?: { hours: number; minutes: number; seconds: number };
}

/** Les calques, dans l'ordre exact de superposition en vue de face. */
export const FACE_LAYERS = [
  "ombre",
  "bracelet",
  "boitier",
  "lunette",
  "insert",
  "cadran",
  "minuterie",
  "index",
  "signature",
  "guichet-date",
  "aiguilles",
  "axe",
  "verre",
  "reflet",
  "couronne",
] as const;

export type FaceLayer = (typeof FACE_LAYERS)[number];
