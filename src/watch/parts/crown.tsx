import { INK, METALS } from "../palette";
import { C, R_CASE, n } from "../geometry";
import type { CrownStyle, MetalTone } from "../types";

const X0 = C + R_CASE - 14;
const X1 = C + R_CASE + 44;
const R = 40;

/**
 * Place une pièce de flanc à son heure. La couronne est dessinée à 3 h puis
 * tournée de 30° par heure ; de dos, la montre est retournée autour de l'axe
 * 12 h – 6 h : le miroir horizontal met la couronne de 3 h à gauche, celle de
 * 4 h en bas à gauche, sans inverser le haut et le bas de son éclairage.
 */
function flankTransform(at: 2 | 3 | 4, mirror: boolean): string | undefined {
  const parts: string[] = [];
  if (mirror) parts.push(`translate(${2 * C} 0) scale(-1 1)`);
  if (at !== 3) parts.push(`rotate(${(at - 3) * 30} ${C} ${C})`);
  return parts.length ? parts.join(" ") : undefined;
}

/**
 * Couronne, dessinée avant le boîtier : son pied disparaît sous le flanc. C'est
 * un cylindre couché : l'ombrage et l'écartement des cannelures suivent sa
 * courbure, serrés vers les bords, larges au sommet.
 */
export function Crown({
  uid,
  style,
  metal,
  at = 3,
  offset = 0,
  size = 1,
  mirror = false,
}: {
  uid: string;
  style: CrownStyle;
  metal: MetalTone;
  /** Position horaire. 4 h : la couronne déportée des plongeuses japonaises. */
  at?: 2 | 3 | 4;
  /** Recul ou avancée le long du rayon : le flanc d'un coussin est plus loin du centre. */
  offset?: number;
  /** Une seconde couronne (réhaut tournant) est plus menue que celle de remontage. */
  size?: number;
  /** Vue de dos. */
  mirror?: boolean;
}) {
  const ramp = METALS[metal];
  const grooves = [-72, -56, -41, -27, -13, 0, 13, 27, 41, 56, 72];
  if (style === "oignon") {
    return <OnionCrown uid={uid} metal={metal} at={at} offset={offset} size={size} mirror={mirror} />;
  }
  const r = R * size;
  const x0 = X0 + offset;
  const x1 = x0 + (X1 - X0) * size;
  return (
    <g data-layer="couronne" transform={flankTransform(at, mirror)}>
      {/* Tube. */}
      <rect x={x0 - 16} y={C - r * 0.6} width="26" height={r * 1.2} fill={`url(#${uid}-metal-${metal})`} />
      <rect x={x0 - 16} y={C - r * 0.6} width="26" height={r * 1.2} fill={INK} fillOpacity="0.35" />
      {/* Corps, légèrement conique. */}
      <path
        d={`M ${x0} ${C - r} L ${x1 - 5} ${C - r + 5} Q ${x1} ${C - r + 6} ${x1} ${C - r + 11} L ${x1} ${C + r - 11} Q ${x1} ${C + r - 6} ${x1 - 5} ${C + r - 5} L ${x0} ${C + r} Z`}
        fill={`url(#${uid}-metal-${metal})`}
        stroke={ramp.edge}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Cannelures de préhension : une gorge sombre, son arête claire. */}
      {grooves.map((deg) => {
        const y = n(C + (r - 3) * Math.sin((deg * Math.PI) / 180));
        const lit = Math.cos(((deg + 38) * Math.PI) / 180);
        return (
          <g key={deg}>
            <line x1={x0 + 3} y1={y} x2={x1 - 9} y2={y} stroke={INK} strokeOpacity="0.55" strokeWidth={n(2.4 * size)} />
            <line
              x1={x0 + 3}
              y1={y + 1.8}
              x2={x1 - 9}
              y2={y + 1.8}
              stroke={ramp.hi}
              strokeOpacity={n(Math.max(0.08, lit * 0.7))}
              strokeWidth="1"
            />
          </g>
        );
      })}
      {/* Tête de couronne : une face polie, vue par la tranche. */}
      <rect x={x1 - 8} y={C - r + 9} width="8" height={r * 2 - 18} rx="3" fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="0.8" />
      {style === "signee" && (
        <line x1={x1 - 4} y1={C - 9} x2={x1 - 4} y2={C + 9} stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {/* La carrure porte son ombre sur le pied de couronne. */}
      <rect x={x0 - 2} y={C - r} width="12" height={r * 2} fill={INK} fillOpacity="0.28" />
    </g>
  );
}

/**
 * Épaulements de couronne : deux bossages venus de matière avec le flanc, qui
 * encadrent la couronne et encaissent les chocs à sa place. Dessinés après le
 * boîtier — et après la couronne, qu'ils enserrent — ils débordent franchement
 * de la carrure : c'est cette silhouette asymétrique qui signe une plongeuse.
 */
export function CrownGuards({
  uid,
  metal,
  at = 3,
  mirror = false,
}: {
  uid: string;
  metal: MetalTone;
  at?: 3 | 4;
  mirror?: boolean;
}) {
  const ramp = METALS[metal];
  const xPied = C + R_CASE - 30;
  const xNez = C + R_CASE + 27;
  const bossage = (sy: 1 | -1) => {
    const Y = (d: number) => C + sy * d;
    return `M ${xPied - 34} ${Y(92)} C ${xPied + 12} ${Y(88)} ${xNez - 6} ${Y(80)} ${xNez} ${Y(60)} Q ${xNez + 4} ${Y(44)} ${xNez - 4} ${Y(34)} L ${xPied + 22} ${Y(30)} L ${xPied - 12} ${Y(30)} Z`;
  };
  return (
    <g data-layer="protege-couronne" transform={flankTransform(at, mirror)}>
      {([-1, 1] as const).map((sy) => (
        <g key={sy}>
          <path d={bossage(sy)} fill={`url(#${uid}-case)`} stroke={ramp.edge} strokeWidth="1.4" strokeLinejoin="round" />
          {/* Le bossage du bas est sous la lumière : il s'assombrit. */}
          {sy === 1 && <path d={bossage(sy)} fill={INK} fillOpacity="0.22" />}
          {/* Chanfrein poli sur l'arête extérieure. */}
          <path
            d={`M ${xPied + 4} ${C + sy * 86} C ${xPied + 30} ${C + sy * 82} ${xNez - 8} ${C + sy * 76} ${xNez - 3} ${C + sy * 58}`}
            fill="none"
            stroke={ramp.hi}
            strokeOpacity={sy === -1 ? 0.9 : 0.5}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Joue intérieure, dans l'ombre de la couronne. */}
          <line x1={xPied + 2} y1={C + sy * 31.5} x2={xNez - 6} y2={C + sy * 35} stroke={INK} strokeOpacity="0.45" strokeWidth="2.2" />
        </g>
      ))}
    </g>
  );
}

/**
 * Couronne oignon : la couronne des habillées. Plus grosse que la carrure ne le
 * demande, bombée comme un bulbe, elle se saisit du bout des doigts sans ôter la
 * montre. Ses cannelures suivent le galbe : larges au ventre, elles se resserrent
 * vers la tête, coiffée d'un petit cabochon poli.
 */
function OnionCrown({
  uid,
  metal,
  at,
  offset,
  size,
  mirror,
}: {
  uid: string;
  metal: MetalTone;
  at: 2 | 3 | 4;
  offset: number;
  size: number;
  mirror: boolean;
}) {
  const ramp = METALS[metal];
  const r = 47 * size;
  const x0 = X0 + offset + 6;
  const x1 = x0 + 62 * size;
  const ventre = x0 + 26 * size;
  const bulbe = `M ${x0} ${C - r * 0.62} C ${x0 + 6} ${C - r * 1.02} ${ventre + 8} ${C - r * 1.06} ${ventre + 14} ${C - r * 0.9} C ${x1 - 8} ${C - r * 0.62} ${x1} ${C - r * 0.4} ${x1} ${C - r * 0.26} L ${x1} ${C + r * 0.26} C ${x1} ${C + r * 0.4} ${x1 - 8} ${C + r * 0.62} ${ventre + 14} ${C + r * 0.9} C ${ventre + 8} ${C + r * 1.06} ${x0 + 6} ${C + r * 1.02} ${x0} ${C + r * 0.62} Z`;
  const clip = `${uid}-clip-oignon-${at}${mirror ? "-dos" : ""}`;
  return (
    <g data-layer="couronne" transform={flankTransform(at, mirror)}>
      <clipPath id={clip}>
        <path d={bulbe} />
      </clipPath>
      {/* Tube, puis le col étroit qui porte le bulbe. */}
      <rect x={x0 - 22} y={C - r * 0.4} width="30" height={r * 0.8} fill={`url(#${uid}-metal-${metal})`} />
      <rect x={x0 - 22} y={C - r * 0.4} width="30" height={r * 0.8} fill={INK} fillOpacity="0.4" />
      <path d={bulbe} fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeWidth="1.4" strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        {/* Cannelures galbées : chaque gorge est un arc qui converge vers la tête. */}
        {[-78, -62, -47, -33, -20, -7, 7, 20, 33, 47, 62, 78].map((deg) => {
          const s = Math.sin((deg * Math.PI) / 180);
          const y0 = n(C + r * 1.02 * s);
          const y1 = n(C + r * 0.3 * s);
          const lit = Math.cos(((deg + 38) * Math.PI) / 180);
          const d = `M ${x0 + 2} ${n(C + r * 0.66 * s)} Q ${ventre} ${y0} ${x1 - 3} ${y1}`;
          return (
            <g key={deg}>
              <path d={d} fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth={n(2.6 * size)} />
              <path d={d} fill="none" stroke={ramp.hi} strokeOpacity={n(Math.max(0.08, lit * 0.75))} strokeWidth="1" transform="translate(0 1.9)" />
            </g>
          );
        })}
        {/* Le bulbe se dérobe vers la carrure : son pied est dans l'ombre. */}
        <rect x={x0 - 2} y={C - r * 1.1} width="14" height={r * 2.2} fill={INK} fillOpacity="0.3" />
      </g>
      {/* Cabochon poli, en bout. */}
      <rect x={x1 - 3} y={n(C - r * 0.22)} width="7" height={n(r * 0.44)} rx="3.5" fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="0.9" />
    </g>
  );
}
