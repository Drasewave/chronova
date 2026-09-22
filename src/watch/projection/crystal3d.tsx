import { C, R_DIAL, n } from "../geometry";
import { INK, METALS, PAPER } from "../palette";
import { Crystal } from "../parts/crystal";
import type { WatchRender } from "../types";
import { SAPHIR } from "./defs3d";
import { Z, bandPath, flat, pts, rimSegment, wallPath, type Pose } from "./geometry3d";
import { bezelTop } from "./case3d";

/** Emprise de la loupe de quantième (voir `Cyclops` dans `parts/crystal.tsx`). */
export const LOUPE = { cx: C + 198, cy: C, w: 90, h: 74 } as const;

/**
 * Verre en volume. Une lame plate ne montre que son chant ; un bombé, son
 * galbe ; un box, ses flancs droits puis un dessus à peine bombé. Le reflet
 * et le chant lumineux du dessin de face (`parts/crystal.tsx`) restent posés
 * sur le verre, projetés à son altitude : la boîte à lumière ne bouge pas,
 * c'est l'objet qui tourne sous elle. La loupe, collée sur le verre, a une
 * hauteur : son flanc de saphir se voit de biais, et elle porte son ombre.
 *
 * Le dôme est l'enveloppe d'un empilement de tranches horizontales du même
 * sphérique : chaque tranche est une ellipse décalée de son altitude ; leur
 * contour extérieur, échantillonné en hauteur, donne la silhouette. Un dôme
 * plat ne déborde de sa base qu'aux angles rasants, ce qui est exact. Sous
 * son bord, le saphir épais réfracte : le pourtour du cadran y apparaît
 * légèrement grossi (`Refraction`).
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
      {kind !== "plat" && p.s !== 0 && <Refraction uid={uid} p={p} a={a} zBase={zBase} />}
      <g transform={`${flat(p, zSheen)}${kScale}`}>
        <Crystal uid={uid} kind={kind} antiGlare={render.antiGlare} sheen={sheen} cyclops={cyclops} dialColor={render.dialColor} />
      </g>
      {cyclops && p.s !== 0 && <LoupeFlanc uid={uid} p={p} k={k} zBase={zSheen} edge={ramp.edge} />}
      {p.s !== 0 && (kind === "plat" || kind === "box") && (
        <Chant uid={uid} p={p} a={a} zBase={zBase} height={kind === "plat" ? Z.verrePlat : Z.verreBoxMur} edge={ramp.edge} antiGlare={render.antiGlare} />
      )}
      {kind === "bombe" && <Dome uid={uid} p={p} a={a} zBase={zBase} h={Z.verreBombe} antiGlare={render.antiGlare} />}
      {kind === "box" && <Dome uid={uid} p={p} a={a - 2} zBase={zBase + Z.verreBoxMur} h={Z.verreBoxDome} antiGlare={render.antiGlare} />}
    </g>
  );
}

/**
 * Réfraction du bord : sous le chant d'un verre épais, ce qu'on voit du cadran
 * est repris, à peine grossi autour du centre — quelques unités de décalage
 * au bord, rien au centre. Un `<use>` du contenu sous verre, limité à une
 * couronne le long du bord du côté qui fuit, là où le saphir se voit en biais.
 */
function Refraction({ uid, p, a, zBase }: { uid: string; p: Pose; a: number; zBase: number }) {
  const largeur = 16;
  const clip = `${uid}-pj-clip-refraction`;
  const grossi = 1 + 0.018 * Math.abs(p.s);
  // Le contenu sous verre porte déjà ses propres projections : on le grossit
  // autour du centre du cadran tel qu'il apparaît à l'écran.
  const cx = n(C - Z.cadran * p.s);
  return (
    <g data-layer="refraction" opacity={n(0.45 + 0.3 * Math.abs(p.s))}>
      <clipPath id={clip}>
        <path d={bandPath(p, a, zBase, a - largeur, zBase, p.side > 0 ? -1 : 1)} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <use href={`#${uid}-pj-sous-verre`} transform={`translate(${cx} ${C}) scale(${n(grossi)}) translate(${-cx} ${-C})`} />
      </g>
    </g>
  );
}

/**
 * Flanc de la loupe : une lentille de saphir d'un bon millimètre et demi,
 * collée sur le verre. Vue de biais, sa face latérale qui regarde vers nous se
 * montre en bande claire, et elle porte une ombre nette sur le cadran.
 */
function LoupeFlanc({ uid, p, k, zBase, edge }: { uid: string; p: Pose; k: number; zBase: number; edge: string }) {
  const x0 = C + (LOUPE.cx - LOUPE.w / 2 - C) * k;
  const x1 = C + (LOUPE.cx + LOUPE.w / 2 - C) * k;
  const y0 = C + (LOUPE.cy - LOUPE.h / 2 - C) * k + 6;
  const y1 = C + (LOUPE.cy + LOUPE.h / 2 - C) * k - 6;
  const d = wallPath(p, x1, y0, y1, zBase, zBase + Z.loupe, 1) ?? wallPath(p, x0, y0, y1, zBase, zBase + Z.loupe, -1);
  if (!d) return null;
  return (
    <g data-layer="loupe-flanc">
      <path d={d} fill={`url(#${uid}-pj-verre)`} stroke={edge} strokeOpacity="0.45" strokeWidth="0.9" strokeLinejoin="round" />
      <path d={d} fill={SAPHIR} fillOpacity="0.35" />
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
function Dome({ uid, p, a, zBase, h, antiGlare }: { uid: string; p: Pose; a: number; zBase: number; h: number; antiGlare: boolean }) {
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
      <path d={d} fill={INK} fillOpacity="0.06" />
      {/* Voile antireflet : le bleu-violet du traitement, au ras du bord. */}
      {antiGlare && <path d={pts(outer)} fill="none" stroke="#6A64FF" strokeOpacity="0.28" strokeWidth="2" />}
      <path d={pts(outer)} fill="none" stroke={PAPER} strokeOpacity="0.5" strokeWidth="1.2" />
      {/* Fenêtre du studio, en haut à gauche du galbe : elle ne suit pas l'objet. */}
      <path d={pts(outer.slice(3, -3))} fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0 70 120 2000" />
    </g>
  );
}
