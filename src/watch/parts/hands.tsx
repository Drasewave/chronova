import type { ReactNode } from "react";
import { LUME_EDGE, LUME_FILL, METALS, shade } from "../palette";
import { C, POSE_GMT_OFFSET_DEG, handAngles, n } from "../geometry";
import { teintesDauphine, teintesFacettes } from "../facettes";
import type { HandShape, MetalTone, Movement } from "../types";

interface HandsProps {
  uid: string;
  shape: HandShape;
  metal: MetalTone;
  lume: boolean;
  movement: Movement;
  time: { hours: number; minutes: number; seconds: number };
  detail?: "full" | "compact";
  /** Teinte laquée de l'aiguille de fonction (GMT, trotteuse de chronographe). */
  accent?: string;
  /**
   * `false` quand le rendu impose son heure (`render.time`) : l'horloge du site
   * n'y touche pas. Par défaut la pose de catalogue est reprise en main, une
   * fois la page montée, par `horloge-vivante.tsx`.
   */
  vivante?: boolean;
  /**
   * Vue projetée : chaque aiguille vit à sa hauteur sur le canon, et glisse
   * donc d'un peu plus ou d'un peu moins que les autres quand la montre tourne.
   * Le `transform` fourni est posé sur un groupe PARENT de l'aiguille — jamais
   * sur le groupe `data-aiguille`, dont l'horloge vivante réécrit le `rotate`.
   * Absent : aucun groupe supplémentaire, le rendu à plat est inchangé.
   */
  decalages?: Partial<Record<HandRole, string>>;
  /** Vue projetée : filtres d'ombre portée de remplacement (aiguilles basses, aiguilles hautes). */
  ombres?: { basse: string; haute: string };
}

export type HandRole = "heure" | "minute" | "seconde" | "gmt";

const HOUR_LEN = 182;
const MIN_LEN = 248;
const SEC_LEN = 262;
const GMT_LEN = 214;

/** Longueur de l'aiguille des heures, largeur des heures, largeur des minutes. */
const PROPORTIONS: Record<HandShape, readonly [number, number, number]> = {
  glaive: [HOUR_LEN, 36, 26],
  mercedes: [HOUR_LEN, 36, 26],
  crayon: [HOUR_LEN, 36, 26],
  fleche: [170, 62, 34],
  dauphine: [HOUR_LEN - 4, 42, 32],
  cathedrale: [HOUR_LEN, 54, 28],
};

/**
 * Aiguilles. Chacune est pliée en deux facettes le long de son axe ; la couleur
 * de chaque facette dépend de l'angle réel de l'aiguille dans le studio, d'où
 * un dégradé à rupture franche propre à chaque aiguille. Les ombres portées
 * sont appliquées hors rotation, pour tomber toutes du même côté, et
 * s'allongent avec la hauteur de l'aiguille sur le canon.
 *
 * Le serveur pose les aiguilles à l'heure de catalogue. Dans le navigateur,
 * `horloge-vivante.tsx` les retrouve par leurs attributs (`data-aiguille` sur
 * chaque groupe tournant, `data-facette` sur chaque teinte qui dépend de
 * l'angle) et écrit leur rotation sans passer par React : ce composant reste
 * pur, et comme ses props ne changent pas, React ne réécrit jamais par-dessus.
 */
export function Hands({ uid, shape, metal, lume, movement, time, detail = "full", accent, vivante = true, decalages, ombres }: HandsProps) {
  const lus = handAngles(time);
  const angles = {
    ...lus,
    // Chronographe arrêté et remis à zéro : sa grande aiguille centrale attend
    // à midi. La seconde courante vit dans le compteur « SEC » (`dial.tsx`).
    // C'est exactement ce que l'horloge vivante tient ensuite dans le navigateur :
    // entre le rendu serveur et la première image client, seule l'heure change.
    second: movement === "VK64" ? 0 : lus.second,
    // Pose de catalogue : l'aiguille 24 h montre un second fuseau (voir `geometry.ts`).
    gmt: vivante ? (lus.gmt + POSE_GMT_OFFSET_DEG) % 360 : lus.gmt,
  };
  const ramp = METALS[metal];
  const low = `url(#${ombres?.basse ?? `${uid}-hand-shadow`})`;
  const high = detail === "full" ? `url(#${ombres?.haute ?? `${uid}-hand-shadow-haut`})` : undefined;
  // Chaque jeu a ses proportions : la flèche de plongée est courte et trapue,
  // la dauphine large à la base, la cathédrale longue et fine.
  const [hourLen, hourW, minW] = PROPORTIONS[shape];
  // Étage d'une aiguille dans la vue projetée : un groupe parent, transparent
  // pour l'horloge vivante, qui ne connaît que le groupe `data-aiguille`.
  const etage = (role: HandRole, node: ReactNode) => {
    const t = decalages?.[role];
    return t ? (
      <g data-etage={role} transform={t}>
        {node}
      </g>
    ) : (
      node
    );
  };
  const minute = etage(
    "minute",
    <g data-aiguille="minute" transform={`rotate(${angles.minute})`}>
      <Hand fill={`url(#${uid}-hand-minute)`} shape={shape} role="minute" length={MIN_LEN} width={minW} metal={metal} lume={lume} angle={angles.minute} />
    </g>,
  );
  const seconde = etage(
    "seconde",
    <g data-aiguille="seconde" transform={`rotate(${angles.second})`}>
      <SecondHand fill={`url(#${uid}-hand-seconde)`} shape={shape} metal={metal} lume={lume} chrono={movement === "VK64"} accent={movement === "VK64" ? accent : undefined} />
    </g>,
  );

  return (
    // `id` stable : la loupe de quantième (`crystal.tsx`) reprend ce groupe par
    // `<use>` pour montrer, grossies, les aiguilles qui croisent le guichet. Un
    // `<use>` suit en direct les `transform` que l'horloge vivante écrit ici.
    <g id={`${uid}-aiguilles`} data-layer="aiguilles" data-calibre={movement} data-heure={vivante ? "vivante" : "fixe"} transform={`translate(${C} ${C})`}>
      <defs>
        <FacetGradient id={`${uid}-hand-heure`} role="heure" metal={metal} angle={angles.hour} />
        <FacetGradient id={`${uid}-hand-minute`} role="minute" metal={metal} angle={angles.minute} />
        <FacetGradient id={`${uid}-hand-seconde`} role="seconde" metal={metal} angle={angles.second} />
        <FacetGradient id={`${uid}-hand-gmt`} role="gmt" metal={metal} angle={angles.gmt} />
      </defs>

      <g filter={low}>
        {movement === "NH34" &&
          etage(
            "gmt",
            <g data-aiguille="gmt" transform={`rotate(${angles.gmt})`}>
              <GmtHand fill={accent ?? `url(#${uid}-hand-gmt)`} metal={metal} lume={lume} laquee={Boolean(accent)} />
            </g>,
          )}
        {etage(
          "heure",
          <g data-aiguille="heure" transform={`rotate(${angles.hour})`}>
            <Hand fill={`url(#${uid}-hand-heure)`} shape={shape} role="heure" length={hourLen} width={hourW} metal={metal} lume={lume} angle={angles.hour} />
          </g>,
        )}
        {!high && (
          <>
            {minute}
            {seconde}
          </>
        )}
      </g>

      {high && (
        <g filter={high}>
          {minute}
          {seconde}
        </g>
      )}

      {/* Canon : un bouchon poli, bombé, qui couvre la base des aiguilles. */}
      <g data-layer="axe">
        <circle r="15" fill={ramp.mid} stroke={ramp.edge} strokeWidth="1.2" />
        <circle r="14" fill={`url(#${uid}-metal-${metal})`} />
        <circle r="8.5" fill={ramp.light} stroke={ramp.dark} strokeOpacity="0.6" strokeWidth="1" />
        <circle cx="-3" cy="-3.5" r="3" fill="#FFFFFF" fillOpacity="0.85" />
      </g>
    </g>
  );
}

/**
 * Dégradé à rupture franche sur l'axe : facette gauche, facette droite.
 * `data-facette` et `data-metal` disent à l'horloge vivante quelle aiguille ce
 * dégradé habille et dans quel métal : de quoi recalculer les deux teintes
 * quand l'aiguille a tourné, avec la même formule (`facettes.ts`).
 */
function FacetGradient({ id, role, metal, angle }: { id: string; role: "heure" | "minute" | "seconde" | "gmt"; metal: MetalTone; angle: number }) {
  const [left, right] = teintesFacettes(metal, angle);
  return (
    <linearGradient id={id} data-facette={role} data-metal={metal} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.5" stopColor={left} />
      <stop offset="0.5" stopColor={right} />
    </linearGradient>
  );
}

function Hand({
  fill,
  shape,
  role,
  length,
  width,
  metal,
  lume,
  angle,
}: {
  fill: string;
  shape: HandShape;
  role: "heure" | "minute";
  length: number;
  width: number;
  metal: MetalTone;
  lume: boolean;
  /** Angle réel de l'aiguille dans le studio : décide de la facette éclairée. */
  angle: number;
}) {
  const ramp = METALS[metal];
  const lumeFill = lume ? LUME_FILL : ramp.light;
  const edge = { stroke: ramp.edge, strokeOpacity: 0.8, strokeWidth: 1.1, strokeLinejoin: "round" as const };
  const L = length;
  const w = width;

  // Jeu de plongeuse japonaise : l'heure est une flèche large et courte, qu'on
  // ne confond jamais avec la minute, même en eau trouble ; la minute un glaive
  // large, presque parallèle, qui ne s'effile qu'au dernier cinquième.
  if (shape === "fleche" && role === "heure") {
    const col = n(-L * 0.55); // haut du fût
    const barbe = n(-L * 0.48); // les barbes retombent un peu : la flèche est empennée
    return (
      <g>
        <path
          d={`M -11 26 L -11 ${col} L ${-w / 2} ${barbe} L 0 ${-L} L ${w / 2} ${barbe} L 11 ${col} L 11 26 Z`}
          fill={fill}
          {...edge}
        />
        {lume ? (
          <>
            <path d={`M 0 ${-L + 27} L ${-w / 2 + 12.5} ${n(-L * 0.565)} L ${w / 2 - 12.5} ${n(-L * 0.565)} Z`} fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="0.9" strokeLinejoin="round" />
            <rect x="-5.5" y={n(-L * 0.5)} width="11" height={n(L * 0.5 - 22)} rx="2" fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="0.9" />
          </>
        ) : (
          <line x1="0" y1="20" x2="0" y2={-L + 6} stroke={ramp.edge} strokeOpacity="0.4" strokeWidth="0.9" />
        )}
      </g>
    );
  }
  if (shape === "fleche") {
    const bas = n(-L * 0.2);
    const haut = n(-L * 0.79);
    return (
      <g>
        <path d={`M -8 28 L ${-w / 2} ${bas} L ${-w / 2 + 2} ${haut} L 0 ${-L} L ${w / 2 - 2} ${haut} L ${w / 2} ${bas} L 8 28 Z`} fill={fill} {...edge} />
        {lume ? (
          <path
            d={`M ${-w / 2 + 7} ${n(-L * 0.22)} L ${-w / 2 + 8.5} ${n(-L * 0.77)} L 0 ${-L + 30} L ${w / 2 - 8.5} ${n(-L * 0.77)} L ${w / 2 - 7} ${n(-L * 0.22)} Z`}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        ) : (
          <line x1="0" y1="24" x2="0" y2={-L + 6} stroke={ramp.edge} strokeOpacity="0.4" strokeWidth="0.9" />
        )}
      </g>
    );
  }

  // Dauphine : un losange très allongé, plié en deux versants polis. Tout son
  // charme est dans l'écart entre le versant qui prend la lumière et celui qui
  // renvoie le noir du studio : on le force, comme le ferait un photographe en
  // tournant la montre d'un degré. Pas de luminova par tradition ; s'il est
  // demandé, il tient dans une fine rainure.
  if (shape === "dauphine") {
    // Les deux versants sont teints en dur, pas par dégradé : ils portent donc
    // eux-mêmes de quoi être reteints quand l'aiguille tourne.
    const [gauche, droite] = teintesDauphine(metal, angle);
    const epaule = n(-L * 0.12);
    return (
      <g>
        <path data-versant="gauche" data-metal={metal} d={`M 0 26 L ${-w / 2} ${epaule} L 0 ${-L} Z`} fill={gauche} />
        <path data-versant="droit" data-metal={metal} d={`M 0 26 L ${w / 2} ${epaule} L 0 ${-L} Z`} fill={droite} />
        {/* L'arête du pli : un filet d'éclat, le seul trait de l'aiguille. */}
        <line x1="0" y1="24" x2="0" y2={-L + 2} stroke={ramp.hi} strokeOpacity="0.85" strokeWidth="0.9" />
        {lume && (
          <rect x="-2.6" y={n(-L * 0.7)} width="5.2" height={n(L * 0.44)} rx="2.6" fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="0.7" />
        )}
        <path d={`M 0 26 L ${-w / 2} ${epaule} L 0 ${-L} L ${w / 2} ${epaule} Z`} fill="none" {...edge} />
      </g>
    );
  }

  // Cathédrale : l'aiguille est un vitrail. Le métal n'est plus qu'un plomb qui
  // cerne des cellules de luminova — ou des jours, sans luminova : on voit alors
  // le cadran au travers. Les cellules sont de vrais trous (`evenodd`), pour que
  // l'ombre portée soit elle aussi ajourée.
  if (shape === "cathedrale" && role === "heure") {
    const y = (k: number) => n(-L * k);
    const cy = -L * 0.51;
    const rx = w / 2 - 7;
    const ry = L * 0.165;
    const k = ry * Math.sqrt(1 - 9 / (rx * rx));
    const cellules = [
      `M -3 ${n(cy - k)} A ${rx} ${n(ry)} 0 0 0 -3 ${n(cy + k)} Z`,
      `M 3 ${n(cy - k)} A ${rx} ${n(ry)} 0 0 1 3 ${n(cy + k)} Z`,
      `M 0 ${-L + 17} L -7.5 ${y(0.815)} L 0 ${y(0.75)} L 7.5 ${y(0.815)} Z`,
    ];
    const h = w / 2;
    const contour = `M -6 26 L -6 ${y(0.3)} C -6 ${y(0.36)} ${-h} ${y(0.4)} ${-h} ${y(0.52)} C ${-h} ${y(0.64)} -6 ${y(0.66)} -6 ${y(0.72)} C -6 ${y(0.76)} -13.5 ${y(0.76)} -13.5 ${y(0.815)} C -13.5 ${y(0.88)} -3 ${y(0.95)} 0 ${-L} C 3 ${y(0.95)} 13.5 ${y(0.88)} 13.5 ${y(0.815)} C 13.5 ${y(0.76)} 6 ${y(0.76)} 6 ${y(0.72)} C 6 ${y(0.66)} ${h} ${y(0.64)} ${h} ${y(0.52)} C ${h} ${y(0.4)} 6 ${y(0.36)} 6 ${y(0.3)} L 6 26 Z`;
    return (
      <g>
        <path d={`${contour} ${cellules.join(" ")}`} fillRule="evenodd" fill={fill} {...edge} />
        {lume && cellules.map((d) => <path key={d} d={d} fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="0.9" strokeLinejoin="round" />)}
      </g>
    );
  }
  if (shape === "cathedrale") {
    const y = (k: number) => n(-L * k);
    const h = w / 2;
    const cellules = [
      `M 0 ${y(0.425)} L ${-h + 5} ${y(0.49)} L ${-h + 5.7} ${y(0.605)} L ${h - 5.7} ${y(0.605)} L ${h - 5} ${y(0.49)} Z`,
      `M ${-h + 6.4} ${y(0.635)} L ${-h + 9.4} ${y(0.75)} L ${h - 9.4} ${y(0.75)} L ${h - 6.4} ${y(0.635)} Z`,
      `M -4 ${y(0.78)} L 0 ${y(0.93)} L 4 ${y(0.78)} Z`,
    ];
    const contour = `M -5 26 L -5 ${y(0.34)} C -5 ${y(0.4)} ${-h} ${y(0.42)} ${-h} ${y(0.5)} C ${-h} ${y(0.68)} -4 ${y(0.9)} 0 ${-L} C 4 ${y(0.9)} ${h} ${y(0.68)} ${h} ${y(0.5)} C ${h} ${y(0.42)} 5 ${y(0.4)} 5 ${y(0.34)} L 5 26 Z`;
    return (
      <g>
        <path d={`${contour} ${cellules.join(" ")}`} fillRule="evenodd" fill={fill} {...edge} />
        {lume && cellules.map((d) => <path key={d} d={d} fill={LUME_FILL} stroke={LUME_EDGE} strokeWidth="0.9" strokeLinejoin="round" />)}
      </g>
    );
  }

  if (shape === "crayon") {
    return (
      <g>
        <rect x={-width / 2} y={-length} width={width} height={length + 28} rx={width / 2} fill={fill} {...edge} />
        {lume ? (
          <rect
            x={-width / 2 + 5.5}
            y={-length + 10}
            width={width - 11}
            height={length - 44}
            rx={(width - 11) / 2}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="0.9"
          />
        ) : (
          <line x1="0" y1={-length + 12} x2="0" y2={-16} stroke={ramp.edge} strokeOpacity="0.45" strokeWidth="1" />
        )}
      </g>
    );
  }

  // Un jeu « Mercedes » ne porte le cercle que sur l'aiguille des heures ;
  // la minute reste un glaive. Deux cercles empilés seraient illisibles.
  if (shape === "mercedes" && role === "heure") {
    const ringY = -length * 0.66;
    const ringR = length * 0.17;
    return (
      <g>
        <path
          d={`M ${-width / 2} 28 L ${-width / 2.6} ${ringY + ringR * 0.4} L ${width / 2.6} ${ringY + ringR * 0.4} L ${width / 2} 28 Z`}
          fill={fill}
          {...edge}
        />
        {lume && (
          <path
            d={`M ${-width / 2 + 6} -12 L ${-width / 2.6 + 5} ${ringY + ringR + 4} L ${width / 2.6 - 5} ${ringY + ringR + 4} L ${width / 2 - 6} -12 Z`}
            fill={LUME_FILL}
            stroke={LUME_EDGE}
            strokeWidth="0.9"
          />
        )}
        <path
          d={`M ${-width / 4.4} ${ringY - ringR * 0.6} L 0 ${-length} L ${width / 4.4} ${ringY - ringR * 0.6} Z`}
          fill={fill}
          {...edge}
        />
        <circle cy={ringY} r={ringR + 3} fill={fill} {...edge} />
        <circle cy={ringY} r={ringR - 2} fill={lumeFill} stroke={lume ? LUME_EDGE : ramp.dark} strokeWidth="0.9" />
        {[90, 210, 330].map((a) => (
          <line
            key={a}
            x1="0"
            y1={ringY}
            x2={(ringR - 1) * Math.cos((a * Math.PI) / 180)}
            y2={ringY + (ringR - 1) * Math.sin((a * Math.PI) / 180)}
            stroke={ramp.mid}
            strokeWidth="4"
          />
        ))}
        {[90, 210, 330].map((a) => (
          <line
            key={`f${a}`}
            x1="0"
            y1={ringY}
            x2={(ringR - 1) * Math.cos((a * Math.PI) / 180)}
            y2={ringY + (ringR - 1) * Math.sin((a * Math.PI) / 180)}
            stroke={ramp.hi}
            strokeOpacity="0.7"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  }

  // Glaive : deux arêtes vives qui se rejoignent en pointe.
  const shoulder = -length * 0.24;
  return (
    <g>
      <path d={`M 0 30 L ${-width / 2} ${shoulder} L 0 ${-length} L ${width / 2} ${shoulder} Z`} fill={fill} {...edge} />
      {lume ? (
        <path
          d={`M 0 8 L ${-width / 2 + 7.5} ${shoulder} L 0 ${-length + 26} L ${width / 2 - 7.5} ${shoulder} Z`}
          fill={LUME_FILL}
          stroke={LUME_EDGE}
          strokeWidth="0.9"
        />
      ) : (
        <line x1="0" y1="26" x2="0" y2={-length + 4} stroke={ramp.edge} strokeOpacity="0.4" strokeWidth="0.9" />
      )}
    </g>
  );
}

function SecondHand({
  fill,
  shape,
  metal,
  lume,
  chrono = false,
  accent,
}: {
  fill: string;
  shape: HandShape;
  metal: MetalTone;
  lume: boolean;
  chrono?: boolean;
  accent?: string;
}) {
  const ramp = METALS[metal];

  // Chronographe : la grande aiguille centrale est celle du chrono. Longue,
  // fine comme un fil pour pointer l'échelle au cinquième de seconde, souvent
  // laquée d'une couleur vive ; son contrepoids est une petite palette.
  if (chrono) {
    const corps = accent ?? fill;
    const filet = accent ? shade(accent, 0.45) : ramp.edge;
    return (
      <g>
        <path d={`M -2.6 0 L -0.8 ${-SEC_LEN - 6} L 0.8 ${-SEC_LEN - 6} L 2.6 0 Z`} fill={corps} stroke={filet} strokeOpacity="0.7" strokeWidth="0.6" strokeLinejoin="round" />
        <path d="M -2.6 0 L -5 48 Q 0 58 5 48 L 2.6 0 Z" fill={corps} stroke={filet} strokeOpacity="0.7" strokeWidth="0.7" strokeLinejoin="round" />
        <circle r="9" fill={corps} stroke={filet} strokeOpacity="0.8" strokeWidth="0.9" />
      </g>
    );
  }

  // Habillée : une simple aiguille effilée, sans pastille — rien ne doit
  // distraire des deux dauphines.
  if (shape === "dauphine") {
    return (
      <g>
        <path d={`M -2.4 58 L -0.7 ${-SEC_LEN} L 0.7 ${-SEC_LEN} L 2.4 58 Z`} fill={fill} stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="0.6" strokeLinejoin="round" />
        <circle cy="58" r="6.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.9" />
      </g>
    );
  }

  // Plongée : la pastille lumineuse est portée tout au bout, là où elle balaie
  // la minuterie — elle prouve dans le noir que la montre tourne encore.
  if (shape === "fleche") {
    return (
      <g>
        <rect x="-2.2" y={-SEC_LEN} width="4.4" height={SEC_LEN + 62} rx="2.2" fill={fill} stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="0.6" />
        <circle cy={-SEC_LEN + 30} r="11.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1" />
        <circle cy={-SEC_LEN + 30} r="7.8" fill={lume ? LUME_FILL : ramp.light} stroke={lume ? LUME_EDGE : ramp.dark} strokeWidth="0.9" />
        {/* Contrepoids en palette. */}
        <path d="M -3 28 L -7.5 40 L -7.5 64 L 7.5 64 L 7.5 40 L 3 28 Z" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
    );
  }

  return (
    <g>
      <rect x="-2.2" y={-SEC_LEN} width="4.4" height={SEC_LEN + 66} rx="2.2" fill={fill} stroke={ramp.edge} strokeOpacity="0.6" strokeWidth="0.6" />
      <circle cy={-SEC_LEN + 54} r="12.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1" />
      <circle cy={-SEC_LEN + 54} r="8.5" fill={lume ? LUME_FILL : ramp.light} stroke={lume ? LUME_EDGE : ramp.dark} strokeWidth="0.9" />
      {/* Contrepoids. */}
      <rect x="-5.5" y="30" width="11" height="40" rx="5.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.9" />
    </g>
  );
}

/** Aiguille GMT : une flèche, pour ne pas la confondre avec l'heure locale. */
function GmtHand({ fill, metal, lume, laquee = false }: { fill: string; metal: MetalTone; lume: boolean; laquee?: boolean }) {
  // Laquée, l'aiguille 24 h ne se confond plus avec rien : son filet prend la teinte de la laque.
  const ramp = laquee ? { ...METALS[metal], edge: shade(fill, 0.5) } : METALS[metal];
  return (
    <g>
      <rect x="-3.5" y={-GMT_LEN + 44} width="7" height={GMT_LEN + 4} rx="3.5" fill={fill} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.8" />
      <path
        d={`M 0 ${-GMT_LEN} L -21 ${-GMT_LEN + 50} L 21 ${-GMT_LEN + 50} Z`}
        fill={fill}
        stroke={ramp.edge}
        strokeOpacity="0.85"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d={`M 0 ${-GMT_LEN + 15} L -12 ${-GMT_LEN + 44} L 12 ${-GMT_LEN + 44} Z`}
        fill={lume ? LUME_FILL : ramp.light}
        stroke={lume ? LUME_EDGE : ramp.dark}
        strokeWidth="0.9"
      />
    </g>
  );
}
