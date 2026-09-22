import type { ReactNode } from "react";
import { INK, METALS, rampAt } from "../palette";
import { C, R_CASE, n } from "../geometry";
import type { CrownStyle, MetalTone } from "../types";
import { bez2, bez3, cylBodyPath, depth, flatSigned, hull, lum3, projectCyl, pts, px, type Cyl, type Pose, Z } from "./geometry3d";

/**
 * Pièces rapportées sur le flanc : couronnes, poussoirs, protège-couronne.
 * Ce sont des cylindres couchés sur leur rayon ; ils tournent avec le boîtier
 * et passent devant ou derrière lui selon leur profondeur (`depth`), jamais par
 * un simple `opacity`.
 */

interface Base {
  uid: string;
  p: Pose;
  detail: "full" | "compact";
}

/** Azimut d'une position horaire, en radians, 0 = 3 h, sens horaire. */
export function hourAzimuth(at: 2 | 3 | 4): number {
  return ((at - 3) * 30 * Math.PI) / 180;
}

/** Point de l'axe radial à l'azimut ψ, à la distance `r` du centre. */
function radial(psi: number, r: number, z: number): [number, number, number] {
  return [C + r * Math.cos(psi), C + r * Math.sin(psi), z];
}

/**
 * Un cylindre projeté : son corps, ses cannelures le long de l'axe (sur la
 * moitié du pourtour qui nous regarde, à leur vraie place sur l'ellipse du
 * bout), et sa tête si elle nous fait face.
 */
export function Cylinder3D({
  uid,
  p,
  cyl,
  metal,
  grooves = 0,
  head,
  headInset = 0,
  dark = 0,
  footShade = 0,
  children,
}: Base & {
  cyl: Cyl;
  metal: MetalTone;
  grooves?: number;
  /** Dégradé de la tête (bout `to`) quand elle nous regarde. */
  head?: string;
  /** Retrait de la tête par rapport au corps. */
  headInset?: number;
  /** Assombrissement uniforme (tige dans l'ombre). */
  dark?: number;
  /** Ombre portée par la carrure sur le pied. */
  footShade?: number;
  children?: ReactNode;
}) {
  const ramp = METALS[metal];
  const q = projectCyl(p, cyl);
  const r = cyl.r;
  const body = cylBodyPath(q.length, r, q.minor);
  // Repère local : pied à l'origine, axe vers +x. Une normale de flanc à l'angle
  // β sur le pourtour : composante perpendiculaire à l'axe dans l'écran, et
  // composante le long de l'axe projeté d'autant que l'axe fuit.
  const [x0, y0, z0] = cyl.from;
  const [x1, y1, z1] = cyl.to;
  const len3 = Math.hypot(x1 - x0, y1 - y0, z1 - z0) || 1;
  const az = ((x1 - x0) * p.s + (z1 - z0) * p.c) / len3;
  const flank = Math.sqrt(Math.max(0, 1 - az * az));
  const rad = (q.angle * Math.PI) / 180;
  const perp = [-Math.sin(rad), Math.cos(rad)] as const;
  const axis = [Math.cos(rad), Math.sin(rad)] as const;

  return (
    <g transform={`translate(${n(q.x)} ${n(q.y)}) rotate(${n(q.angle)})`}>
      <path d={body} fill={`url(#${uid}-metal-${metal})`} stroke={ramp.edge} strokeWidth="1.2" strokeLinejoin="round" />
      {dark > 0 && <path d={body} fill={INK} fillOpacity={dark} />}
      {grooves > 0 &&
        Array.from({ length: grooves }, (_, i) => {
          // Cannelures réparties sur la moitié visible ; leur teinte suit la lumière.
          const beta = -Math.PI + (Math.PI * (i + 0.5)) / grooves;
          const yOff = r * Math.cos(beta);
          const xOff = -r * Math.abs(Math.sin(beta)) * az;
          const nx = Math.cos(beta) * perp[0] + Math.abs(Math.sin(beta)) * az * axis[0];
          const ny = Math.cos(beta) * perp[1] + Math.abs(Math.sin(beta)) * az * axis[1];
          const nz = Math.abs(Math.sin(beta)) * flank;
          const lit = lum3(nx, ny, nz, "poli");
          const xa = n(xOff + 3);
          const xb = n(q.length + xOff - 3);
          if (xb - xa < 2) return null;
          return (
            <g key={i}>
              <line x1={xa} y1={n(yOff)} x2={xb} y2={n(yOff)} stroke={INK} strokeOpacity="0.5" strokeWidth="2.2" />
              <line x1={xa} y1={n(yOff + 1.8)} x2={xb} y2={n(yOff + 1.8)} stroke={ramp.hi} strokeOpacity={n(Math.max(0.08, (lit - 0.3) * 1.2))} strokeWidth="1" />
            </g>
          );
        })}
      {footShade > 0 && <rect x="-1" y={-r} width={n(Math.min(12, q.length))} height={r * 2} fill={INK} fillOpacity={footShade} />}
      {head && q.headVisible && (
        <ellipse cx={n(q.length)} cy="0" rx={n(Math.max(0.3, q.minor - headInset))} ry={n(r - headInset)} fill={`url(#${head})`} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1" />
      )}
      {children}
    </g>
  );
}

/** Couronne de remontage (ou seconde couronne du réhaut), cannelée, signée ou oignon. */
export function Crown3D({
  uid,
  p,
  detail,
  style,
  metal,
  at,
  offset = 0,
  size = 1,
}: Base & { style: CrownStyle; metal: MetalTone; at: 2 | 3 | 4; offset?: number; size?: number }) {
  const ramp = METALS[metal];
  const psi = hourAzimuth(at);
  const z = Z.couronne;
  const r0 = R_CASE + offset - 6;
  const full = detail === "full";

  if (style === "oignon" && size === 1) {
    const rb = 44;
    const neck: Cyl = { from: radial(psi, r0, z), to: radial(psi, r0 + 16, z), r: 20 };
    const bulb: Cyl = { from: radial(psi, r0 + 14, z), to: radial(psi, r0 + 50, z), r: rb };
    const cabochon: Cyl = { from: radial(psi, r0 + 49, z), to: radial(psi, r0 + 57, z), r: 12 };
    return (
      <g data-layer="couronne">
        <Cylinder3D uid={uid} p={p} detail={detail} cyl={neck} metal={metal} dark={0.35} />
        <Cylinder3D uid={uid} p={p} detail={detail} cyl={bulb} metal={metal} grooves={full ? 12 : 0} head={`${uid}-pj-tete-couronne`} headInset={5} footShade={0.25} />
        <Cylinder3D uid={uid} p={p} detail={detail} cyl={cabochon} metal={metal} head={`${uid}-pj-tete-couronne`} />
      </g>
    );
  }

  const r = 40 * size;
  const body: Cyl = { from: radial(psi, r0, z), to: radial(psi, r0 + 42 * size, z), r };
  const head: Cyl = { from: radial(psi, r0 + 41 * size, z), to: radial(psi, r0 + 50 * size, z), r: r - 4 };
  const q = projectCyl(p, head);
  const pied = projectCyl(p, body);
  return (
    <g data-layer="couronne">
      {/* Occlusion sous la couronne : elle dépasse du flanc de trois millimètres et y porte son ombre. */}
      {full && p.s !== 0 && <ellipse cx={n(pied.x + 4)} cy={n(pied.y + 6)} rx={n(6 + 10 * Math.abs(p.s))} ry={n(r + 4)} fill={INK} fillOpacity={n(0.28 * Math.abs(p.s))} filter={`url(#${uid}-soft)`} />}
      <Cylinder3D uid={uid} p={p} detail={detail} cyl={body} metal={metal} grooves={full ? 11 : 0} footShade={0.28} />
      <Cylinder3D uid={uid} p={p} detail={detail} cyl={head} metal={metal} head={`${uid}-pj-tete-couronne`} headInset={2}>
        {style === "signee" &&
          (q.headVisible && q.minor > 12 ? (
            <text
              x={n(q.length)}
              y="0"
              dy="0.36em"
              textAnchor="middle"
              fill={ramp.edge}
              fillOpacity="0.8"
              transform={`translate(${n(q.length)} 0) scale(${n(q.minor / (r - 4))} 1) rotate(${n(-q.angle)}) translate(${n(-q.length)} 0)`}
              style={{ fontFamily: "var(--font-title)", fontSize: n(24 * size), fontWeight: 600 }}
            >
              C
            </text>
          ) : (
            <line x1={n(q.length - 4)} y1={-9 * size} x2={n(q.length - 4)} y2={9 * size} stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
          ))}
      </Cylinder3D>
    </g>
  );
}

/** Poussoir de chronographe : bague moletée, tige, tête champignon. */
export function Pusher3D({ uid, p, detail, metal, at }: Base & { metal: MetalTone; at: 2 | 4 }) {
  const psi = ((at === 2 ? -27 : 27) * Math.PI) / 180;
  const z = Z.couronne;
  const ring: Cyl = { from: radial(psi, R_CASE - 6, z), to: radial(psi, R_CASE + 18, z), r: 24 };
  const stem: Cyl = { from: radial(psi, R_CASE + 17, z), to: radial(psi, R_CASE + 32, z), r: 12 };
  const head: Cyl = { from: radial(psi, R_CASE + 31, z), to: radial(psi, R_CASE + 57, z), r: 22 };
  return (
    <g data-layer="poussoir">
      <Cylinder3D uid={uid} p={p} detail={detail} cyl={ring} metal={metal} grooves={detail === "full" ? 5 : 0} footShade={0.3} />
      {detail === "full" && <Cylinder3D uid={uid} p={p} detail={detail} cyl={stem} metal={metal} dark={0.35} />}
      <Cylinder3D uid={uid} p={p} detail={detail} cyl={head} metal={metal} head={`${uid}-pj-tete-boite`} headInset={3} />
    </g>
  );
}

/**
 * Épaulements du protège-couronne : deux bossages venus de matière avec le
 * flanc, de part et d'autre de la couronne, sur presque toute la hauteur de la
 * carrure. Chacun est un volume : l'enveloppe convexe de ses deux faces
 * (dessus, à un chanfrein sous le plat de carrure ; dessous, un peu au-dessus
 * du plan de joint du fond) donne son flanc, qui se dérobe vers le bas comme
 * celui de la carrure ; puis le dessus se pose par-dessus quand il nous regarde.
 */
export function Guards3D({ uid, p, metal, at, detail }: Base & { metal: MetalTone; at: 3 | 4 }) {
  const ramp = METALS[metal];
  const xPied = C + R_CASE - 30;
  const xNez = C + R_CASE + 27;
  const rot = ((at - 3) * 30 * Math.PI) / 180;
  const turn = ([x, y]: [number, number]): [number, number] => {
    const dx = x - C;
    const dy = y - C;
    return [C + dx * Math.cos(rot) - dy * Math.sin(rot), C + dx * Math.sin(rot) + dy * Math.cos(rot)];
  };
  const zHaut = Z.carrure - 3;
  const zBas = Z.fond + 8;
  const full = detail === "full";
  return (
    <g data-layer="protege-couronne">
      {([-1, 1] as const).map((sy) => {
        const Y = (d: number) => C + sy * d;
        const d = `M ${xPied - 34} ${Y(92)} C ${xPied + 12} ${Y(88)} ${xNez - 6} ${Y(80)} ${xNez} ${Y(60)} Q ${xNez + 4} ${Y(44)} ${xNez - 4} ${Y(34)} L ${xPied + 22} ${Y(30)} L ${xPied - 12} ${Y(30)} Z`;
        const contour: Array<[number, number]> = ([
          [xPied - 34, Y(92)],
          bez3([xPied - 34, Y(92)], [xPied + 12, Y(88)], [xNez - 6, Y(80)], [xNez, Y(60)], 0.35),
          bez3([xPied - 34, Y(92)], [xPied + 12, Y(88)], [xNez - 6, Y(80)], [xNez, Y(60)], 0.7),
          [xNez, Y(60)],
          bez2([xNez, Y(60)], [xNez + 4, Y(44)], [xNez - 4, Y(34)], 0.5),
          [xNez - 4, Y(34)],
          [xPied + 22, Y(30)],
          [xPied - 12, Y(30)],
        ] as Array<[number, number]>).map(turn);
        const faces = [zHaut, zBas].flatMap((z) => contour.map(([x, y]): [number, number] => [px(p, x, z), y]));
        const enveloppe = hull(faces);
        const nx = p.side * 0.9;
        const lum = lum3(nx * p.c, sy * 0.35, Math.abs(nx * p.s), "poli");
        // Arête du dessus, projetée : le chanfrein poli qui court sur le nez du bossage.
        const arete = contour.slice(0, 5).map(([x, y]): [number, number] => [px(p, x, zHaut), y]);
        return (
          <g key={sy}>
            <path d={`${pts(enveloppe)} Z`} fill={rampAt(ramp, 0.2 + 0.7 * lum)} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1.2" strokeLinejoin="round" />
            {p.s !== 0 && <path d={`${pts(enveloppe)} Z`} fill={`url(#${uid}-pj-dessous)`} opacity="0.5" />}
            {full && p.s !== 0 && <path d={pts(arete)} fill="none" stroke={ramp.hi} strokeOpacity={sy === -1 ? 0.8 : 0.45} strokeWidth="1.6" strokeLinecap="round" />}
            {Math.abs(p.c) > 0.03 && (
              <g transform={`${flatSigned(p, p.front ? zHaut : zBas)} rotate(${(at - 3) * 30} ${C} ${C})`}>
                <path d={d} fill={`url(#${uid}-case)`} stroke={ramp.edge} strokeWidth="1.4" strokeLinejoin="round" />
                {sy === 1 && <path d={d} fill={INK} fillOpacity="0.22" />}
                <path
                  d={`M ${xPied + 4} ${C + sy * 86} C ${xPied + 30} ${C + sy * 82} ${xNez - 8} ${C + sy * 76} ${xNez - 3} ${C + sy * 58}`}
                  fill="none"
                  stroke={ramp.hi}
                  strokeOpacity={sy === -1 ? 0.9 : 0.5}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Profondeur d'une pièce posée à l'heure `at` sur le flanc : devant le boîtier si positive. */
export function flankDepth(p: Pose, at: 2 | 3 | 4): number {
  const psi = hourAzimuth(at);
  return depth(p, C + R_CASE * Math.cos(psi), Z.couronne);
}
