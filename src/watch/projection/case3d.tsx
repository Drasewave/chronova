import type { ReactNode } from "react";
import { INK, METALS, rampAt, type MetalRamp } from "../palette";
import { C, R_BEZEL_OUT, R_CASE, R_DIAL, R_LUG_TIP, n } from "../geometry";
import { Ring, type Sheen } from "../parts/conic";
import { lugBevel, lugPath, lugRidge, LUG_INNER } from "../parts/case";
import { CushionBody, D_TIP, FLANK, X_TIP } from "../parts/cushion";
import { FINISH_SHEEN } from "../parts/defs";
import type { WatchRender } from "../types";
import { LUG_PENTE_DESSOUS, R_FOND, Z, bandPath, bez2, bez3, flankNormal, flat, lugBottomZ, lugTilt, lugTopZ, lum3, pts, quad, rimPoint, rimSegment, type Pose } from "./geometry3d";

/**
 * Le boîtier en volume : des bagues empilées (fond, carrure, lunette), chacune
 * un cylindre dont on voit la face qui tourne vers nous ; le plat de carrure et
 * le dessous de carrure comme disques projetés ; les cornes, prismes aussi
 * épais que la carrure à leur racine, qui plongent vers le poignet en
 * s'amincissant ; le coussin, galet extrudé dont les pointes plongent de même.
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

/**
 * Profil du fond vissé, du plan de joint vers le centre : un rebord droit
 * (celui qu'on saisit à la clé), puis un galbe qui s'affaisse jusqu'au
 * médaillon central. Chaque étage est un tronc de cône ; le dessin de dos est
 * découpé en trois couronnes posées à l'altitude de leur étage
 * (`FOND_FACES`), pour que gravures et encoches suivent le bombé.
 */
export function fondProfil(render: WatchRender, detail: "full" | "compact" = "full"): Array<[r: number, z: number]> {
  const bas = fondBottom(render);
  // En vignette, le galbe se résume à un rebord et une pente.
  if (detail === "compact") {
    return [
      [R_FOND, Z.fond],
      [R_FOND, Z.fondRebord],
      [150, bas],
    ];
  }
  return [
    [R_FOND, Z.fond],
    [R_FOND, Z.fondRebord],
    [300, Z.fondRebord - 10],
    [240, Z.fondRebord - 26],
    [150, bas],
  ];
}

/** Couronnes du dessin de dos : rayon extérieur, rayon intérieur, altitude. */
export function fondFaces(render: WatchRender): Array<[rOut: number, rIn: number, z: number]> {
  const bas = fondBottom(render);
  return [
    [R_FOND + 1, 300, Z.fondRebord - 4],
    [300, 240, Z.fondRebord - 18],
    [240, 0, bas],
  ];
}

/* ───────────────────────────────── Bagues ────────────────────────────────── */

/** Fond vissé : rebord droit à encoches, puis le galbe qui s'assombrit vers le bas. */
export function FondBand({ uid, render, p, detail }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const poli = render.caseFinish === "poli" ? `${uid}-pj-flanc` : `${uid}-pj-flanc-poli`;
  const full = detail === "full";
  const profil = fondProfil(render, detail);
  const etages = profil.slice(1).map(([r, z], i) => {
    const [r0, z0] = profil[i]!;
    return bandPath(p, r0, z0, r, z);
  });
  return (
    <g data-layer="fond-flanc">
      {etages.map((d, i) => (
        <path key={i} d={d} fill={`url(#${poli})`} />
      ))}
      {/* Le galbe se dérobe vers le bas : chaque étage y perd un peu plus de lumière. */}
      {full &&
        etages.map((d, i) => (
          <path key={`o${i}`} d={d} fill={INK} fillOpacity={n(0.08 + 0.13 * i)} />
        ))}
      {/* Encoches de clé, vues par la tranche : six, sur le rebord, à leur azimut. */}
      {full &&
        Array.from({ length: 6 }, (_, i) => {
          const phi = ((i * 60 + 30 - 90) * Math.PI) / 180;
          const [, , nz] = flankNormal(p, phi);
          if (nz < 0.18) return null;
          const demi = (4.2 * Math.PI) / 180;
          const [x0, y0] = rimPoint(p, R_FOND, Z.fond - 2, phi - demi);
          const [x1, y1] = rimPoint(p, R_FOND, Z.fond - 2, phi + demi);
          const dz = (Z.fondRebord - Z.fond + 5) * p.s;
          return (
            <g key={i}>
              <path d={quad([x0, y0], [x1, y1], [x1 + dz, y1], [x0 + dz, y0])} fill={rampAt(ramp, 0.05)} />
              <line x1={n(x0 + dz)} y1={n(y0)} x2={n(x1 + dz)} y2={n(y1)} stroke={ramp.hi} strokeOpacity={n(0.6 * nz)} strokeWidth="1" />
            </g>
          );
        })}
      {/* Arête du rebord, et le contour. */}
      <path d={rimSegment(p, R_FOND, Z.fondRebord, p.side > 0 ? -1.3 : Math.PI + 1.3, p.side > 0 ? 1.3 : Math.PI - 1.3)} fill="none" stroke={ramp.hi} strokeOpacity="0.35" strokeWidth="1" />
      <path d={etages[0]!} fill="none" stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={bandPath(p, R_FOND, Z.fondRebord, 150, fondBottom(render))} fill="none" stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1" strokeLinejoin="round" />
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
 * insert, la pente de l'insert coiffe un crantage « pièce de monnaie » dont
 * chaque dent est un plat éclairé selon sa normale, séparé du suivant par une
 * gorge sombre ; tachymètre, la pente puis un jonc poli.
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
    const teeth = 60;
    const w = (2 * Math.PI) / teeth;
    const dz = (Z.carrure + 1 - (zInsert - 1)) * p.s;
    return (
      <g data-layer="lunette-flanc">
        {/* Pente de l'insert : sa couleur se voit sur la tranche. */}
        <path d={bandPath(p, R_BEZEL_OUT - 6, top, R_BEZEL_OUT, zInsert)} fill={`url(#${uid}-pj-flanc-insert)`} />
        <path d={bandPath(p, R_BEZEL_OUT, zInsert, R_BEZEL_OUT, Z.carrure)} fill={crantage && full ? rampAt(ramp, 0.1) : `url(#${poli})`} />
        {crantage &&
          full &&
          Array.from({ length: teeth }, (_, i) => {
            // Soixante dents de face, la moitié qui nous regarde ici : chaque plat
            // est un parallélogramme entre l'arête haute et l'arête basse du
            // crantage, sa teinte celle que sa normale renvoie du studio.
            const phi = -Math.PI / 2 + i * w;
            const [nx, ny, nz] = flankNormal(p, phi);
            if (nz <= 0.03) return null;
            const [x0, y0] = rimPoint(p, R_BEZEL_OUT, zInsert - 1, phi - w * 0.32);
            const [x1, y1] = rimPoint(p, R_BEZEL_OUT, zInsert - 1, phi + w * 0.32);
            return <path key={i} d={quad([x0, y0], [x1, y1], [x1 + dz, y1], [x0 + dz, y0])} fill={rampAt(ramp, 0.3 + 0.66 * lum3(nx, ny, nz, "poli"))} />;
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
 * cadran que la parallaxe découvrirait sinon. Du côté proche, c'est le dessus
 * de la lunette lui-même qui masque le cadran : le clip de l'ouverture
 * (`pj-ouverture`, à l'altitude du dessus) s'en charge, il n'y a rien à dessiner.
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
 * `lugTilt`). Leur flanc extérieur est un ruban : l'arête du dessus et l'arête
 * du dessous, qui plonge moins vite — la corne, aussi épaisse que la carrure à
 * la racine, s'amincit vers la pointe. Seul le flanc des cornes qui nous
 * regardent se voit ; celles d'en face passent derrière la carrure.
 * `which` choisit les cornes du côté qui nous regarde, ou celles d'en face.
 */
export function Lugs3D({ uid, render, p, detail, which }: Props & { which: "near" | "far" }) {
  const ramp = METALS[render.caseMetal];
  const finish = render.caseFinish;
  const full = detail === "full";
  const finishPattern = finish === "brosse" ? `url(#${uid}-brushed)` : finish === "microbille" ? `url(#${uid}-beaded)` : null;
  const matte = finish === "microbille";
  // De face on voit le dessus des cornes ; de dos leur dessous, qui plonge plus doucement.
  const zRoot = p.front ? Z.carrure : Z.fond;
  const pente = p.front ? Z.cornePente : LUG_PENTE_DESSOUS;
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
              {near && p.s !== 0 && <LugFlank uid={uid} ramp={ramp} p={p} sx={sx} sy={sy} sheen={FINISH_SHEEN[finish]} full={full} brushed={finish === "brosse"} />}
              {p.s === 0 ? (
                <g transform={flat(p, zRoot)}>{face(true)}</g>
              ) : !full ? (
                // En vignette, un seul morceau cisaillé : le coude n'y est pas visible.
                <g transform={lugTilt(p, sy, zRoot, pente)}>{face(true)}</g>
              ) : (
                <>
                  <g clipPath={`url(#${uid}-pj-corne-epaule)`} transform={flat(p, zRoot)}>
                    {face(false)}
                  </g>
                  <g clipPath={`url(#${uid}-pj-corne-${sy === -1 ? "haut" : "bas"})`} transform={lugTilt(p, sy, zRoot, pente)}>
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

/** Arête extérieure d'une corne, de la pointe à la racine (voir `lugPath`), échantillonnée : (écart latéral, distance au centre). */
function lugOuterEdge(): Array<[number, number]> {
  const samples: Array<[number, number]> = [];
  for (let i = 0; i <= 3; i++) samples.push(bez2([216, R_LUG_TIP - 3], [233, R_LUG_TIP - 6], [235, R_LUG_TIP - 26], i / 3));
  for (let i = 1; i <= 10; i++) samples.push(bez3([235, R_LUG_TIP - 26], [240, 350], [268, 250], [311, 165], i / 10));
  return samples;
}

/**
 * Ruban du flanc extérieur d'une corne : l'arête du dessus, et l'arête du
 * dessous. Sa teinte va de celle de la carrure à la racine (même normale, donc
 * aucune couture) à celle de la pointe, qui regarde franchement de côté.
 */
function LugFlank({ uid, ramp, p, sx, sy, sheen, full, brushed }: { uid: string; ramp: MetalRamp; p: Pose; sx: 1 | -1; sy: 1 | -1; sheen: Sheen; full: boolean; brushed: boolean }) {
  const samples = lugOuterEdge();
  const top = samples.map(([x, dist]): [number, number] => [C + p.cf * sx * x - lugTopZ(dist) * p.s, C + sy * dist]);
  const bottom = samples.map(([x, dist]): [number, number] => [C + p.cf * sx * x - lugBottomZ(dist) * p.s, C + sy * dist]);
  const ribbon = `${pts(top)} ${bottom
    .slice()
    .reverse()
    .map(([x, y]) => `L ${n(x)} ${n(y)}`)
    .join(" ")} Z`;
  // Normale à la racine : celle de la carrure à cet azimut ; à la pointe : vers l'extérieur, un peu vers le bout.
  const phiRoot = Math.atan2(sy * 165, 311);
  const [rx, ry, rz] = flankNormal(p, p.side > 0 ? phiRoot : Math.PI - phiRoot);
  const lumRoot = lum3(rx, ry, Math.abs(rz), sheen);
  const nxTip = p.side * 0.96;
  const lumTip = lum3(nxTip * p.c, sy * 0.28, Math.abs(nxTip * p.s), sheen);
  const grad = `${uid}-pj-corne-${sx === 1 ? "d" : "g"}${sy === 1 ? "b" : "h"}`;
  return (
    <g data-layer="corne-flanc">
      <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1={n(C + sy * 165)} x2="0" y2={n(C + sy * R_LUG_TIP)}>
        <stop offset="0" stopColor={rampAt(ramp, lumRoot)} />
        <stop offset="0.45" stopColor={rampAt(ramp, (lumRoot + lumTip) / 2)} />
        <stop offset="1" stopColor={rampAt(ramp, lumTip)} />
      </linearGradient>
      <path d={ribbon} fill={`url(#${grad})`} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1.1" strokeLinejoin="round" />
      {/* Brossage dans le sens de la corne, comme sur son dessus. */}
      {full && brushed && <path d={ribbon} fill={`url(#${uid}-brushed)`} />}
      {full && <path d={ribbon} fill={`url(#${uid}-pj-dessous)`} opacity="0.35" />}
      {/* Chanfrein poli continu, de la carrure à la pointe : l'arête du dessus. */}
      {full && <path d={pts(top)} fill="none" stroke={rampAt(ramp, sheen === "mat" ? 0.7 : 0.92)} strokeOpacity={sheen === "mat" ? 0.35 : 0.85} strokeWidth="2.2" strokeLinecap="round" />}
    </g>
  );
}

/* ───────────────────────────────── Coussin ───────────────────────────────── */

/**
 * Carrure coussin : un galet extrudé. Son flanc est le contour du côté qui
 * nous regarde — d'une pointe de corne à l'autre, par le flanc bombé de 3 h —
 * balayé de l'altitude de la carrure à celle du fond. Au-delà du coude, les
 * pointes plongent comme celles d'une carrure ronde : l'arête haute suit
 * `lugTopZ`, l'arête basse `lugBottomZ`.
 */
export function CushionFlank({ uid, render, p, detail }: Props) {
  if (p.s === 0) return null;
  const ramp = METALS[render.caseMetal];
  const [f0, f1, f2, f3] = FLANK;
  const quadTip: [number, number][] = [
    [X_TIP, -D_TIP],
    [f0[0] - 8, -D_TIP],
    [f0[0], -f0[1]],
  ];
  const steps = detail === "full" ? 10 : 5;
  const contour: Array<[number, number]> = [];
  for (let i = 0; i <= 4; i++) contour.push(bez2(quadTip[0]!, quadTip[1]!, quadTip[2]!, i / 4));
  for (let i = 1; i <= steps; i++) contour.push(bez3([f0[0], -f0[1]], [f1[0], -f1[1]], [f2[0], -f2[1]], [f3[0], -f3[1]], i / steps));
  for (let i = 1; i <= steps; i++) contour.push(bez3([f3[0], f3[1]], [f2[0], f2[1]], [f1[0], f1[1]], [f0[0], f0[1]], i / steps));
  for (let i = 1; i <= 4; i++) contour.push(bez2([f0[0], f0[1]], [f0[0] - 8, D_TIP], [X_TIP, D_TIP], i / 4));
  const top = contour.map(([x, y]): [number, number] => [C + p.cf * p.side * x - lugTopZ(Math.abs(y)) * p.s, C + y]);
  const bottom = contour.map(([x, y]): [number, number] => [C + p.cf * p.side * x - lugBottomZ(Math.abs(y)) * p.s, C + y]);
  const d = `${pts(top)} ${bottom
    .slice()
    .reverse()
    .map(([x, y]) => `L ${n(x)} ${n(y)}`)
    .join(" ")} Z`;
  return (
    <g data-layer="coussin-flanc">
      <path d={d} fill={`url(#${uid}-pj-flanc)`} />
      {render.caseFinish === "brosse" && detail === "full" && <path d={d} fill={`url(#${uid}-pj-stries)`} />}
      {render.caseFinish === "microbille" && <path d={d} fill={`url(#${uid}-beaded)`} />}
      {/* Le galbe : le flanc se dérobe vers le bas, il y perd la lumière. */}
      <path d={d} fill={`url(#${uid}-pj-dessous)`} opacity="0.45" />
      {/* Chanfrein poli, d'une pointe à l'autre. */}
      <path d={pts(top)} fill="none" stroke={rampAt(ramp, render.caseFinish === "microbille" ? 0.7 : 0.92)} strokeOpacity={render.caseFinish === "microbille" ? 0.35 : 0.85} strokeWidth="2.2" />
      <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" />
    </g>
  );
}

/**
 * Dessus (ou dessous) du coussin. Le dessin de face est défini une fois, puis
 * repris par `<use>` en trois morceaux : l'épaule à plat, et les deux bouts
 * cisaillés au-delà du coude, qui plongent vers le poignet.
 */
function CushionFace({ uid, render, p, zRoot, pente, prefix, children }: Props & { zRoot: number; pente: number; prefix: string; children?: ReactNode }) {
  const id = `${uid}-${prefix}corps`;
  return (
    <g data-layer={zRoot === Z.carrure ? "boitier" : "dessous"}>
      <defs>
        <g id={id}>
          <CushionBody uid={uid} metal={render.caseMetal} finish={render.caseFinish} prefix={prefix} />
        </g>
      </defs>
      {p.s === 0 ? (
        <use href={`#${id}`} transform={flat(p, zRoot)} />
      ) : (
        <>
          <use href={`#${id}`} clipPath={`url(#${uid}-pj-corne-epaule)`} transform={flat(p, zRoot)} />
          <use href={`#${id}`} clipPath={`url(#${uid}-pj-corne-haut)`} transform={lugTilt(p, -1, zRoot, pente)} />
          <use href={`#${id}`} clipPath={`url(#${uid}-pj-corne-bas)`} transform={lugTilt(p, 1, zRoot, pente)} />
        </>
      )}
      {children}
    </g>
  );
}

export function CushionTop(props: Props) {
  const { p } = props;
  return (
    <CushionFace {...props} zRoot={Z.carrure} pente={Z.cornePente} prefix="pj-">
      <circle cx="503" cy="505" r={R_BEZEL_OUT + 2} fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="7" transform={flat(p, Z.carrure)} />
    </CushionFace>
  );
}

export function CushionBottom(props: Props) {
  return <CushionFace {...props} zRoot={Z.fond} pente={LUG_PENTE_DESSOUS} prefix="pj-dos-" />;
}
