import { C, R_DIAL, n } from "../geometry";
import { METALS } from "../palette";
import { Crystal } from "../parts/crystal";
import type { WatchRender } from "../types";
import { Z, bandPath, flat, pts, rimSegment, type Pose } from "./geometry3d";
import { bezelTop } from "./case3d";

/**
 * Verre en volume. Une lame plate ne montre que son chant ; un bombé, son
 * galbe ; un box, ses flancs droits puis un dessus à peine bombé. Le reflet
 * et le chant lumineux du dessin de face (`parts/crystal.tsx`) restent posés
 * sur le verre, projetés à son altitude.
 *
 * Le dôme est l'enveloppe d'un empilement de tranches horizontales du même
 * sphérique : chaque tranche est une ellipse décalée de son altitude ; leur
 * contour extérieur, échantillonné en hauteur, donne la silhouette. Un dôme
 * plat ne déborde de sa base qu'aux angles rasants, ce qui est exact.
 */
export function Crystal3D({
  uid,
  render,
  p,
  k,
  sheen,
  cyclops,
  detail,
}: {
  uid: string;
  render: WatchRender;
  p: Pose;
  k: number;
  sheen?: { x: number; y: number };
  cyclops: boolean;
  detail: "full" | "compact";
}) {
  const a = R_DIAL * k;
  const zBase = bezelTop(render);
  const kind = render.crystal;
  const ramp = METALS[render.caseMetal];
  const zSheen = zBase + (kind === "plat" ? Z.verrePlat / 2 : kind === "box" ? Z.verreBoxMur / 2 : 10);
  const kScale = k === 1 ? "" : ` translate(${C} ${C}) scale(${k}) translate(${-C} ${-C})`;
  const full = detail === "full";
  if (!full) return null;

  return (
    <g data-layer="verre-3d">
      {full && (
        <g transform={`${flat(p, zSheen)}${kScale}`}>
          <Crystal uid={uid} kind={kind} antiGlare={render.antiGlare} sheen={sheen} cyclops={cyclops} dialColor={render.dialColor} />
        </g>
      )}
      {p.s !== 0 && (kind === "plat" || kind === "box") && (
        <Chant uid={uid} p={p} a={a} zBase={zBase} height={kind === "plat" ? Z.verrePlat : Z.verreBoxMur} edge={ramp.edge} antiGlare={render.antiGlare} />
      )}
      {kind === "bombe" && <Dome uid={uid} p={p} a={a} zBase={zBase} h={Z.verreBombe} />}
      {kind === "box" && <Dome uid={uid} p={p} a={a - 2} zBase={zBase + Z.verreBoxMur} h={Z.verreBoxDome} />}
    </g>
  );
}

/** Chant d'une lame ou flanc droit d'un verre box : une bande de saphir, arête vive en haut. */
function Chant({ uid, p, a, zBase, height, edge, antiGlare }: { uid: string; p: Pose; a: number; zBase: number; height: number; edge: string; antiGlare: boolean }) {
  const d = bandPath(p, a, zBase + height, a, zBase);
  const az = (phi: number) => (p.side > 0 ? phi : Math.PI - phi);
  return (
    <g data-layer="chant">
      <path d={d} fill={`url(#${uid}-pj-verre)`} />
      <path d={d} fill="none" stroke={edge} strokeOpacity="0.4" strokeWidth="0.9" />
      <path d={rimSegment(p, a, zBase + height - 1.5, az(-1.2), az(0.35))} fill="none" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1.8" strokeLinecap="round" />
      {antiGlare && <path d={bandPath(p, a - 1, zBase + 2.5, a - 1, zBase + 1)} fill="#6A64FF" fillOpacity="0.3" />}
    </g>
  );
}

/**
 * Dôme : seule compte la part qui déborde de sa base — la calotte vue par la
 * tranche. Tant qu'elle reste dans l'ellipse de base (jusqu'à ~75°), rien.
 */
function Dome({ uid, p, a, zBase, h }: { uid: string; p: Pose; a: number; zBase: number; h: number }) {
  if (p.s === 0) return null;
  const rho = (a * a + h * h) / (2 * h);
  const zc = zBase + h - rho;
  const levels = 10;
  const tranches = Array.from({ length: levels + 1 }, (_, i) => {
    const z = zBase + (h * i) / levels;
    const r = Math.sqrt(Math.max(0, rho * rho - (z - zc) * (z - zc)));
    return { cx: C - z * p.s, rx: r * Math.abs(p.c), ry: r };
  });
  const base = tranches[0]!;
  // Le dôme s'élève du côté où regarde le cadran : vers −x si sin θ > 0.
  const dir = p.s > 0 ? -1 : 1;
  const samples = 22;
  const outer: Array<[number, number]> = [];
  const inner: Array<[number, number]> = [];
  let saillie = 0;
  for (let j = 0; j <= samples; j++) {
    const y = a * Math.sin(-Math.PI / 2 + (Math.PI * j) / samples);
    let best = base.cx + dir * base.rx * Math.sqrt(Math.max(0, 1 - (y * y) / (base.ry * base.ry)));
    const bord = best;
    for (const t of tranches) {
      if (Math.abs(y) > t.ry) continue;
      const x = t.cx + dir * t.rx * Math.sqrt(1 - (y * y) / (t.ry * t.ry));
      if (dir * x > dir * best) best = x;
    }
    saillie = Math.max(saillie, dir * (best - bord));
    outer.push([best, C + y]);
    inner.push([bord, C + y]);
  }
  if (saillie < 1.5) return null;
  const d = `${pts(outer)} ${inner
    .slice()
    .reverse()
    .map(([x, y]) => `L ${n(x)} ${n(y)}`)
    .join(" ")} Z`;
  return (
    <g data-layer="dome">
      <path d={d} fill={`url(#${uid}-pj-dome)`} />
      <path d={pts(outer)} fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.2" />
      <path d={pts(outer.slice(3, -3))} fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0 70 120 2000" />
    </g>
  );
}
