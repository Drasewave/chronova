import { INK, PAPER, isLight } from "../palette";
import { C, R_DIAL } from "../geometry";
import type { Crystal as CrystalKind } from "../types";

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
  dialColor = "#1C1E21",
}: {
  uid: string;
  kind: CrystalKind;
  antiGlare: boolean;
  sheen?: { x: number; y: number };
  /** Loupe de quantième collée sur le verre, au-dessus du guichet. */
  cyclops?: boolean;
  /** Teinte du cadran : elle décide de celle du disque de quantième grossi. */
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

      {cyclops && <Cyclops uid={uid} light={isLight(dialColor)} />}

      <g
        data-sheen
        style={{
          transform: `translate(${sheen.x * 120}px, ${sheen.y * 120}px)`,
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
 * du guichet. Elle grossit le quantième deux fois et demie — on redessine donc
 * le chiffre agrandi dessous — et elle se trahit par son contour, un reflet en
 * croissant du côté de la lumière et une ombre portée sur le cadran.
 */
function Cyclops({ uid, light }: { uid: string; light: boolean }) {
  const x = C + 150;
  const y = C - 37;
  const w = 90;
  const h = 74;
  const disque = light ? "#F7F5EF" : "#15171A";
  const encre = light ? "#15171A" : "#F1F2F4";
  return (
    <g data-layer="loupe">
      <rect x={x + 4} y={y + 6} width={w} height={h} rx="17" fill={INK} fillOpacity="0.3" filter={`url(#${uid}-soft)`} />
      <clipPath id={`${uid}-clip-loupe`}>
        <rect x={x} y={y} width={w} height={h} rx="17" />
      </clipPath>
      <g clipPath={`url(#${uid}-clip-loupe)`}>
        {/* Le guichet, grossi : il déborde de la lentille. */}
        <rect x={x - 4} y={y + 4} width={w + 8} height={h - 8} fill={disque} />
        <text x={x + w / 2} y={y + h / 2 + 17} textAnchor="middle" fill={encre} style={{ fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: 48 }}>
          11
        </text>
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
