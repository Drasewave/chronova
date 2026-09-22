import { INK, METALS, PAPER, mix, rampAt, shade, tint } from "../palette";
import { C, R_LUG_TIP as LUG_TIP, n } from "../geometry";
import { Strap } from "../parts/strap";
import type { MetalTone, StrapKind } from "../types";
import { Z, flat, lum3, px, type Pose } from "./geometry3d";

/**
 * Bracelet en volume. Le dessus reprend le dessin de face (`parts/strap.tsx`),
 * resserré et décalé comme tout plan posé à son altitude ; de dos c'est le
 * DESSOUS qu'on voit : même découpe, mais des maillons plats, un cuir à
 * doublure, sans galbe ni surpiqûre apparente (`Dessous`). S'y ajoute la
 * TRANCHE : chaque brin est un pavé d'épaisseur réelle, dont le flanc côté
 * observateur s'élargit en sin θ — à 90° on ne voit plus que lui, maillons
 * articulés à goupilles et arêtes bombées, cuir à doublure et tranche peinte,
 * caoutchouc à évents en creux, sangle fine du NATO sous ses passants.
 * Mêmes cotes longitudinales que le dessus : les maillons de la tranche sont
 * ceux du plat, vus par le côté.
 */

/* Cotes de `parts/strap.tsx`, reprises pour rester alignées avec le dessus. */
const HALF = 176;
const HALF_AT_EDGE = 164;
const D_EDGE = 660;
const D_UNDER_CASE = 284;
const D_LOOP = 366;
const D_BAR = 386;
const D_END_LINK = LUG_TIP + 8;
/** Passants d'un NATO : le fixe, contre la barrette, et le flottant. */
const D_PASSANTS = [D_BAR + 74, D_BAR + 150] as const;

/** Épaisseur du brin, en unités du dessin (17,6 par millimètre). */
export const STRAP_THICKNESS: Record<StrapKind, number> = {
  "acier-3-maillons": 53,
  "acier-jubile": 44,
  cuir: 62,
  "cuir-glace": 55,
  caoutchouc: 64,
  nato: 24,
};

function halfAt(d: number): number {
  if (d <= LUG_TIP) return HALF;
  return HALF + ((HALF_AT_EDGE - HALF) * (d - LUG_TIP)) / (D_EDGE - LUG_TIP);
}

interface Props {
  uid: string;
  kind: StrapKind;
  color: string;
  metal: MetalTone;
  detail: "full" | "compact";
  frame: number;
  p: Pose;
}

export function Strap3D(props: Props) {
  const { uid, kind, color, metal, detail, frame, p } = props;
  const t = STRAP_THICKNESS[kind];
  const zTop = Z.bracelet;
  const zFace = p.front ? zTop : zTop - t;
  const nato = kind === "nato";
  return (
    <g data-layer="bracelet-3d">
      <g transform={flat(p, zFace)}>
        <Strap uid={uid} kind={kind} color={color} metal={metal} detail={detail} frame={frame} />
        {!p.front && <Dessous {...props} />}
        {/* Passants d'acier du NATO, à cheval sur le ruban. */}
        {nato &&
          ([-1, 1] as const).map((dir) =>
            D_PASSANTS.map((d) => (
              <g key={`${dir}${d}`} mask={`url(#${uid}-strap-fade)`}>
                <rect x={C - HALF - 3} y={n(C + dir * d - 9)} width={HALF * 2 + 6} height="18" rx="3" fill={`url(#${uid}-metal-acier)`} stroke={METALS.acier.edge} strokeWidth="1" />
                <rect x={C - HALF - 3} y={n(C + dir * d + 3)} width={HALF * 2 + 6} height="6" fill={INK} fillOpacity="0.3" />
              </g>
            )),
          )}
      </g>
      {p.s !== 0 && (
        <g data-layer="bracelet-tranche" mask={`url(#${uid}-strap-fade)`}>
          <Tranche {...props} dir={-1} t={t} />
          <Tranche {...props} dir={1} t={t} />
        </g>
      )}
    </g>
  );
}

/**
 * Dessous du brin, vu de dos : par-dessus le dessin de face, un voile qui
 * aplanit les maillons (dessous brossés, sans galbe) ou montre la doublure
 * d'un cuir, sans grain ni surpiqûre. Le vide entre les maillons reste visible.
 */
function Dessous({ uid, kind, color, metal }: Props) {
  const steel = kind === "acier-3-maillons" || kind === "acier-jubile";
  const ramp = METALS[metal];
  const dStart = steel || kind === "nato" ? D_UNDER_CASE : D_LOOP;
  const fill = steel ? ramp.mid : kind === "nato" ? shade(color, 0.12) : shade(color, kind === "cuir" ? 0.42 : 0.35);
  return (
    <g data-layer="bracelet-dessous">
      {(["haut", "bas"] as const).map((half) => {
        const dir = half === "haut" ? -1 : 1;
        const y0 = Math.min(C + dir * dStart, C + dir * D_EDGE);
        return (
          <g key={half} clipPath={`url(#${uid}-strap-${half})`}>
            <rect x={C - HALF} y={n(y0)} width={HALF * 2} height={D_EDGE - dStart} fill={fill} fillOpacity={steel ? 0.55 : 0.9} />
            {steel && <rect x={C - HALF} y={n(y0)} width={HALF * 2} height={D_EDGE - dStart} fill={`url(#${uid}-strap-brush)`} />}
            {!steel && kind !== "nato" && (
              // Trait de collage de la doublure, en retrait du bord.
              <path d={`M ${C - HALF + 14} ${n(C + dir * (dStart + 8))} L ${C - HALF + 14} ${n(C + dir * D_EDGE)} M ${C + HALF - 14} ${n(C + dir * (dStart + 8))} L ${C + HALF - 14} ${n(C + dir * D_EDGE)}`} fill="none" stroke={shade(color, 0.6)} strokeOpacity="0.7" strokeWidth="1.2" />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Tranche d'un brin. `x0(d)` : arête du dessus, à la distance `d` du centre ;
 * `x1(d)` : la même arête, une épaisseur plus bas. Entre les deux, un ruban
 * de largeur `t·sin θ` qui suit l'affinement du brin.
 */
function Tranche({ uid, kind, color, metal, detail, p, dir, t }: Props & { dir: 1 | -1; t: number }) {
  const ramp = METALS[metal];
  const full = detail === "full";
  const steel = kind === "acier-3-maillons" || kind === "acier-jubile";
  const y = (d: number) => n(C + dir * d);
  const x0 = (d: number) => px(p, C + p.side * halfAt(d), Z.bracelet);
  const x1 = (d: number) => x0(d) + t * p.s;
  const quad = (d0: number, d1: number, inset0 = 0, inset1 = 0) => {
    const w = t * p.s;
    return `M ${n(x0(d0) + inset0 * w)} ${y(d0)} L ${n(x0(d1) + inset0 * w)} ${y(d1)} L ${n(x0(d1) + (1 - inset1) * w)} ${y(d1)} L ${n(x0(d0) + (1 - inset1) * w)} ${y(d0)} Z`;
  };
  // Normale de la tranche : horizontale, tournée du lacet.
  const lum = lum3(p.side * p.c, 0, Math.abs(p.s), steel ? "poli" : "mat");
  const dStart = steel || kind === "nato" ? D_UNDER_CASE : D_LOOP;
  const arete = (d0: number, d1: number, opacity: number, width = 1.4) => (
    <line x1={n(x0(d0) + 0.8)} y1={y(d0)} x2={n(x0(d1) + 0.8)} y2={y(d1)} stroke={PAPER} strokeOpacity={opacity} strokeWidth={width} />
  );
  // Arêtes bombées : la tranche prend la lumière vers le dessus, la perd vers le poignet.
  const galbe = (d0: number, d1: number) => <path d={quad(d0, d1)} fill={`url(#${uid}-pj-galbe)`} />;

  if (steel) {
    const jubile = kind === "acier-jubile";
    const pitch = jubile ? 58 : 80;
    const gap = jubile ? 3 : 4;
    const fill = rampAt(ramp, 0.22 + 0.72 * lum);
    const rows = Math.ceil((D_EDGE - D_END_LINK) / pitch) + 1;
    if (!full) {
      return (
        <g>
          <path d={quad(dStart, D_EDGE)} fill={fill} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1" />
          {arete(D_END_LINK, D_EDGE, 0.5)}
        </g>
      );
    }
    return (
      <g>
        {/* Les jours entre deux maillons : l'ombre de l'articulation. */}
        <path d={quad(dStart, D_EDGE, 0.06, 0.06)} fill={shade(ramp.dark, 0.55)} />
        {/* Pièce de bout, pleine. */}
        <path d={quad(D_UNDER_CASE, D_END_LINK)} fill={fill} stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="1.1" />
        {Array.from({ length: rows }, (_, row) => {
          const d0 = D_END_LINK + gap + row * pitch;
          const d1 = Math.min(D_EDGE + pitch, d0 + pitch - gap);
          const dm = (d0 + d1) / 2;
          return (
            <g key={row}>
              <path d={quad(d0, d1)} fill={fill} stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="1.1" strokeLinejoin="round" />
              {galbe(d0, d1)}
              {arete(d0 + 6, d1 - 6, 0.55 + 0.4 * lum, 1.5)}
              {/* Goupille de l'articulation, vue de bout. */}
              {!jubile && <circle cx={n(x0(dm) + t * p.s * 0.5)} cy={y(d0 + 9)} r={n(Math.min(2.6, 2.6 * Math.abs(p.s) + 0.4))} fill={INK} fillOpacity="0.5" />}
            </g>
          );
        })}
        {galbe(D_UNDER_CASE, D_END_LINK)}
      </g>
    );
  }

  if (kind === "cuir" || kind === "cuir-glace") {
    const glace = kind === "cuir-glace";
    const face = mix(shade(color, 0.45), tint(color, glace ? 0.2 : 0.12), lum);
    return (
      <g>
        {/* Tranche peinte : la teinte du cuir, un ton plus sombre, lissée. */}
        <path d={quad(dStart, D_EDGE)} fill={face} stroke={shade(color, 0.55)} strokeWidth="1.1" strokeLinejoin="round" />
        {/* Doublure, côté peau : plus sombre, séparée par le trait de collage. */}
        <path d={quad(dStart + 6, D_EDGE, 0.58, 0)} fill={shade(color, 0.5)} />
        {galbe(dStart, D_EDGE)}
        {full && (
          <line
            x1={n(x0(dStart + 34) + t * p.s * 0.26)}
            y1={y(dStart + 34)}
            x2={n(x0(D_EDGE) + t * p.s * 0.26)}
            y2={y(D_EDGE)}
            stroke={tint(color, glace ? 0.25 : 0.62)}
            strokeOpacity="0.85"
            strokeWidth={glace ? 1.2 : 1.8}
            strokeDasharray={glace ? "4 4" : "7 5"}
            strokeLinecap="round"
          />
        )}
        {arete(dStart + 8, D_EDGE, glace ? 0.35 + 0.4 * lum : 0.12 + 0.3 * lum, glace ? 1.8 : 1.3)}
      </g>
    );
  }

  if (kind === "caoutchouc") {
    const face = mix(shade(color, 0.4), tint(color, 0.1), lum);
    const dFirst = full ? D_LOOP + 140 : D_LOOP + 58;
    const pitch = full ? 36 : 54;
    const count = Math.ceil((D_EDGE - dFirst) / pitch);
    return (
      <g>
        <path d={quad(dStart, D_EDGE)} fill={face} stroke={shade(color, 0.5)} strokeWidth="1.1" strokeLinejoin="round" />
        {galbe(dStart, D_EDGE)}
        {/* Évents : les fentes du plat traversent la tranche en creux — un fond
            sombre, et la lèvre du bas qui accroche la lumière. */}
        {Array.from({ length: count }, (_, i) => {
          const d = dFirst + i * pitch;
          return (
            <g key={i}>
              <path d={quad(d, d + 13, 0, 0.45)} fill={shade(color, 0.55)} />
              <line x1={n(x0(d + 13))} y1={y(d + 13)} x2={n(x0(d + 13) + t * p.s * 0.55)} y2={y(d + 13)} stroke={tint(color, 0.3)} strokeOpacity="0.55" strokeWidth="1.2" />
            </g>
          );
        })}
        {arete(dStart + 8, D_EDGE, 0.1 + 0.3 * lum)}
      </g>
    );
  }

  // NATO : une sangle fine, à lisière thermosoudée, sous ses passants d'acier.
  const face = mix(shade(color, 0.4), tint(color, 0.1), lum);
  return (
    <g>
      <path d={quad(D_UNDER_CASE, D_EDGE)} fill={face} stroke={shade(color, 0.45)} strokeOpacity="0.8" strokeWidth="1" />
      {arete(D_UNDER_CASE + 20, D_EDGE, 0.1 + 0.25 * lum, 1)}
      {D_PASSANTS.map((d) => (
        <path key={d} d={quad(d - 9, d + 9, -0.12, -0.12)} fill={rampAt(METALS.acier, 0.3 + 0.6 * lum)} stroke={METALS.acier.edge} strokeOpacity="0.8" strokeWidth="1" />
      ))}
    </g>
  );
}
