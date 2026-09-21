/**
 * Configuration résolue consommée par le moteur de rendu.
 *
 * Ce type est la frontière entre la base et le dessin : le catalogue stocke des
 * clés d'options (`Option.svgPartKey`, `Option.colorHex`, `Option.renderMeta`),
 * une fonction de résolution les traduit en `WatchRender`. Le moteur ne connaît
 * ni Prisma, ni les prix, ni le stock — il ne sait que dessiner.
 */

export type CaseSize = 37 | 38 | 39 | 40 | 41;
export type CaseFinish = "brosse" | "poli" | "microbille";
export type MetalTone = "acier" | "dore" | "noir" | "bleui";
/** Forme de la carrure vue de face : ronde, ou en coussin large aux cornes courtes. */
export type CaseShape = "rond" | "coussin";
/** `soleil-profond` : soleillage très contrasté, fumé vers le bord, gaufré en rayons. */
export type DialTexture = "emaille" | "soleille" | "mat" | "soleil-profond";
export type IndexStyle = "batons" | "arabes" | "plongee";
/**
 * `fleche` : jeu de plongeuse japonaise (heure en flèche courte, minute en glaive
 * large). `dauphine` : deux facettes polies, montre habillée. `cathedrale` :
 * aiguilles ajourées à segments lumineux, montre de montagne.
 */
export type HandShape = "glaive" | "mercedes" | "crayon" | "fleche" | "dauphine" | "cathedrale";
/** Guichet à 3 h : quantième seul, ou jour de la semaine et quantième. */
export type DateWindow = "date" | "jour-date";
/** Réhaut tournant gradué en points cardinaux, commandé par une seconde couronne. */
export type InnerRing = "aucun" | "boussole";
export type BezelStyle = "lisse" | "cannelee" | "plongee" | "gmt";
export type InsertMaterial = "ceramique" | "aluminium";
export type CrownStyle = "signee" | "lisse";
export type StrapKind = "acier-3-maillons" | "acier-jubile" | "cuir" | "caoutchouc" | "nato";
export type Crystal = "plat" | "bombe";
export type Movement = "NH35" | "NH34" | "NH38" | "VK64";
export type Caseback = "plein" | "transparent";
export type WatchView = "face" | "profil" | "dos";

export interface WatchRender {
  caseSize: CaseSize;
  caseFinish: CaseFinish;
  caseMetal: MetalTone;
  /** Absent : carrure ronde. */
  caseShape?: CaseShape;

  bezelStyle: BezelStyle;
  insertColor?: string;
  /** Demi-lunette de jour d'un insert GMT bicolore (6 h – 18 h). Absent : insert uni. */
  insertColor2?: string;
  insertMaterial?: InsertMaterial;

  dialColor: string;
  dialTexture: DialTexture;
  indexStyle: IndexStyle;

  handShape: HandShape;
  handMetal: MetalTone;
  lume: boolean;

  crownStyle: CrownStyle;
  crownMetal: MetalTone;
  /**
   * Position horaire de la couronne. Absent : 3 h. À 4 h, elle ne marque plus le
   * dos de la main — la signature des plongeuses japonaises.
   */
  crownAt?: 3 | 4;

  strapKind: StrapKind;
  strapColor: string;

  crystal: Crystal;
  /** Traitement antireflet interne du saphir. */
  antiGlare: boolean;
  movement: Movement;
  /** Teinte des compteurs chronographe (VK64 uniquement). */
  subdialColor?: string;
  /** Certains montages se passent de date : le cadran reste épuré. */
  showDate?: boolean;
  /** Contenu du guichet quand il est affiché. Absent : quantième seul. */
  dateWindow?: DateWindow;
  /** Réhaut boussole ; il amène sa propre couronne à 4 h. Absent : aucun. */
  innerRing?: InnerRing;
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
