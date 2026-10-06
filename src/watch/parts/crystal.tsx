import { INK, PAPER } from "../palette";
import { C, R_DIAL } from "../geometry";
import type { Crystal as CrystalKind } from "../types";

/** Grossissement de la loupe de quantième : celui d'une lentille de plongeuse classique. */
export const CYCLOPS_SCALE = 2.5;

/**
 * Verre saphir. Un saphir traité ne voile pas le cadran : il ne se trahit que
 * par son chant, un liseré de lumière sur le pourtour, et par le reflet discret
 * d'une boîte à lumière. Le reflet est un simple dégradé translaté : aucune
 * image, aucun filtre coûteux, donc un suivi du pointeur à 60 images par
 * seconde. `sheen` va de -1 à 1 sur chaque axe ; 0,0 = montre de face.
 */
export function Crystal({
  uid,
  kind,
  antiGlare,
  sheen = { x: 0, y: 0 },
  cyclops = false,
}: {
  uid: string;
  kind: CrystalKind;
  antiGlare: boolean;
  sheen?: { x: number; y: number };
  /** Loupe de quantième collée sur le verre, au-dessus du guichet. */
  cyclops?: boolean;
  /**
   * Teinte du cadran. La loupe n'en a plus besoin — elle reprend le vrai guichet
   * par `<use>` — mais la prop reste acceptée : `watch-svg.tsx` la passe encore.
   */
  dialColor?: string;
}) {
  const circ = 2 * Math.PI * (R_DIAL - 3);
  const box = kind === "box";
  return (
    <g data-layer="verre" clipPath={`url(#${uid}-dial-clip)`}>
      {antiGlare && <circle cx={C} cy={C} r={R_DIAL} fill={`url(#${uid}-ar)`} />}

      {/* Le saphir bombé courbe la lumière sur tout le pourtour. */}
      {kind === "bombe" && (
        <circle cx={C} cy={C} r={R_DIAL - 9} fill="none" stroke={PAPER} strokeOpacity="0.1" strokeWidth="18" />
      )}

      {/* Verre box : ses flancs droits font prisme. Tout le pourtour du cadran
          se dédouble dans une bande claire, bordée d'un filet sombre là où le
          dessus bombé rejoint le flanc. */}
      {box && (
        <>
          <circle cx={C} cy={C} r={R_DIAL - 12} fill="none" stroke={PAPER} strokeOpacity="0.16" strokeWidth="24" />
          <circle cx={C} cy={C} r={R_DIAL - 25} fill="none" stroke={INK} strokeOpacity="0.22" strokeWidth="1.6" />
          <circle cx={C} cy={C} r={R_DIAL - 23} fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray={`${circ * 0.2} ${circ}`} transform={`rotate(-172 ${C} ${C})`} />
          <circle cx={C} cy={C} r={R_DIAL - 8} fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${circ * 0.11} ${circ}`} transform={`rotate(-158 ${C} ${C})`} />
        </>
      )}

      {/* Chant du verre : un arc vif face à la boîte principale, un arc faible
          à l'opposé. `rotate` place le début du tiret ; 0° = 3 h. */}
      <circle
        cx={C}
        cy={C}
        r={R_DIAL - 3}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={kind === "plat" ? 0.6 : 0.8}
        strokeWidth={kind === "plat" ? 2.4 : 4}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.17} ${circ}`}
        transform={`rotate(-167 ${C} ${C})`}
      />
      <circle
        cx={C}
        cy={C}
        r={R_DIAL - 3}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.28"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.09} ${circ}`}
        transform={`rotate(28 ${C} ${C})`}
      />

      {/* Point chaud fixe : le spot studio, discret, qui ne dépend pas du
          survol — c'est le reflet qui bouge par-dessus. */}
      <ellipse
        cx={C - 150}
        cy={C - 176}
        rx="70"
        ry="26"
        fill={`url(#${uid}-hotspot)`}
        opacity={antiGlare ? 0.22 : 0.4}
        transform={`rotate(-40 ${C - 150} ${C - 176})`}
      />

      {cyclops && <Cyclops uid={uid} />}

      <g
        data-sheen
        style={{
          // `--sheen-x/y` : posés par `InteractiveWatch` sur son conteneur, sans re-rendu React.
          transform: `translate(calc(var(--sheen-x, ${sheen.x}) * 120px), calc(var(--sheen-y, ${sheen.y}) * 120px))`,
          transformOrigin: "500px 500px",
          transition: "transform 120ms linear",
        }}
      >
        <rect
          x={C - 700}
          y={C - 330}
          width="1400"
          height="300"
          fill={`url(#${uid}-sheen)`}
          transform={`rotate(-32 ${C} ${C})`}
        />
      </g>
    </g>
  );
}


/**
 * Loupe de quantième : une lentille plan-convexe collée sur le verre, au droit
 * du guichet. Elle grossit deux fois et demie tout ce qui passe dessous — le
 * disque de quantième, et les aiguilles quand elles croisent le guichet. On ne
 * redessine rien : la lentille reprend par `<use>` le guichet (`dial.tsx`) puis
 * le groupe des aiguilles (`hands.tsx`), dans cet ordre, agrandis autour du
 * centre du guichet. Le `<use>` suit en direct le quantième que l'horloge
 * vivante écrit dans le guichet et les rotations qu'elle écrit sur les
 * aiguilles : la copie loupée bat avec l'original. Sans cela, une aiguille
 * disparaissait sous la loupe — elle « passait sous la date ».
 * La lentille se trahit par son contour, un reflet en croissant du côté de la
 * lumière et une ombre portée sur le cadran.
 */
function Cyclops({ uid }: { uid: string }) {
  // Centre du guichet de quantième seul (voir `DateWindow` : x = 500 + 232 − 68 / 2).
  const cx = C + 198;
  const cy = C;
  const w = 90;
  const h = 74;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const grossi = `translate(${cx} ${cy}) scale(${CYCLOPS_SCALE}) translate(${-cx} ${-cy})`;
  return (
    <g data-layer="loupe">
      <rect x={x + 4} y={y + 6} width={w} height={h} rx="17" fill={INK} fillOpacity="0.3" filter={`url(#${uid}-soft)`} />
      <clipPath id={`${uid}-clip-loupe`}>
        <rect x={x} y={y} width={w} height={h} rx="17" />
      </clipPath>
      <g clipPath={`url(#${uid}-clip-loupe)`}>
        {/* Sous la lentille, grossis : le guichet, puis les aiguilles par-dessus. */}
        <use href={`#${uid}-guichet`} transform={grossi} />
        <use href={`#${uid}-aiguilles`} transform={grossi} />
        <rect x={x} y={y} width={w} height={h} fill={PAPER} fillOpacity="0.1" />
        {/* Bord de lentille : la lumière s'y courbe, sombre en bas à droite. */}
        <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="15" fill="none" stroke={INK} strokeOpacity="0.28" strokeWidth="5" transform="translate(-2 -2)" />
        <path d={`M ${x + 7} ${y + h * 0.4} Q ${x + 7} ${y + 7} ${x + w * 0.5} ${y + 6}`} fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      </g>
      <rect x={x} y={y} width={w} height={h} rx="17" fill="none" stroke={INK} strokeOpacity="0.5" strokeWidth="1.2" />
      <rect x={x + 1.2} y={y + 1.2} width={w - 2.4} height={h - 2.4} rx="16" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" />
    </g>
  );
}
