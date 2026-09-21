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
/**
 * `montagne` : chiffres pairs appliqués et index en pointe aux heures impaires,
 * le cadran des montres de montagne japonaises. `terrain-24h` : chiffres arabes
 * luminescents doublés d'une petite échelle 13–24 imprimée, montre de terrain.
 */
export type IndexStyle = "batons" | "arabes" | "plongee" | "montagne" | "terrain-24h";
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
/** `tachymetre` : lunette fixe à insert noir, échelle de vitesse 60–500 d'un chronographe de sport. */
export type BezelStyle = "lisse" | "cannelee" | "plongee" | "gmt" | "tachymetre";
export type InsertMaterial = "ceramique" | "aluminium";
/** `oignon` : couronne bombée et plus grosse des habillées, qu'on saisit sans ôter la montre. */
export type CrownStyle = "signee" | "lisse" | "oignon";
/** `cuir-glace` : veau glacé, brillant, à fine surpiqûre ton sur ton — le brin des habillées. */
export type StrapKind = "acier-3-maillons" | "acier-jubile" | "cuir" | "cuir-glace" | "caoutchouc" | "nato";
/** `box` : verre très saillant à flancs droits et dessus bombé, comme les verres acryliques d'autrefois. */
export type Crystal = "plat" | "bombe" | "box";
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
  /**
   * Seconde teinte de l'insert. Sur une lunette GMT : la demi-lunette de jour
   * (6 h – 18 h). Sur une lunette de plongée : le secteur des vingt premières
   * minutes, celui des paliers. Absent : insert uni.
   */
  insertColor2?: string;
  insertMaterial?: InsertMaterial;

  dialColor: string;
  dialTexture: DialTexture;
  indexStyle: IndexStyle;
  /** Métal des index appliqués. Absent : ils suivent le métal du boîtier. */
  indexMetal?: MetalTone;

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
  /** Loupe de quantième collée sur le verre, à 3 h. Absent : verre nu. */
  cyclops?: boolean;
  /** Traitement antireflet interne du saphir. */
  antiGlare: boolean;
  movement: Movement;
  /**
   * Teinte de l'aiguille de fonction : l'aiguille 24 h d'un GMT, la trotteuse
   * centrale d'un chronographe. Absent : elle suit le métal des autres aiguilles.
   */
  accentHandColor?: string;
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
  /**
   * Étanchéité réelle du modèle, en mètres : une donnée de la fiche, jamais une
   * valeur inventée par le dessin. Présente, elle s'imprime sous « AUTOMATIQUE »
   * et se grave au dos ; absente, le cadran garde sa ligne de calibre.
   */
  waterResistM?: number;

  /** Heure figée du rendu. 10 h 10 : la position des photographies horlogères. */
  time?: { hours: number; minutes: number; seconds: number };
}

/** Les calques, dans l'ordre exact de superposition en vue de face. */
export const FACE_LAYERS = [
  "ombre",
  "bracelet",
  // La couronne se dessine AVANT le boîtier : son pied disparaît sous le flanc.
  "couronne",
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
] as const;

export type FaceLayer = (typeof FACE_LAYERS)[number];
