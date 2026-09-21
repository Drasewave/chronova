import { INK, METALS, PAPER, mix, rampAt, shade, tint, type MetalRamp } from "../palette";
import { n } from "../geometry";
import type { StrapKind, WatchRender } from "../types";
import type { Sheen } from "./conic";
import { FINISH_SHEEN } from "./defs";

/**
 * Vue de profil, prise côté couronne (3 h).
 *
 * Elle montre ce qu'une vue de face cache : l'épaisseur de la carrure, le galbe
 * du verre — un saphir bombé change réellement la silhouette —, la courbe des
 * cornes qui décide du confort au poignet, et le bracelet vu par sa tranche.
 * Depuis ce côté la couronne se présente de bout : un disque cannelé, signé,
 * flanqué de ses poussoirs sur un chronographe. La carrure est un cylindre
 * debout : sa lumière varie de gauche à droite, pas de haut en bas.
 *
 * Le dessin est établi à 10 px ≈ 1 mm puis agrandi par `CADRAGE` : la tête de
 * montre remplit le cadre et les brins tombent hors champ.
 */

const CX = 500;
const HW = 204; // demi-largeur de carrure (R_CASE × 0,58)
const HB = 198; // demi-largeur de lunette
const HG = 170; // demi-largeur du verre
const Y_CARRURE = 450; // plan de joint lunette / carrure
const Y_FOND = 512; // plan de joint carrure / fond
const Y_COURONNE = 481;
const SAPHIR = "#C3D3DD";
const CADRAGE = "translate(500 468) scale(1.3) translate(-500 -468)";

/** Boîtes à lumière vues par un flanc vertical : angle de la normale autour de l'axe, 0° = face à nous. */
const LIGHTS: ReadonlyArray<readonly [number, number, number]> = [
  [-40, 30, 1], // boîte principale, à gauche
  [56, 13, 0.6], // débouchage, à droite
  [-85, 8, 0.32], // liseré de contour
];

function flankLum(theta: number, sheen: Sheen): number {
  const spread = sheen === "brosse" ? 1.7 : sheen === "mat" ? 2.6 : sheen === "ceramique" ? 0.8 : 1;
  let lum = 0;
  for (const [centre, width, power] of LIGHTS) lum += power * Math.exp(-(((theta - centre) / (width * spread)) ** 2));
  // Plafond du studio : large et faible. Sans lui un poli vire au noir de face ;
  // les finitions diffuses, elles, n'en ont pas besoin — il les délaverait.
  if (sheen === "poli") lum += 0.34 * Math.exp(-(((theta - 8) / 62) ** 2));
  lum = Math.min(1, lum);
  if (sheen === "poli") return 0.1 + 0.9 * smooth(lum, 0.12, 0.78);
  if (sheen === "brosse") return 0.34 + 0.5 * lum;
  if (sheen === "mat") return 0.42 + 0.2 * lum;
  return 0.06 + 0.8 * smooth(lum, 0.3, 0.95);
}

function smooth(x: number, a: number, b: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function ProfileView({ uid, render }: { uid: string; render: WatchRender }) {
  const ramp = METALS[render.caseMetal];
  const sheen = FINISH_SHEEN[render.caseFinish];
  const plongee = render.bezelStyle === "plongee";
  // La lunette GMT a le même profil cranté et le même insert, sans protège-couronne.
  const insert = plongee || render.bezelStyle === "gmt";
  const chrono = render.movement === "VK64";
  const coussin = render.caseShape === "coussin";
  const crownAt: 3 | 4 = render.crownAt === 4 ? 4 : 3;
  // Mêmes arbitrages que la vue de face (`flankLayout`) : le réhaut boussole
  // amène sa couronne à 4 h, ou à 2 h si celle de remontage y est déjà.
  const boussole = render.innerRing === "boussole" && render.movement !== "NH34" && render.movement !== "VK64";
  const secondCrownAt: 2 | 4 | null = boussole ? (crownAt === 4 ? 2 : 4) : null;
  const yLunette = insert ? 420 : 424;
  const yBas = render.caseback === "plein" ? 542 : 539;
  const grain =
    render.caseFinish === "brosse" ? `url(#${uid}-pf-stries)` : render.caseFinish === "microbille" ? `url(#${uid}-beaded)` : null;
  // Galbe du fond : franc sur un fond plein, plus court quand un saphir le coiffe.
  const galbe =
    render.caseback === "plein"
      ? `M ${CX - 172} ${Y_FOND + 6} C ${CX - 160} ${yBas - 6} ${CX - 122} ${yBas} ${CX - 84} ${yBas} H ${CX + 84} C ${CX + 122} ${yBas} ${CX + 160} ${yBas - 6} ${CX + 172} ${Y_FOND + 6} Z`
      : `M ${CX - 172} ${Y_FOND + 6} C ${CX - 164} ${yBas - 8} ${CX - 146} ${yBas - 5} ${CX - 130} ${yBas - 5} H ${CX + 130} C ${CX + 146} ${yBas - 5} ${CX + 164} ${yBas - 8} ${CX + 172} ${Y_FOND + 6} Z`;
  const carrure = `M ${CX - HW} ${Y_CARRURE} H ${CX + HW} V ${Y_FOND - 10} Q ${CX + HW} ${Y_FOND} ${CX + HW - 12} ${Y_FOND} H ${CX - HW + 12} Q ${CX - HW} ${Y_FOND} ${CX - HW} ${Y_FOND - 10} Z`;

  return (
    <g data-view="profil" transform={CADRAGE}>
      <defs>
        <FlankGradient id={`${uid}-pf-flanc`} half={HW} colorAt={(t) => rampAt(ramp, flankLum(t, sheen))} />
        <FlankGradient id={`${uid}-pf-poli`} half={HW} colorAt={(t) => rampAt(ramp, flankLum(t, "poli"))} />
        {insert && (
          <FlankGradient
            id={`${uid}-pf-insert`}
            half={HB}
            colorAt={(t) => {
              const c = render.insertColor ?? "#1B2B45";
              return (render.insertMaterial ?? "ceramique") === "ceramique"
                ? mix(shade(c, 0.38), tint(c, 0.6), flankLum(t, "ceramique"))
                : mix(shade(c, 0.12), tint(c, 0.2), flankLum(t, "mat"));
            }}
          />
        )}
        {/* Tout ce qui regarde vers le bas perd la lumière ; ce qui regarde le ciel la prend. */}
        <linearGradient id={`${uid}-pf-dessous`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK} stopOpacity="0.05" />
          <stop offset="1" stopColor={INK} stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={`${uid}-pf-galbe`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.42" />
          <stop offset="0.45" stopColor={PAPER} stopOpacity="0" />
          <stop offset="1" stopColor={INK} stopOpacity="0.22" />
        </linearGradient>
        {/* Cornes : la gauche fait face à la boîte principale, la droite au débouchage. */}
        {([
          ["g", 0.84, 0.62, 0.3],
          ["d", 0.56, 0.4, 0.16],
        ] as const).map(([side, a, b, c]) => (
          <linearGradient key={side} id={`${uid}-pf-corne-${side}`} gradientUnits="userSpaceOnUse" x1="0" y1="450" x2="0" y2="550">
            <stop offset="0" stopColor={rampAt(ramp, a)} />
            <stop offset="0.5" stopColor={rampAt(ramp, b)} />
            <stop offset="1" stopColor={rampAt(ramp, c)} />
          </linearGradient>
        ))}
        <HeadGradient id={`${uid}-pf-tete-couronne`} ramp={METALS[render.crownMetal]} />
        <HeadGradient id={`${uid}-pf-tete-boite`} ramp={ramp} />
        <linearGradient id={`${uid}-pf-verre`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity="0.85" />
          <stop offset="0.35" stopColor={SAPHIR} stopOpacity="0.5" />
          <stop offset="1" stopColor={mix(SAPHIR, INK, 0.55)} stopOpacity="0.7" />
        </linearGradient>
        {/* Brossage du flanc : il suit la circonférence, donc horizontal vu d'ici. */}
        <pattern id={`${uid}-pf-stries`} width="40" height="4.2" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0.7" x2="40" y2="0.7" stroke={PAPER} strokeOpacity="0.2" strokeWidth="0.6" />
          <line x1="0" y1="2.1" x2="40" y2="2.1" stroke={INK} strokeOpacity="0.14" strokeWidth="0.6" />
          <line x1="0" y1="3.4" x2="40" y2="3.4" stroke={PAPER} strokeOpacity="0.1" strokeWidth="0.5" />
        </pattern>
        <filter id={`${uid}-pf-flou`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <StrapProfile uid={uid} kind={render.strapKind} color={render.strapColor} ramp={ramp} yBas={yBas} />

      {/* Fond : un rebord vissé puis un galbe, plein ou coiffé d'un saphir plat. */}
      <g data-layer="fond">
        {render.caseback === "plein" ? (
          <path d={galbe} fill={`url(#${uid}-pf-poli)`} />
        ) : (
          <>
            <path d={`M ${CX - 124} ${yBas - 6} L ${CX - 119} ${yBas} H ${CX + 119} L ${CX + 124} ${yBas - 6} Z`} fill={SAPHIR} fillOpacity="0.8" stroke={ramp.edge} strokeOpacity="0.5" strokeWidth="1" />
            <line x1={CX - 112} y1={yBas - 1.2} x2={CX - 30} y2={yBas - 1.2} stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="1.2" />
            <path d={galbe} fill={`url(#${uid}-pf-poli)`} />
          </>
        )}
        <path d={galbe} fill={`url(#${uid}-pf-dessous)`} />
        <rect x={CX - 178} y={Y_FOND - 1} width="356" height="8" rx="2" fill={`url(#${uid}-pf-poli)`} />
        <rect x={CX - 178} y={Y_FOND - 1} width="356" height="8" rx="2" fill={INK} fillOpacity="0.22" />
        {/* Encoches de clé, vues par la tranche. */}
        {[-62, -30, 30, 62].map((t) => {
          const x = CX + 178 * Math.sin((t * Math.PI) / 180);
          const w = 15 * Math.cos((t * Math.PI) / 180);
          return <rect key={t} x={n(x - w / 2)} y={Y_FOND + 1} width={n(w)} height="5" fill={INK} fillOpacity="0.6" />;
        })}
      </g>

      {coussin ? (
        <CushionFlank uid={uid} ramp={ramp} grain={grain} mat={sheen === "mat"} />
      ) : (
      <>
      {/* Carrure : flanc dans sa finition, chanfreins polis en haut et en bas. */}
      <g data-layer="boitier">
        <path d={carrure} fill={`url(#${uid}-pf-flanc)`} />
        {grain && <path d={carrure} fill={grain} />}
        <rect x={CX - HW} y={Y_CARRURE} width={HW * 2} height="5.5" fill={`url(#${uid}-pf-poli)`} />
        <line x1={CX - HW} y1={Y_CARRURE + 1} x2={CX + HW} y2={Y_CARRURE + 1} stroke={ramp.hi} strokeOpacity="0.9" strokeWidth="1.3" />
        <line x1={CX - HW} y1={Y_CARRURE + 5.8} x2={CX + HW} y2={Y_CARRURE + 5.8} stroke={INK} strokeOpacity="0.28" strokeWidth="0.9" />
        <rect x={CX - HW + 6} y={Y_FOND - 7} width={HW * 2 - 12} height="7" fill={`url(#${uid}-pf-poli)`} />
        <rect x={CX - HW + 6} y={Y_FOND - 7} width={HW * 2 - 12} height="7" fill={INK} fillOpacity="0.34" />
        <line x1={CX - HW + 4} y1={Y_FOND - 7} x2={CX + HW - 4} y2={Y_FOND - 7} stroke={ramp.hi} strokeOpacity="0.55" strokeWidth="1" />
      </g>

      <Lug uid={uid} sx={-1} ramp={ramp} grain={grain} mat={sheen === "mat"} />
      <Lug uid={uid} sx={1} ramp={ramp} grain={grain} mat={sheen === "mat"} />
      </>
      )}

      <BezelProfile uid={uid} render={render} ramp={ramp} y={yLunette} />
      <CrystalProfile uid={uid} render={render} ramp={ramp} y={yLunette} />

      {/* La lunette déborde : trait d'ombre au plan de joint. */}
      <line x1={CX - HB} y1={Y_CARRURE} x2={CX + HB} y2={Y_CARRURE} stroke={INK} strokeOpacity="0.6" strokeWidth="1.6" />

      {/* Un coussin enveloppe sa couronne dans le flanc : pas d'épaulements rapportés. */}
      {plongee && !coussin && <GuardsProfile ramp={ramp} at={crownAt} />}
      {chrono && [-46, 46].map((dx) => <PusherProfile key={dx} uid={uid} x={CX + dx} ramp={ramp} />)}
      {secondCrownAt && <CrownProfile uid={uid} render={render} at={secondCrownAt} size={0.8} signed={false} />}
      <CrownProfile uid={uid} render={render} at={crownAt} signed={render.crownStyle === "signee"} />
    </g>
  );
}

/**
 * Corne, vue par son flanc : elle sort de la carrure et plonge vers le poignet.
 * Son flanc nous fait face alors que la carrure, cylindrique, se dérobe : d'où
 * une arête entre les deux, et un ton propre à chaque corne.
 */
function Lug({ uid, sx, ramp, grain, mat }: { uid: string; sx: 1 | -1; ramp: MetalRamp; grain: string | null; mat: boolean }) {
  const X = (dx: number) => n(CX + sx * dx);
  const lit = sx === -1;
  const dos = `C ${X(178)} 450 ${X(226)} 468 ${X(251)} 520`;
  const contour = `M ${X(124)} 450 ${dos} Q ${X(260)} 539 ${X(249)} 547 L ${X(231)} 549 C ${X(214)} 531 ${X(184)} 517 ${X(150)} 514`;
  const plein = `${contour} Q ${X(132)} 490 ${X(124)} 450 Z`;
  return (
    <g data-layer="corne">
      <path d={plein} fill={`url(#${uid}-pf-corne-${lit ? "g" : "d"})`} />
      {grain && <path d={plein} fill={grain} />}
      {/* Arête de raccord avec la carrure. */}
      <path d={`M ${X(150)} 514 Q ${X(132)} 490 ${X(124)} 450`} fill="none" stroke={lit ? INK : ramp.hi} strokeOpacity={lit ? 0.22 : 0.3} strokeWidth="1.4" />
      {/* Chanfrein poli du dessus : un filet d'éclat, puis son arête. */}
      <path d={`M ${X(124)} 452 C ${X(178)} 452 ${X(225)} 470 ${X(249.5)} 521`} fill="none" stroke={lit ? ramp.hi : ramp.light} strokeOpacity={mat ? 0.45 : lit ? 0.95 : 0.7} strokeWidth="3" strokeLinecap="round" />
      <path d={`M ${X(128)} 455.5 C ${X(178)} 455.5 ${X(222)} 473 ${X(246)} 523`} fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="1" />
      <path d={contour} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Perçage de la barrette. */}
      <circle cx={X(237) + 0.7} cy="532.8" r="3.4" fill={ramp.hi} fillOpacity="0.6" />
      <circle cx={X(237)} cy="532" r="3.3" fill={INK} fillOpacity="0.85" />
    </g>
  );
}

function BezelProfile({ uid, render, ramp, y }: { uid: string; render: WatchRender; ramp: MetalRamp; y: number }) {
  const style = render.bezelStyle;
  const rad = Math.PI / 180;

  if (style === "plongee" || style === "gmt") {
    // Pourtour cranté pour la prise en main, puis la pente de l'insert : sa
    // couleur se voit sur la tranche, sous le verre.
    // Même crantage « pièce de monnaie » que de face : soixante dents larges.
    const pas = 6;
    return (
      <g data-layer="lunette">
        <path d={`M ${CX - 196} ${y + 12} L ${CX - 180} ${y} H ${CX + 180} L ${CX + 196} ${y + 12} Z`} fill={`url(#${uid}-pf-insert)`} />
        <line x1={CX - 170} y1={y + 3} x2={CX - 66} y2={y + 3} stroke={PAPER} strokeOpacity={(render.insertMaterial ?? "ceramique") === "ceramique" ? 0.55 : 0.18} strokeWidth="1.6" strokeLinecap="round" />
        <rect x={CX - HB - 2} y={y + 12} width={(HB + 2) * 2} height={Y_CARRURE - y - 12} rx="2" fill={`url(#${uid}-pf-poli)`} />
        {Array.from({ length: 30 }, (_, i) => {
          const t = -87 + i * pas;
          const x = n(CX + (HB + 2) * Math.sin(t * rad));
          return <line key={i} x1={x} y1={y + 14.5} x2={x} y2={Y_CARRURE - 2} stroke={INK} strokeOpacity="0.55" strokeWidth={n(Math.max(0.8, 4.6 * Math.cos(t * rad)))} />;
        })}
        <line x1={CX - HB} y1={y + 13} x2={CX + HB} y2={y + 13} stroke={ramp.hi} strokeOpacity="0.85" strokeWidth="1.2" />
        <path d={`M ${CX - 196} ${y + 12} L ${CX - 180} ${y} H ${CX + 180} L ${CX + 196} ${y + 12}`} fill="none" stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="1.1" />
        <rect x={CX - HB - 2} y={y + 12} width={(HB + 2) * 2} height={Y_CARRURE - y - 12} rx="2" fill="none" stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1.1" />
      </g>
    );
  }

  if (style === "cannelee") {
    // Chaque dent est un prisme : deux facettes, deux directions, deux lumières.
    const d = `M ${CX - HB} ${Y_CARRURE} V ${Y_CARRURE - 3} L ${CX - 184} ${y + 2} Q ${CX - 183} ${y} ${CX - 179} ${y} H ${CX + 179} Q ${CX + 183} ${y} ${CX + 184} ${y + 2} L ${CX + HB} ${Y_CARRURE - 3} V ${Y_CARRURE} Z`;
    const w = 2.5;
    const facet = (t0: number, t1: number, facing: number, key: string) => {
      const b0 = n(CX + HB * Math.sin(t0 * rad));
      const b1 = n(CX + HB * Math.sin(t1 * rad));
      const h0 = n(CX + 184 * Math.sin(t0 * rad));
      const h1 = n(CX + 184 * Math.sin(t1 * rad));
      return <path key={key} d={`M ${b0} ${Y_CARRURE - 3} L ${h0} ${y + 3} L ${h1} ${y + 3} L ${b1} ${Y_CARRURE - 3} Z`} fill={rampAt(ramp, 0.26 + 0.7 * flankLum(facing, "poli"))} />;
    };
    return (
      <g data-layer="lunette">
        <path d={d} fill={`url(#${uid}-pf-poli)`} />
        {Array.from({ length: 36 }, (_, i) => {
          const t = -87.5 + i * 5;
          return [facet(t - w, t, t - 42, `${i}a`), facet(t, t + w, t + 42, `${i}b`)];
        })}
        <line x1={CX - 176} y1={y + 1.2} x2={CX + 176} y2={y + 1.2} stroke={ramp.hi} strokeOpacity="0.85" strokeWidth="1.2" />
        <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    );
  }

  // Lisse : un tore aplati. Il suit la finition du boîtier, miroir s'il est poli.
  const d = `M ${CX - HB} ${Y_CARRURE} V ${Y_CARRURE - 5} C ${CX - HB} ${y + 9} ${CX - 191} ${y} ${CX - 176} ${y} H ${CX + 176} C ${CX + 191} ${y} ${CX + HB} ${y + 9} ${CX + HB} ${Y_CARRURE - 5} V ${Y_CARRURE} Z`;
  return (
    <g data-layer="lunette">
      <path d={d} fill={`url(#${uid}-pf-${render.caseFinish === "poli" ? "poli" : "flanc"})`} />
      {render.caseFinish === "brosse" && <path d={d} fill={`url(#${uid}-pf-stries)`} />}
      {render.caseFinish === "microbille" && <path d={d} fill={`url(#${uid}-beaded)`} />}
      <path d={d} fill={`url(#${uid}-pf-galbe)`} />
      <line x1={CX - 168} y1={y + 2} x2={CX + 60} y2={y + 2} stroke={ramp.hi} strokeOpacity={render.caseFinish === "microbille" ? 0.25 : 0.8} strokeWidth="1.4" />
      <path d={d} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  );
}

/** Verre. Tout l'intérêt de la vue est là : une lame à peine saillante, ou un dôme. */
function CrystalProfile({ uid, render, ramp, y }: { uid: string; render: WatchRender; ramp: MetalRamp; y: number }) {
  const ar = render.antiGlare;
  if (render.crystal === "bombe") {
    const h = 27;
    const dome = `M ${CX - HG} ${y} C ${CX - 150} ${y - 15} ${CX - 96} ${y - h} ${CX} ${y - h} C ${CX + 96} ${y - h} ${CX + 150} ${y - 15} ${CX + HG} ${y}`;
    return (
      <g data-layer="verre">
        <path d={`${dome} Z`} fill={`url(#${uid}-pf-verre)`} />
        {/* Le réhaut, deviné à travers la base du dôme. */}
        <path d={`M ${CX - HG + 10} ${y} Q ${CX} ${y - 9} ${CX + HG - 10} ${y} Z`} fill={INK} fillOpacity="0.22" />
        {/* Fenêtre du studio, étirée par la courbure. */}
        <path d={dome} fill="none" stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 52 118 1000" transform="translate(3 5.5)" />
        <path d={dome} fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0 262 46 1000" transform="translate(-2 5)" />
        {ar && <path d={dome} fill="none" stroke="#6A64FF" strokeOpacity="0.3" strokeWidth="2" transform="translate(0 1.6)" />}
        <path d={dome} fill="none" stroke={ramp.edge} strokeOpacity="0.55" strokeWidth="1.2" />
      </g>
    );
  }
  const top = y - 7;
  const lame = `M ${CX - HG} ${y} L ${CX - HG + 5} ${top + 1} Q ${CX - HG + 6} ${top} ${CX - HG + 9} ${top} H ${CX + HG - 9} Q ${CX + HG - 6} ${top} ${CX + HG - 5} ${top + 1} L ${CX + HG} ${y} Z`;
  return (
    <g data-layer="verre">
      <path d={lame} fill={`url(#${uid}-pf-verre)`} stroke={ramp.edge} strokeOpacity="0.5" strokeWidth="1" />
      <line x1={CX - HG + 12} y1={top + 1.4} x2={CX - 20} y2={top + 1.4} stroke="#FFFFFF" strokeOpacity="0.95" strokeWidth="1.8" strokeLinecap="round" />
      <line x1={CX + 40} y1={top + 1.4} x2={CX + HG - 30} y2={top + 1.4} stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
      {ar && <line x1={CX - HG + 6} y1={y - 1.5} x2={CX + HG - 6} y2={y - 1.5} stroke="#6A64FF" strokeOpacity="0.35" strokeWidth="1.5" />}
    </g>
  );
}

/**
 * Couronne. À 3 h elle nous fait face : on la voit de bout, jante cannelée, tête
 * polie, signature. À 4 h (ou 2 h) son axe part de 30° vers 6 h (ou 12 h) : la
 * tête s'écrase en ellipse et l'on découvre un peu de son fût cannelé. Vu de ce
 * côté de la montre, 6 h est à gauche et 12 h à droite.
 */
function CrownProfile({ uid, render, at, size = 1, signed }: { uid: string; render: WatchRender; at: 2 | 3 | 4; size?: number; signed: boolean }) {
  const ramp = METALS[render.crownMetal];
  const r = 23 * size;
  const dents = 24;
  const pas = n((2 * Math.PI * (r - 2)) / dents);

  if (at !== 3) {
    const sx = at === 4 ? -1 : 1;
    const xPied = CX + sx * HW * 0.5; // là où le tube sort du flanc
    const xTete = xPied + sx * 17 * size; // trois millimètres de saillie, vus de biais
    const rx = n(r * 0.87);
    const x0 = Math.min(xPied, xTete);
    return (
      <g data-layer="couronne">
        <ellipse cx={xTete + 4} cy={Y_COURONNE + 7} rx={rx + 8} ry={r + 2} fill={INK} fillOpacity="0.5" filter={`url(#${uid}-pf-flou)`} />
        {/* Fût : un cylindre fuyant, cannelé dans le sens de son axe. */}
        <ellipse cx={xPied} cy={Y_COURONNE} rx={rx} ry={r} fill={ramp.dark} />
        <rect x={x0} y={n(Y_COURONNE - r)} width={n(Math.abs(xTete - xPied))} height={n(r * 2)} fill={ramp.mid} />
        <ellipse cx={xPied} cy={Y_COURONNE} rx={rx} ry={r} fill={`url(#${uid}-pf-dessous)`} />
        {Array.from({ length: 9 }, (_, i) => {
          const y = n(Y_COURONNE + (r - 1.5) * Math.sin(((-72 + i * 18) * Math.PI) / 180));
          return <line key={i} x1={xPied} y1={y} x2={xTete} y2={y} stroke={i < 4 ? ramp.hi : ramp.edge} strokeOpacity={i < 4 ? 0.85 : 0.55} strokeWidth="1.3" />;
        })}
        <ellipse cx={xTete} cy={Y_COURONNE} rx={rx} ry={r} fill={ramp.edge} />
        <ellipse cx={xTete} cy={Y_COURONNE} rx={n(rx - 1.8)} ry={r - 2} fill="none" stroke={`url(#${uid}-pf-tete-couronne)`} strokeWidth="4.2" strokeDasharray={`${n(pas * 0.55)} ${n(pas * 0.4)}`} />
        <ellipse cx={xTete} cy={Y_COURONNE} rx={n(rx - 4.4)} ry={r - 5} fill={`url(#${uid}-pf-tete-couronne)`} stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="1" />
        {signed && (
          <text x={xTete} y={Y_COURONNE + 5.4} textAnchor="middle" fill={ramp.edge} fillOpacity="0.8" transform={`translate(${xTete} 0) scale(0.87 1) translate(${-xTete} 0)`} style={{ fontFamily: "var(--font-title)", fontSize: 15, fontWeight: 600 }}>
            C
          </text>
        )}
      </g>
    );
  }

  return (
    <g data-layer="couronne">
      {/* Elle dépasse du flanc de trois bons millimètres : l'ombre le dit. */}
      <circle cx={CX + 5} cy={Y_COURONNE + 7} r={r + 2} fill={INK} fillOpacity="0.5" filter={`url(#${uid}-pf-flou)`} />
      <circle cx={CX} cy={Y_COURONNE} r={r} fill={ramp.edge} />
      <circle cx={CX} cy={Y_COURONNE} r={r - 2} fill="none" stroke={`url(#${uid}-pf-tete-couronne)`} strokeWidth="4.4" strokeDasharray={`${n(pas * 0.58)} ${n(pas * 0.42)}`} />
      <circle cx={CX} cy={Y_COURONNE} r={r - 5} fill={`url(#${uid}-pf-tete-couronne)`} stroke={ramp.edge} strokeOpacity="0.75" strokeWidth="1" />
      <circle cx={CX} cy={Y_COURONNE} r={r - 8.5} fill="none" stroke={ramp.hi} strokeOpacity="0.4" strokeWidth="0.8" />
      {signed && (
        <>
          <text x={CX + 0.7} y={Y_COURONNE + 6.4} textAnchor="middle" fill={ramp.hi} fillOpacity="0.6" style={{ fontFamily: "var(--font-title)", fontSize: 16, fontWeight: 600 }}>
            C
          </text>
          <text x={CX} y={Y_COURONNE + 5.6} textAnchor="middle" fill={ramp.edge} fillOpacity="0.8" style={{ fontFamily: "var(--font-title)", fontSize: 16, fontWeight: 600 }}>
            C
          </text>
        </>
      )}
    </g>
  );
}

/**
 * Flanc d'une carrure coussin : plus de cylindre ni de cornes distinctes, mais
 * un seul galet qui va d'une pointe à l'autre et retombe vers le poignet. Le
 * flanc est large et bombé, d'où sa ressemblance avec une carapace.
 */
function CushionFlank({ uid, ramp, grain, mat }: { uid: string; ramp: MetalRamp; grain: string | null; mat: boolean }) {
  const demi = (sx: 1 | -1) => {
    const X = (dx: number) => n(CX + sx * dx);
    return {
      descente: `C ${X(233)} 451 ${X(246)} 478 ${X(249)} 522 Q ${X(251)} 541 ${X(241)} 546 L ${X(226)} 548 C ${X(212)} 531 ${X(190)} 516 ${X(158)} ${Y_FOND}`,
      montee: `C ${X(190)} 516 ${X(212)} 531 ${X(226)} 548 L ${X(241)} 546 Q ${X(251)} 541 ${X(249)} 522 C ${X(246)} 478 ${X(233)} 451 ${X(212)} ${Y_CARRURE}`,
      dos: `M ${X(150)} ${Y_CARRURE + 1.2} H ${X(212)} C ${X(232)} 452 ${X(244.5)} 478 ${X(247.5)} 521`,
    };
  };
  const d = demi(1);
  const g = demi(-1);
  const galet = `M ${CX - 212} ${Y_CARRURE} H ${CX + 212} ${d.descente} H ${CX - 158} ${g.montee} Z`;
  return (
    <g data-layer="boitier">
      <path d={galet} fill={`url(#${uid}-pf-flanc)`} />
      {grain && <path d={galet} fill={grain} />}
      {/* Le galbe : le flanc se dérobe vers le bas, il y perd la lumière. */}
      <path d={galet} fill={`url(#${uid}-pf-dessous)`} opacity="0.55" />
      {/* Chanfrein poli du dessus, d'une pointe à l'autre. */}
      <path d={`${g.dos}`} fill="none" stroke={ramp.hi} strokeOpacity={mat ? 0.45 : 0.95} strokeWidth="3" strokeLinecap="round" />
      <path d={`${d.dos}`} fill="none" stroke={ramp.light} strokeOpacity={mat ? 0.4 : 0.75} strokeWidth="3" strokeLinecap="round" />
      <line x1={CX - 150} y1={Y_CARRURE + 1.2} x2={CX + 150} y2={Y_CARRURE + 1.2} stroke={ramp.hi} strokeOpacity={mat ? 0.4 : 0.85} strokeWidth="2.4" />
      <line x1={CX - 205} y1={Y_CARRURE + 5.8} x2={CX + 205} y2={Y_CARRURE + 5.8} stroke={INK} strokeOpacity="0.25" strokeWidth="0.9" />
      <path d={galet} fill="none" stroke={ramp.edge} strokeOpacity="0.85" strokeWidth="1.4" strokeLinejoin="round" />
      {/* Perçages des barrettes. */}
      {([-1, 1] as const).map((sx) => (
        <g key={sx}>
          <circle cx={CX + sx * 237 + 0.7} cy="532.8" r="3.4" fill={ramp.hi} fillOpacity="0.6" />
          <circle cx={CX + sx * 237} cy="532" r="3.3" fill={INK} fillOpacity="0.85" />
        </g>
      ))}
    </g>
  );
}

/** Poussoir de chronographe, de bout : une bague, un piston poli. */
function PusherProfile({ uid, x, ramp }: { uid: string; x: number; ramp: MetalRamp }) {
  return (
    <g data-layer="poussoir">
      <circle cx={x + 3} cy={Y_COURONNE + 5} r="13" fill={INK} fillOpacity="0.45" filter={`url(#${uid}-pf-flou)`} />
      <circle cx={x} cy={Y_COURONNE} r="12.5" fill={ramp.dark} stroke={ramp.edge} strokeWidth="1" />
      <ellipse cx={x} cy={Y_COURONNE} rx="9.6" ry="10.2" fill={`url(#${uid}-pf-tete-boite)`} stroke={ramp.edge} strokeOpacity="0.7" strokeWidth="0.8" />
    </g>
  );
}

/** Épaulements du protège-couronne, de part et d'autre de la couronne. */
function GuardsProfile({ ramp, at }: { ramp: MetalRamp; at: 3 | 4 }) {
  // À 4 h, les épaulements suivent la couronne vers 6 h et se tassent avec elle.
  const biais = at === 4 ? `translate(${n(CX - HW * 0.5 - 8)} 0) scale(0.87 1) translate(${-CX} 0)` : undefined;
  return (
    <g data-layer="protege-couronne" transform={biais}>
      {([-1, 1] as const).map((sx) => {
        const X = (dx: number) => CX + sx * dx;
        const d = `M ${X(8)} 462 H ${X(28)} Q ${X(40)} 463 ${X(40)} 474 V 488 Q ${X(40)} 499 ${X(28)} 500 H ${X(8)} Z`;
        return (
          <g key={sx}>
            <path d={d} fill={rampAt(ramp, sx === -1 ? 0.78 : 0.46)} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1.2" />
            <path d={`M ${X(10)} 464 H ${X(28)} Q ${X(38)} 465 ${X(38)} 474`} fill="none" stroke={ramp.hi} strokeOpacity={sx === -1 ? 0.9 : 0.55} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

/* ── Bracelet ─────────────────────────────────────────────────────────────── */

interface Pt {
  x: number;
  y: number;
  /** Tangente unitaire. */
  tx: number;
  ty: number;
  /** Abscisse curviligne. */
  s: number;
}

/**
 * Tombé du brin droit, de la barrette vers le poignet. Le brin gauche est son
 * miroir géométrique ; seules les teintes diffèrent, pour ne pas retourner la
 * lumière avec lui.
 */
const DRAPE: ReadonlyArray<readonly [number, number]> = [
  [CX + 237, 532],
  [CX + 276, 552],
  [CX + 292, 640],
  [CX + 266, 900],
];

function drape(): Pt[] {
  const [p0, p1, p2, p3] = DRAPE as [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]];
  const pts: Pt[] = [];
  let s = 0;
  for (let i = 0; i <= 72; i++) {
    const t = i / 72;
    const u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(dx, dy);
    const prev = pts[pts.length - 1];
    if (prev) s += Math.hypot(x - prev.x, y - prev.y);
    pts.push({ x, y, tx: dx / len, ty: dy / len, s });
  }
  return pts;
}

function at(pts: Pt[], s: number): Pt {
  const last = pts[pts.length - 1] as Pt;
  if (s >= last.s) return last;
  const i = Math.max(1, pts.findIndex((p) => p.s >= s));
  const a = pts[i - 1] as Pt;
  const b = pts[i] as Pt;
  const k = (s - a.s) / (b.s - a.s || 1);
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, tx: a.tx + (b.tx - a.tx) * k, ty: a.ty + (b.ty - a.ty) * k, s };
}

/** Ligne décalée de `offset(s)` vers l'extérieur du poignet. */
function rail(pts: Pt[], offset: (s: number) => number): Array<[number, number]> {
  return pts.map((p) => [n(p.x + p.ty * offset(p.s)), n(p.y - p.tx * offset(p.s))]);
}

function poly(points: Array<[number, number]>): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
}

function band(pts: Pt[], outer: (s: number) => number, inner: (s: number) => number): string {
  return `${poly(rail(pts, outer))} ${poly(rail(pts, inner).reverse()).replace("M", "L")} Z`;
}

function StrapProfile({ uid, kind, color, ramp, yBas }: { uid: string; kind: StrapKind; color: string; ramp: MetalRamp; yBas: number }) {
  const pts = drape();
  const steel = kind === "acier-3-maillons" || kind === "acier-jubile";

  return (
    <g data-layer="bracelet">
      {steel && (
        <defs>
          {/* Tranche d'un maillon : chanfrein éclairé côté extérieur, ombre côté peau. */}
          {([
            ["g", 0.98, 0.78, 0.6, 0.3],
            ["d", 0.72, 0.5, 0.36, 0.14],
          ] as const).map(([side, a, b, c, d]) => (
            <linearGradient key={side} id={`${uid}-pf-maillon-${side}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={rampAt(ramp, a)} />
              <stop offset="0.16" stopColor={rampAt(ramp, b)} />
              <stop offset="0.7" stopColor={rampAt(ramp, c)} />
              <stop offset="1" stopColor={rampAt(ramp, d)} />
            </linearGradient>
          ))}
        </defs>
      )}

      {/* Un NATO ne s'arrête pas aux barrettes : il passe sous le fond. */}
      {kind === "nato" && (
        <>
          <path d={`M 263 535 Q 330 ${yBas + 6} 400 ${yBas + 6} H 600 Q 670 ${yBas + 6} 737 535`} fill="none" stroke={shade(color, 0.25)} strokeWidth="14" strokeLinejoin="round" />
          <path d={`M 263 535 Q 330 ${yBas + 6} 400 ${yBas + 6} H 600 Q 670 ${yBas + 6} 737 535`} fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="14" strokeLinejoin="round" />
        </>
      )}

      {([-1, 1] as const).map((sx) => {
        const lit = sx === -1;
        const side = lit ? "g" : "d";
        return (
          <g key={sx} transform={lit ? "translate(1000 0) scale(-1 1)" : undefined}>
            {steel ? (
              <SteelLinks uid={uid} pts={pts} side={side} jubile={kind === "acier-jubile"} ramp={ramp} lit={lit} />
            ) : (
              <Ribbon uid={uid} pts={pts} kind={kind} color={color} lit={lit} />
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Bracelet acier par la tranche : des maillons pleins articulés sur goupilles.
 * Trois-maillons : de longs pavés ; jubilé : des grains courts et ronds.
 */
function SteelLinks({ uid, pts, side, jubile, ramp, lit }: { uid: string; pts: Pt[]; side: "g" | "d"; jubile: boolean; ramp: MetalRamp; lit: boolean }) {
  const pitch = jubile ? 29 : 57;
  const length = jubile ? 28 : 54;
  const thick = (s: number) => (jubile ? 25 : 30) - 5 * Math.min(1, s / 330);
  const total = (pts[pts.length - 1] as Pt).s;
  const count = Math.floor((total - 4) / pitch);
  return (
    <>
      {/* Maillons centraux : on ne les voit que dans les jours entre deux pavés. */}
      <path d={band(pts, (s) => thick(s) / 2 - 5, (s) => -thick(s) / 2 + 4)} fill={rampAt(ramp, lit ? 0.3 : 0.16)} />
      {Array.from({ length: count }, (_, i) => {
        const p = at(pts, 4 + i * pitch + pitch / 2);
        const t = n(thick(p.s));
        const angle = n((Math.atan2(p.ty, p.tx) * 180) / Math.PI);
        return (
          <g key={i} transform={`translate(${n(p.x)} ${n(p.y)}) rotate(${angle})`}>
            <rect x={-length / 2} y={-t / 2} width={length} height={t} rx={jubile ? 11 : 9} fill={`url(#${uid}-pf-maillon-${side})`} stroke={ramp.edge} strokeOpacity="0.8" strokeWidth="1.1" />
            <line x1={-length / 2 + 8} y1={-t / 2 + 2.2} x2={length / 2 - 8} y2={-t / 2 + 2.2} stroke={ramp.hi} strokeOpacity={lit ? 0.95 : 0.5} strokeWidth="1.5" strokeLinecap="round" />
            {!jubile && <circle cx={-length / 2 + 11} cy="1" r="2.6" fill={INK} fillOpacity="0.55" />}
          </g>
        );
      })}
    </>
  );
}

/**
 * Cuir, caoutchouc, NATO : un ruban vu par la tranche. Le cuir montre son
 * rembord et sa doublure, avec la surpiqûre qui affleure ; le caoutchouc ses
 * gorges près des cornes ; le NATO n'est qu'une sangle fine, à passant d'acier.
 */
function Ribbon({ uid, pts, kind, color, lit }: { uid: string; pts: Pt[]; kind: StrapKind; color: string; lit: boolean }) {
  const t0 = kind === "cuir" ? 38 : kind === "caoutchouc" ? 40 : 15;
  const t1 = kind === "cuir" ? 25 : kind === "caoutchouc" ? 29 : 15;
  const thick = (s: number) => t0 + (t1 - t0) * Math.min(1, s / 300);
  const face = lit ? tint(color, kind === "caoutchouc" ? 0.1 : 0.14) : shade(color, 0.16);
  const body = band(pts, (s) => thick(s) / 2, (s) => -thick(s) / 2);
  const start = pts[0] as Pt;
  return (
    <>
      {/* Boucle du brin autour de la barrette. */}
      <circle cx={n(start.x)} cy={n(start.y)} r={t0 / 2} fill={face} />
      <path d={body} fill={face} stroke={shade(color, 0.55)} strokeWidth="1.2" strokeLinejoin="round" />
      {kind === "cuir" && (
        <>
          {/* Doublure, côté peau : plus sombre, séparée par le trait de collage. */}
          <path d={band(pts, (s) => -thick(s) * 0.14, (s) => -thick(s) / 2)} fill={shade(color, lit ? 0.4 : 0.55)} />
          <path d={poly(rail(pts, (s) => thick(s) * 0.26))} fill="none" stroke={tint(color, 0.72)} strokeOpacity={lit ? 0.9 : 0.6} strokeWidth="1.8" strokeDasharray="7 5" strokeLinecap="round" />
        </>
      )}
      {kind === "caoutchouc" &&
        [46, 66, 86, 106, 126].map((s) => {
          const p = at(pts, s);
          const h = thick(s) / 2;
          return <line key={s} x1={n(p.x + p.ty * h)} y1={n(p.y - p.tx * h)} x2={n(p.x + p.ty * h * 0.1)} y2={n(p.y - p.tx * h * 0.1)} stroke={INK} strokeOpacity="0.5" strokeWidth="4" />;
        })}
      {kind === "nato" && (
        <>
          <path d={poly(rail(pts, () => 0))} fill="none" stroke={tint(color, 0.5)} strokeOpacity="0.5" strokeWidth="1.2" strokeDasharray="2 3" />
          {[120, lit ? 196 : 0].filter(Boolean).map((s) => {
            const p = at(pts, s);
            return (
              <rect key={s} x="-5" y="-12" width="10" height="24" rx="4" fill={`url(#${uid}-metal-acier)`} stroke={METALS.acier.edge} strokeWidth="1" transform={`translate(${n(p.x)} ${n(p.y)}) rotate(${n((Math.atan2(p.ty, p.tx) * 180) / Math.PI)})`} />
            );
          })}
        </>
      )}
      {/* Arête extérieure : le seul endroit où un ruban mat accroche la lumière. */}
      <path d={poly(rail(pts, (s) => thick(s) / 2 - 1.4))} fill="none" stroke={PAPER} strokeOpacity={lit ? 0.4 : 0.14} strokeWidth="1.4" />
    </>
  );
}

/** Dégradé horizontal d'un cylindre debout : un arrêt par tranche d'angle. */
function FlankGradient({ id, half, colorAt }: { id: string; half: number; colorAt: (theta: number) => string }) {
  const stops = 19;
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={CX - half} y1="0" x2={CX + half} y2="0">
      {Array.from({ length: stops }, (_, i) => {
        // Arrêts réguliers en angle, donc resserrés vers les bords : c'est la
        // projection d'un cylindre.
        const theta = -90 + (180 * i) / (stops - 1);
        return <stop key={i} offset={n((Math.sin((theta * Math.PI) / 180) + 1) / 2)} stopColor={colorAt(theta)} />;
      })}
    </linearGradient>
  );
}

/** Tête polie d'une petite pièce vue de bout. */
function HeadGradient({ id, ramp }: { id: string; ramp: MetalRamp }) {
  return (
    <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stopColor={ramp.hi} />
      <stop offset="0.3" stopColor={ramp.light} />
      <stop offset="0.52" stopColor={ramp.mid} />
      <stop offset="0.8" stopColor={ramp.dark} />
      <stop offset="1" stopColor={ramp.mid} />
    </linearGradient>
  );
}
