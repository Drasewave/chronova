import { INK, METALS, rampAt, type MetalRamp } from "../palette";
import { C, R_BEZEL_OUT, R_CASE, R_DIAL, R_LUG_TIP, n } from "../geometry";
import { Ring, type Sheen } from "../parts/conic";
import { lugBevel, lugPath, lugRidge, LUG_INNER } from "../parts/case";
import { CushionBody, D_TIP, FLANK, X_TIP } from "../parts/cushion";
import { FINISH_SHEEN } from "../parts/defs";
import type { WatchRender } from "../types";
import { R_FOND, Z, bandPath, bez2, bez3, flankNormal, flat, lugTilt, lum3, pts, ribbon, rimPoint, rimSegment, type Pose } from "./geometry3d";

/**
 * Le boîtier en volume : des bagues empilées (fond, carrure, lunette), chacune
 * un cylindre dont on voit la face qui tourne vers nous ; le plat de carrure et
 * le dessous de carrure comme disques projetés ; les cornes, prismes qui
 * plongent vers le poignet ; le coussin, galet extrudé.
 */

interface Props {
  uid: string;
  render: WatchRender;
  p: Pose;
  detail: "full" | "compact";
}

/** Dessus de lunette selon la lunette : une lunette à insert est plus haute. */
export function bezelTop(render: WatchRender): number {
  const insert = render.bezelStyle === "plongee" || render.bezelStyle === "gmt" || render.bezelStyle === "tachymetre";
  return insert ? Z.lunetteInsert : Z.lunette;
}

export function fondBottom(render: WatchRender): number {
  return render.caseback === "plein" ? Z.fondBas : Z.fondBasSaphir;
}

/* ───────────────────────────────── Bagues ────────────────────────────────── */

/** Fond vissé : une bague plus étroite que la carrure, polie, qui s'assombrit vers le bas. */
export function FondBand({ uid, render, p }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const poli = render.caseFinish === "poli" ? `${uid}-pj-flanc` : `${uid}-pj-flanc-poli`;
  const d = bandPath(p, R_FOND, Z.fond, R_FOND, fondBottom(render));
  return (
    <g data-layer="fond-flanc">
      <path d={d} fill={`url(#${poli})`} />
      <path d={d} fill={`url(#${uid}-pj-dessous)`} opacity="0.4" />
      <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  );
}

/** Carrure : le flanc dans sa finition, chanfreins polis en haut et en bas. */
export function CarrureBand({ uid, render, p, detail }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const d = bandPath(p, R_CASE, Z.carrure, R_CASE, Z.fond);
  const grain = render.caseFinish === "brosse" && detail === "full" ? `url(#${uid}-pj-stries)` : render.caseFinish === "microbille" ? `url(#${uid}-beaded)` : null;
  const poli = render.caseFinish === "poli" ? `${uid}-pj-flanc` : `${uid}-pj-flanc-poli`;
  return (
    <g data-layer="carrure-flanc">
      <path d={d} fill={`url(#${uid}-pj-flanc)`} />
      {grain && <path d={d} fill={grain} />}
      {/* Chanfreins polis, en haut et en bas : un filet d'éclat le long de l'arête. */}
      <path d={bandPath(p, R_CASE, Z.carrure, R_CASE, Z.carrure - 4)} fill={`url(#${poli})`} opacity={render.caseFinish === "microbille" ? 0.45 : 0.95} />
      <path d={bandPath(p, R_CASE, Z.fond + 5, R_CASE, Z.fond)} fill={`url(#${poli})`} opacity="0.9" />
      <path d={bandPath(p, R_CASE, Z.fond + 5, R_CASE, Z.fond)} fill={INK} fillOpacity="0.3" />
      <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Lunette, par la tranche : un anneau extrudé. Lisse, c'est un tore aplati ;
 * cannelée, chaque dent est un prisme dont on voit les deux facettes ; à
 * insert, la pente de l'insert coiffe un crantage « pièce de monnaie » ;
 * tachymètre, la pente puis un jonc poli.
 */
export function BezelBand({ uid, render, p, detail }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const style = render.bezelStyle;
  const top = bezelTop(render);
  const full = detail === "full";
  const poli = render.caseFinish === "poli" ? `${uid}-pj-flanc` : `${uid}-pj-flanc-poli`;
  const edge = <path d={bandPath(p, R_BEZEL_OUT, top, R_BEZEL_OUT, Z.carrure)} fill="none" stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1.2" strokeLinejoin="round" />;
  // Filet d'éclat le long d'une arête : un arc du pourtour, du haut vers le milieu du flanc visible.
  const az = (phi: number) => (p.side > 0 ? phi : Math.PI - phi);
  const highlight = (z: number, opacity: number) => (
    <path d={rimSegment(p, R_BEZEL_OUT, z, az(-1.3), az(0.15))} fill="none" stroke={ramp.hi} strokeOpacity={opacity} strokeWidth="1.3" strokeLinecap="round" />
  );

  if (style === "plongee" || style === "gmt" || style === "tachymetre") {
    const crantage = style !== "tachymetre";
    const zInsert = Z.crantage;
    return (
      <g data-layer="lunette-flanc">
        {/* Pente de l'insert : sa couleur se voit sur la tranche. */}
        <path d={bandPath(p, R_BEZEL_OUT - 6, top, R_BEZEL_OUT, zInsert)} fill={`url(#${uid}-pj-flanc-insert)`} />
        <path d={bandPath(p, R_BEZEL_OUT, zInsert, R_BEZEL_OUT, Z.carrure)} fill={`url(#${poli})`} />
        {crantage &&
          full &&
          Array.from({ length: 30 }, (_, i) => {
            // Soixante dents de face, trente sur la moitié qui nous regarde : les
            // gorges se resserrent vers les bords, comme sur une pièce de monnaie.
            const phi = ((-87 + i * 6) * Math.PI) / 180;
            const az = p.side > 0 ? phi : Math.PI - phi;
            const [x0, y0] = rimPoint(p, R_BEZEL_OUT, zInsert - 1.5, az);
            const [x1] = rimPoint(p, R_BEZEL_OUT, Z.carrure + 1.5, az);
            const w = 4.6 * Math.hypot(Math.sin(az) * p.c, Math.cos(az));
            return <line key={i} x1={n(x0)} y1={n(y0)} x2={n(x1)} y2={n(y0)} stroke={INK} strokeOpacity="0.55" strokeWidth={n(Math.max(0.8, w))} />;
          })}
        {highlight(zInsert, 0.8)}
        {edge}
      </g>
    );
  }

  if (style === "cannelee") {
    const teeth = full ? 72 : 24;
    const w = (2 * Math.PI) / teeth;
    const [floor, span] = full ? [0.3, 0.62] : [0.44, 0.4];
    return (
      <g data-layer="lunette-flanc">
        <path d={bandPath(p, R_BEZEL_OUT, top, R_BEZEL_OUT, Z.carrure)} fill={`url(#${poli})`} />
        {Array.from({ length: teeth }, (_, i) => {
          const a = i * w;
          // Seules les dents du côté qui nous regarde.
          if (Math.cos(a) * p.side <= 0.02) return null;
          const facet = (a0: number, a1: number, lean: number, key: string) => {
            const [nx, ny, nz] = flankNormal(p, (a0 + a1) / 2 + lean);
            if (nz <= 0) return null;
            const [t0x, t0y] = rimPoint(p, R_BEZEL_OUT, top - 1, a0);
            const [t1x, t1y] = rimPoint(p, R_BEZEL_OUT, top - 1, a1);
            const [b1x] = rimPoint(p, R_BEZEL_OUT, Z.carrure + 1, a1);
            const [b0x] = rimPoint(p, R_BEZEL_OUT, Z.carrure + 1, a0);
            return <path key={key} d={`M ${n(t0x)} ${n(t0y)} L ${n(t1x)} ${n(t1y)} L ${n(b1x)} ${n(t1y)} L ${n(b0x)} ${n(t0y)} Z`} fill={rampAt(ramp, floor + span * lum3(nx, ny, nz, "poli"))} />;
          };
          return [facet(a - w / 2, a, -0.75, `${i}a`), facet(a, a + w / 2, 0.75, `${i}b`)];
        })}
        {edge}
      </g>
    );
  }

  // Lisse : un tore aplati, dans la finition du boîtier (miroir s'il est poli).
  const d = bandPath(p, R_BEZEL_OUT, top, R_BEZEL_OUT, Z.carrure);
  return (
    <g data-layer="lunette-flanc">
      <path d={d} fill={`url(#${render.caseFinish === "poli" ? poli : `${uid}-pj-flanc`})`} />
      {render.caseFinish === "brosse" && full && <path d={d} fill={`url(#${uid}-pj-stries)`} />}
      {render.caseFinish === "microbille" && <path d={d} fill={`url(#${uid}-beaded)`} />}
      <path d={d} fill={`url(#${uid}-pj-dessous)`} opacity="0.5" />
      {highlight(top - 2, render.caseFinish === "microbille" ? 0.25 : 0.8)}
      {edge}
    </g>
  );
}

/** Plat de carrure, vu de face : seule la couronne polie qui dépasse de la lunette se voit. */
export function Plat({ uid, render, p, detail }: Props) {
  const ramp = METALS[render.caseMetal];
  return (
    <g data-layer="boitier" transform={flat(p, Z.carrure)}>
      <circle cx={C} cy={C} r={R_CASE - 1} fill={ramp.mid} />
      <Ring id={`${uid}-pj-clip-carrure`} disk={`${uid}-conic-case`} rOut={R_CASE} rIn={R_BEZEL_OUT - 8} />
      {detail === "full" && <Ring id={`${uid}-pj-clip-carrure-chanfrein`} disk={`${uid}-conic-poli`} rOut={R_CASE} rIn={R_CASE - 3.5} opacity={render.caseFinish === "microbille" ? 0.45 : 0.95} />}
      {detail === "full" && <circle cx={C + 2} cy={C + 3} r={R_BEZEL_OUT + 1} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="4" />}
      <circle cx={C} cy={C} r={R_CASE} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.6" />
    </g>
  );
}

/** Dessous de carrure, vu de dos : même finition que les flancs, chanfrein poli au bord. */
export function Underside({ uid, render, p, detail }: Props) {
  const ramp = METALS[render.caseMetal];
  return (
    <g data-layer="dessous" transform={flat(p, Z.fond)}>
      <circle cx={C} cy={C} r={R_CASE - 1} fill={ramp.mid} />
      <Ring id={`${uid}-pj-clip-dessous`} disk={`${uid}-conic-case`} rOut={R_CASE} rIn={R_FOND - 2} />
      {render.caseFinish === "microbille" && <circle cx={C} cy={C} r={R_CASE} fill={`url(#${uid}-beaded)`} />}
      {detail === "full" && <Ring id={`${uid}-pj-clip-dessous-chanfrein`} disk={`${uid}-conic-poli`} rOut={R_CASE} rIn={R_CASE - 3.5} opacity={render.caseFinish === "microbille" ? 0.45 : 0.95} />}
      {detail === "full" && <circle cx={C + 2} cy={C + 3} r={R_FOND + 1} fill="none" stroke={INK} strokeOpacity="0.42" strokeWidth="4" />}
      <circle cx={C} cy={C} r={R_CASE} fill="none" stroke={ramp.edge} strokeOpacity="0.9" strokeWidth="1.6" />
    </g>
  );
}

/**
 * Paroi intérieure de la lunette, entre le dessus de lunette et le cadran, du
 * côté qui fuit : on regarde dans la cuvette, et cette paroi cache le bord du
 * cadran que la parallaxe découvrirait sinon.
 */
export function InnerWall({ uid, render, p, k }: Props & { k: number }) {
  if (p.s === 0) return null;
  const rIn = (R_DIAL + 3) * k;
  return <path data-layer="rehaut-paroi" d={bandPath(p, rIn, bezelTop(render), R_DIAL * k, Z.cadran, p.side > 0 ? -1 : 1)} fill={`url(#${uid}-pj-paroi)`} />;
}

/* ───────────────────────────────── Cornes ────────────────────────────────── */

/**
 * Cornes. Leur dessus reprend le dessin de face (`lugPath`), en deux morceaux :
 * l'épaule, dans le plan de la carrure, et la pointe, qui plonge (cisaillée,
 * `lugTilt`). Leur flanc extérieur est un ruban : l'arête du dessus balayée
 * vers le bas de l'épaisseur de la corne. Seul le flanc des cornes qui nous
 * regardent se voit ; celles d'en face passent derrière la carrure.
 * `which` choisit les cornes du côté qui nous regarde, ou celles d'en face.
 */
export function Lugs3D({ uid, render, p, detail, which }: Props & { which: "near" | "far" }) {
  const ramp = METALS[render.caseMetal];
  const finish = render.caseFinish;
  const full = detail === "full";
  const finishPattern = finish === "brosse" ? `url(#${uid}-brushed)` : finish === "microbille" ? `url(#${uid}-beaded)` : null;
  const matte = finish === "microbille";
  const zRoot = p.front ? Z.carrure : Z.carrure - Z.corneEpaisseur;
  // De dos les dessins ne sont pas retournés : la corne dessinée à droite est
  // celle de 9 h. Le flanc visible appartient à la corne dessinée du côté qui regarde vers nous.
  const drawnSide = (sx: 1 | -1): 1 | -1 => (p.c < 0 ? (-sx as 1 | -1) : sx);

  return (
    <g data-layer={`cornes-${which}`}>
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sy) => {
          const near = drawnSide(sx) === p.side;
          if ((which === "near") !== near) return null;
          const d = lugPath(sx, sy);
          const lit = sx === -1;
          const face = (tip: boolean) => (
            <>
              <path d={d} fill={`url(#${uid}-lugs)`} />
              {full && finishPattern && <path d={d} fill={finishPattern} />}
              <path d={d} fill={`url(#${uid}-lug-fall-${sy === -1 ? "haut" : "bas"})`} />
              {full && <path d={lugBevel(sx, sy)} fill={lit ? `url(#${uid}-lug-bevel)` : rampAt(ramp, matte ? 0.34 : 0.26)} opacity={matte ? 0.7 : 1} />}
              {full && tip && <path d={lugRidge(sx, sy)} fill="none" stroke={lit ? ramp.dark : ramp.hi} strokeOpacity={lit ? 0.5 : matte ? 0.35 : 0.8} strokeWidth="1.6" strokeLinecap="round" />}
              {full && tip && <line x1={C + sx * (LUG_INNER + 2)} y1={C + sy * 296} x2={C + sx * (LUG_INNER + 2)} y2={C + sy * (R_LUG_TIP - 12)} stroke={INK} strokeOpacity="0.4" strokeWidth="4" />}
              <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.6" strokeLinejoin="round" />
            </>
          );
          return (
            <g key={`${sx}${sy}`}>
              {near && p.s !== 0 && <LugFlank uid={uid} ramp={ramp} p={p} sx={sx} sy={sy} zRoot={zRoot} sheen={FINISH_SHEEN[finish]} full={full} />}
              {p.s === 0 ? (
                <g transform={flat(p, zRoot)}>{face(true)}</g>
              ) : !full ? (
                // En vignette, un seul morceau cisaillé : le coude n'y est pas visible.
                <g transform={lugTilt(p, sy, zRoot)}>{face(true)}</g>
              ) : (
                <>
                  <g clipPath={`url(#${uid}-pj-corne-epaule)`} transform={flat(p, zRoot)}>
                    {face(false)}
                  </g>
                  <g clipPath={`url(#${uid}-pj-corne-${sy === -1 ? "haut" : "bas"})`} transform={lugTilt(p, sy, zRoot)}>
                    {face(true)}
                  </g>
                </>
              )}
            </g>
          );
        }),
      )}
    </g>
  );
}

/** Ruban du flanc extérieur d'une corne : l'arête du dessus, et la même arête une épaisseur plus bas. */
function LugFlank({ uid, ramp, p, sx, sy, zRoot, sheen, full }: { uid: string; ramp: MetalRamp; p: Pose; sx: 1 | -1; sy: 1 | -1; zRoot: number; sheen: Sheen; full: boolean }) {
  // Arête extérieure, du bout de la pointe à la racine (voir `lugPath`) : un
  // quart d'arrondi puis la grande courbe tangente à la carrure.
  const quad: Array<[number, number]> = [
    [216, R_LUG_TIP - 3],
    [233, R_LUG_TIP - 6],
    [235, R_LUG_TIP - 26],
  ];
  const cubic: Array<[number, number]> = [
    [235, R_LUG_TIP - 26],
    [240, 350],
    [268, 250],
    [311, 165],
  ];
  const samples: Array<[number, number]> = [];
  for (let i = 0; i <= 3; i++) {
    const t = i / 3;
    const u = 1 - t;
    samples.push([u * u * quad[0]![0] + 2 * u * t * quad[1]![0] + t * t * quad[2]![0], u * u * quad[0]![1] + 2 * u * t * quad[1]![1] + t * t * quad[2]![1]]);
  }
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    const u = 1 - t;
    const b = (k: 0 | 1) => u * u * u * cubic[0]![k] + 3 * u * u * t * cubic[1]![k] + 3 * u * t * t * cubic[2]![k] + t * t * t * cubic[3]![k];
    samples.push([b(0), b(1)]);
  }
  const zAt = (dist: number) => (dist <= Z.corneCoude ? zRoot : zRoot - Z.cornePente * (dist - Z.corneCoude));
  // La corne s'amincit vers la pointe.
  const hAt = (dist: number) => Z.corneEpaisseur - 22 * Math.max(0, Math.min(1, (dist - Z.corneCoude) / (R_LUG_TIP - Z.corneCoude)));
  const top = samples.map(([x, dist]): [number, number] => [C + p.cf * sx * x - zAt(dist) * p.s, C + sy * dist]);
  const bottom = samples.map(([, dist], i): [number, number] => [top[i]![0] + hAt(dist) * p.s, top[i]![1]]);
  const ribbon = `${top.map(([x, y], i) => `${i ? "L" : "M"} ${n(x)} ${n(y)}`).join(" ")} ${bottom
    .slice()
    .reverse()
    .map(([x, y]) => `L ${n(x)} ${n(y)}`)
    .join(" ")} Z`;
  // Normale moyenne du flanc : vers l'extérieur, un peu vers la pointe.
  const nx = p.side * 0.95;
  const [lx, ly, lz] = [nx * p.c, sy * 0.3, nx * p.s];
  const lum = lum3(lx, ly, Math.abs(lz), sheen);
  return (
    <g data-layer="corne-flanc">
      <path d={ribbon} fill={rampAt(ramp, lum)} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1.1" strokeLinejoin="round" />
      {full && <path d={ribbon} fill={`url(#${uid}-pj-dessous)`} opacity="0.35" />}
      {full && <path d={pts(top)} fill="none" stroke={ramp.hi} strokeOpacity={sheen === "mat" ? 0.3 : 0.7} strokeWidth="1.4" />}
    </g>
  );
}

/* ───────────────────────────────── Coussin ───────────────────────────────── */

/**
 * Carrure coussin : un galet extrudé. Son flanc est le contour du côté qui
 * nous regarde — d'une pointe de corne à l'autre, par le flanc bombé de 3 h —
 * balayé de l'altitude de la carrure à celle du fond (`ribbon`).
 */
export function CushionFlank({ uid, render, p, detail }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const [f0, f1, f2, f3] = FLANK;
  const quad: [number, number][] = [
    [X_TIP, -D_TIP],
    [f0[0] - 8, -D_TIP],
    [f0[0], -f0[1]],
  ];
  const steps = detail === "full" ? 10 : 5;
  const contour: Array<[number, number]> = [];
  for (let i = 0; i <= 4; i++) contour.push(bez2(quad[0]!, quad[1]!, quad[2]!, i / 4));
  for (let i = 1; i <= steps; i++) contour.push(bez3([f0[0], -f0[1]], [f1[0], -f1[1]], [f2[0], -f2[1]], [f3[0], -f3[1]], i / steps));
  for (let i = 1; i <= steps; i++) contour.push(bez3([f3[0], f3[1]], [f2[0], f2[1]], [f1[0], f1[1]], [f0[0], f0[1]], i / steps));
  for (let i = 1; i <= 4; i++) contour.push(bez2([f0[0], f0[1]], [f0[0] - 8, D_TIP], [X_TIP, D_TIP], i / 4));
  const top = contour.map(([x, y]): [number, number] => [C + p.cf * p.side * x - Z.carrure * p.s, C + y]);
  const d = ribbon(top, (Z.carrure - Z.fond) * p.s);
  return (
    <g data-layer="coussin-flanc">
      <path d={d} fill={`url(#${uid}-pj-flanc)`} />
      {render.caseFinish === "brosse" && detail === "full" && <path d={d} fill={`url(#${uid}-pj-stries)`} />}
      {render.caseFinish === "microbille" && <path d={d} fill={`url(#${uid}-beaded)`} />}
      {/* Le galbe : le flanc se dérobe vers le bas, il y perd la lumière. */}
      <path d={d} fill={`url(#${uid}-pj-dessous)`} opacity="0.45" />
      <path d={pts(top)} fill="none" stroke={ramp.hi} strokeOpacity={render.caseFinish === "microbille" ? 0.35 : 0.8} strokeWidth="1.6" />
      <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

export function CushionTop({ uid, render, p }: Props) {
  return (
    <g data-layer="boitier" transform={flat(p, Z.carrure)}>
      <CushionBody uid={uid} metal={render.caseMetal} finish={render.caseFinish} prefix="pj-" />
      <circle cx="503" cy="505" r={R_BEZEL_OUT + 2} fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="7" />
    </g>
  );
}

export function CushionBottom({ uid, render, p }: Props) {
  return (
    <g data-layer="dessous" transform={flat(p, Z.fond)}>
      <CushionBody uid={uid} metal={render.caseMetal} finish={render.caseFinish} prefix="pj-dos-" />
    </g>
  );
}

