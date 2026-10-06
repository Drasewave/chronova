import type { ReactNode } from "react";
import { C, R_BEZEL_IN, R_CASE, R_LUG_TIP, dialScale, n } from "../geometry";
import { dialLayout, heuresPrises } from "../dial-layout";
import { INK, isLight } from "../palette";
import { Bezel } from "../parts/bezel";
import { Dial } from "../parts/dial";
import { Hands, type HandRole } from "../parts/hands";
import { Indices } from "../parts/indices";
import { BackView } from "../parts/back";
import { annulus } from "../parts/conic";
import type { IndexStyle, WatchRender } from "../types";
import type { flankLayout } from "../watch-svg";
import { HAND_LIFT, R_FOND, Z, bandPath, flat, pose, px, quad, wallPath, type Pose } from "./geometry3d";
import { Defs3D } from "./defs3d";
import { BezelBand, CarrureBand, CushionBottom, CushionFlank, CushionTop, FondBand, InnerWall, Lugs3D, Plat, Underside, bezelTop, fondFaces } from "./case3d";
import { Crown3D, Guards3D, Pusher3D, flankDepth } from "./flank-parts3d";
import { STRAP_THICKNESS, Strap3D } from "./strap3d";
import { Crystal3D, LOUPE } from "./crystal3d";

/**
 * Les index en métal rapporté, dont on voit l'épaisseur de biais. Les chiffres
 * laqués (`romains-chapitre`) et manuscrits (`fantaisie`) sont de l'encre : ils
 * restent à plat.
 */
const INDEX_APPLIQUES: ReadonlySet<IndexStyle> = new Set<IndexStyle>([
  "batons",
  "plongee",
  "montagne",
  "romains",
  "arabes-orientaux",
  "arabes-chapitre",
  "sky",
  "diary",
]);

export interface ProjectedViewProps {
  uid: string;
  render: WatchRender;
  detail: "full" | "compact";
  /** Distance du centre au bord du cadre, dans le repère de la montre. */
  frame: number;
  sheen?: { x: number; y: number };
  time: { hours: number; minutes: number; seconds: number };
  flank: ReturnType<typeof flankLayout>;
  isGmt: boolean;
  isChrono: boolean;
  showDate: boolean;
  /** Lacet en degrés autour de l'axe 12 h – 6 h : 0 face, 90 flanc de 3 h, 180 dos, 270 flanc de 9 h. */
  yaw: number;
}

/**
 * Vue projetée : la montre sous n'importe quel lacet.
 *
 * Projection orthographique (`geometry3d.ts`) de l'objet en volume : le
 * boîtier est un empilement de bagues (fond bombé, carrure, lunette) dont on
 * voit la moitié du pourtour qui nous regarde ; le plat de carrure, le cadran,
 * les index, les aiguilles, le verre et le fond sont les dessins de face et de
 * dos existants, chacun posé à son altitude — resserré en cos θ et décalé de
 * z·sin θ, par une seule transformation sur un groupe parent. Les aiguilles
 * gardent donc leur structure (`data-aiguille`, `rotate` sur les groupes
 * internes) et l'horloge vivante continue de les faire battre ; chacune est
 * en plus posée à son étage sur le canon (`HAND_LIFT`, groupe parent), avec
 * une ombre qui s'allonge avec l'angle. Les index sont extrudés : leur
 * silhouette au pied, dans le ton de la facette latérale, puis le dessus. Le
 * cadre du guichet et la loupe montrent leur flanc. Couronnes, poussoirs et
 * protège-couronne sont des volumes triés par profondeur : devant le boîtier
 * quand ils regardent vers nous, derrière sinon. Le bracelet reprend son
 * dessin de face, gagne une tranche, et montre son dessous de dos.
 *
 * Ordre de dessin (du fond vers l'observateur) : ombre au sol (la silhouette
 * réelle, floutée), cornes du côté qui fuit, bracelet, pièces de flanc
 * cachées, bagues du boîtier de la plus lointaine à la plus proche, cornes du
 * côté qui regarde, face visible (cadran ou fond), verre, pièces de flanc devant.
 *
 * Composant pur et déterministe : mêmes props, même SVG, serveur ou client.
 */
export function ProjectedView({ uid, render, detail, frame, sheen, time, flank, isGmt, isChrono, showDate, yaw }: ProjectedViewProps) {
  const p = pose(yaw);
  const id = uid;
  const layout = dialLayout(render.indexStyle);
  const full = detail === "full";
  const coussin = flank.coussin;
  const rehaut = flank.boussole ? "boussole" : render.indexStyle === "plongee" ? "minuterie" : "poli";
  const k = dialScale(render.bezelStyle);
  const kT = k === 1 ? "" : ` translate(${C} ${C}) scale(${k}) translate(${-C} ${-C})`;
  const gmtScale = isGmt && render.bezelStyle !== "gmt";
  const cyclops = Boolean(render.cyclops) && showDate && (render.dateWindow ?? "date") === "date";
  const zLunette = bezelTop(render);

  /* Pièces rapportées sur le flanc, triées par profondeur. */
  const pieces: { depth: number; node: ReactNode }[] = [];
  const dCouronne = flankDepth(p, flank.crownAt);
  if (flank.guards) pieces.push({ depth: dCouronne - 0.5, node: <Guards3D key="garde" uid={id} p={p} detail={detail} metal={render.caseMetal} at={flank.crownAt} /> });
  pieces.push({
    depth: dCouronne,
    node: <Crown3D key="couronne" uid={id} p={p} detail={detail} style={render.crownStyle} metal={render.crownMetal} at={flank.crownAt} offset={flank.offsetAt(flank.crownAt)} />,
  });
  if (flank.secondCrownAt) {
    pieces.push({
      depth: flankDepth(p, flank.secondCrownAt),
      node: <Crown3D key="couronne-2" uid={id} p={p} detail={detail} style="lisse" metal={render.crownMetal} at={flank.secondCrownAt} offset={flank.offsetAt(flank.secondCrownAt)} size={0.8} />,
    });
  }
  if (isChrono) {
    for (const at of [2, 4] as const) pieces.push({ depth: flankDepth(p, at), node: <Pusher3D key={`poussoir-${at}`} uid={id} p={p} detail={detail} metal={render.caseMetal} at={at} /> });
  }
  pieces.sort((a, b) => a.depth - b.depth);
  const derriere = pieces.filter((piece) => piece.depth < 0).map((piece) => piece.node);
  const devant = pieces.filter((piece) => piece.depth >= 0).map((piece) => piece.node);

  /* Étage de chaque aiguille : un glissement de `−lift·sin θ` à l'écran, écrit
     dans le repère du groupe (resserré de `cf`). À plat, aucun étage. */
  const decalages: Partial<Record<HandRole, string>> = {};
  if (p.s !== 0) {
    for (const role of ["gmt", "minute", "seconde"] as const) decalages[role] = `translate(${n((-HAND_LIFT[role] * p.s) / p.cf)} 0)`;
  }

  const bagues = { uid: id, render, p, detail };

  return (
    <g data-view="projection" data-yaw={n(p.theta)}>
      <Defs3D uid={id} render={render} p={p} detail={detail} />
      <OmbreSol uid={id} p={p} frame={frame} coussin={coussin} strapThickness={STRAP_THICKNESS[render.strapKind]} />

      {!coussin && <Lugs3D {...bagues} which="far" />}
      <Strap3D uid={id} kind={render.strapKind} color={render.strapColor} metal={render.caseMetal} detail={detail} frame={frame} p={p} />
      {derriere}

      {p.front ? (
        <>
          <FondBand {...bagues} />
          {coussin ? <CushionFlank {...bagues} /> : <CarrureBand {...bagues} />}
          {!coussin && <Lugs3D {...bagues} which="near" />}
          {coussin ? <CushionTop {...bagues} /> : <Plat {...bagues} />}

          {/* La lunette d'abord, comme de face : son disque de fond porte le cadran. */}
          <g transform={flat(p, zLunette)}>
            <Bezel
              uid={id}
              style={render.bezelStyle}
              metal={render.caseMetal}
              finish={render.caseFinish}
              insertColor={render.insertColor}
              insertColor2={render.insertColor2}
              insertMaterial={render.insertMaterial}
              lume={render.lume}
              detail={detail}
              rIn={n(R_BEZEL_IN * k)}
            />
          </g>

          {/* Sous le verre : cadran, index et aiguilles, chacun à son altitude, vus
              à travers l'ouverture de la lunette — ce qu'elle cache par parallaxe
              reste caché. Le groupe porte un `id` : le verre épais en reprend le
              bord, réfracté. */}
          <clipPath id={`${id}-pj-ouverture`}>
            <circle cx={C} cy={C} r={n(R_BEZEL_IN * k)} transform={flat(p, zLunette)} />
          </clipPath>
          <g id={`${id}-pj-sous-verre`} data-layer="sous-verre" clipPath={`url(#${id}-pj-ouverture)`}>
            <g transform={`${flat(p, Z.cadran)}${kT}`}>
              <Dial
                uid={id}
                color={render.dialColor}
                texture={render.dialTexture}
                movement={render.movement}
                showDate={showDate}
                detail={detail}
                subdialColor={render.subdialColor}
                dateWindow={render.dateWindow}
                rehaut={rehaut}
                gmtScale={gmtScale}
                waterResistM={render.waterResistM}
                metal={render.caseMetal}
                smallSecondsAngle={time.seconds * 6}
                layout={layout}
                frameMetal={layout.cadreDate ? (render.indexMetal ?? render.caseMetal) : undefined}
              />
            </g>
            {showDate && full && p.s !== 0 && <Guichet3D uid={id} p={p} k={k} jourDate={(render.dateWindow ?? "date") === "jour-date"} clair={isLight(render.dialColor)} cyclops={cyclops && full} />}
            <IndexEtage uid={id} p={p} full={full} kT={kT} applique={INDEX_APPLIQUES.has(render.indexStyle)}>
              <Indices
                detail={full ? "full" : "compact"}
                style={render.indexStyle}
                metal={render.indexMetal ?? render.caseMetal}
                dialColor={render.dialColor}
                ink={render.indexInk}
                lume={render.lume}
                outerRadius={flank.boussole ? 227 : gmtScale ? 230 : undefined}
                innerRadius={flank.boussole ? 194 : gmtScale ? 196 : undefined}
                skipHour={heuresPrises(render.movement, showDate)}
              />
            </IndexEtage>
            <g transform={`${flat(p, Z.aiguilles)}${kT}`}>
              <Hands
                uid={id}
                shape={render.handShape}
                metal={render.handMetal}
                lume={render.lume}
                movement={render.movement}
                time={time}
                detail={detail}
                accent={render.accentHandColor}
                vivante={render.time === undefined}
                decalages={p.s !== 0 ? decalages : undefined}
                ombres={p.s !== 0 ? { basse: `${id}-pj-ombre-aiguille-basse`, haute: `${id}-pj-ombre-aiguille-haute` } : undefined}
              />
            </g>
          </g>

          <InnerWall {...bagues} k={k} />
          <BezelBand {...bagues} />
          <Crystal3D uid={id} render={render} p={p} k={k} sheen={sheen} cyclops={cyclops} detail={detail} />
        </>
      ) : (
        <>
          <BezelBand {...bagues} />
          {coussin ? <CushionFlank {...bagues} /> : <CarrureBand {...bagues} />}
          {!coussin && <Lugs3D {...bagues} which="near" />}
          {coussin ? <CushionBottom {...bagues} /> : <Underside {...bagues} />}
          <FondBand {...bagues} />
          <FondFace3D uid={id} render={render} p={p} />
        </>
      )}

      {devant}
    </g>
  );
}

/**
 * Index appliqués, en épaisseur (bâtons, plots de plongée, chiffres et pointes
 * de montagne). Le dessin est défini une fois ; vu de biais,
 * sa silhouette est d'abord posée au pied (`Z.cadran`), teintée comme la
 * facette latérale qui regarde vers nous, puis le dessus à son altitude avec
 * son ombre de contact : entre les deux dépasse le flanc de chaque bloc.
 */
function IndexEtage({ uid, p, full, kT, applique, children }: { uid: string; p: Pose; full: boolean; kT: string; applique: boolean; children: ReactNode }) {
  const ombre = full ? `url(#${uid}-pj-index-shadow)` : undefined;
  // Des chiffres imprimés n'ont pas d'épaisseur : seuls les index appliqués sont extrudés.
  if (!full || !applique || p.s === 0) {
    return (
      <g transform={`${flat(p, Z.index)}${kT}`} filter={ombre}>
        {children}
      </g>
    );
  }
  const id = `${uid}-pj-index`;
  return (
    <>
      <defs>
        <g id={id}>{children}</g>
      </defs>
      <use href={`#${id}`} transform={`${flat(p, Z.cadran + 1)}${kT}`} filter={`url(#${uid}-pj-index-flanc)`} />
      <g transform={`${flat(p, Z.index)}${kT}`} filter={ombre}>
        <use href={`#${id}`} />
      </g>
    </>
  );
}

/**
 * Le guichet en épaisseur : le cadre appliqué a une hauteur (`Z.guichet`), le
 * disque de quantième tourne en retrait sous le cadran (`Z.guichetDisque`).
 * Vu de biais, on voit le flanc extérieur du cadre du côté qui regarde vers
 * nous, et, dans l'ouverture, la paroi intérieure opposée qui mord sur le
 * disque — le quantième est au fond d'un puits. La loupe, elle, porte son
 * ombre sur le cadran, décalée de sa hauteur au-dessus du verre.
 */
function Guichet3D({ uid, p, k, jourDate, clair, cyclops }: { uid: string; p: Pose; k: number; jourDate: boolean; clair: boolean; cyclops: boolean }) {
  // Cotes de `DateWindow` (`parts/dial.tsx`), ramenées à l'échelle du cadran.
  const w = jourDate ? 136 : 68;
  const sx = (x: number) => C + (x - C) * k;
  const x0 = sx(C + 232 - w);
  const x1 = sx(C + 232);
  const y0 = sx(C - 25);
  const y1 = sx(C + 25);
  const nx: 1 | -1 = p.s > 0 ? 1 : -1;
  // Flanc extérieur du cadre : l'arête qui regarde vers nous.
  const flanc = wallPath(p, nx > 0 ? x1 : x0, y0, y1, Z.cadran, Z.guichet, nx);
  // Paroi intérieure opposée, du dessus du cadre jusqu'au disque : elle regarde vers nous aussi.
  const paroi = wallPath(p, nx > 0 ? x0 + 5 * k : x1 - 5 * k, y0 + 5 * k, y1 - 5 * k, Z.guichetDisque, Z.guichet, nx);
  const sombre = INK;
  const loupe = cyclops
    ? quad(
        [px(p, sx(LOUPE.cx - LOUPE.w / 2) + 4, Z.cadran), sx(LOUPE.cy - LOUPE.h / 2) + 6],
        [px(p, sx(LOUPE.cx + LOUPE.w / 2) + 4, Z.cadran), sx(LOUPE.cy - LOUPE.h / 2) + 6],
        [px(p, sx(LOUPE.cx + LOUPE.w / 2) + 4, Z.cadran), sx(LOUPE.cy + LOUPE.h / 2) + 6],
        [px(p, sx(LOUPE.cx - LOUPE.w / 2) + 4, Z.cadran), sx(LOUPE.cy + LOUPE.h / 2) + 6],
      )
    : null;
  return (
    <g data-layer="guichet-3d">
      {loupe && <path d={loupe} fill={sombre} fillOpacity="0.28" filter={`url(#${uid}-soft)`} />}
      {paroi && <path d={paroi} fill={sombre} fillOpacity={clair ? 0.5 : 0.7} />}
      {flanc && <path d={flanc} fill={`url(#${uid}-pj-paroi)`} stroke={sombre} strokeOpacity="0.5" strokeWidth="0.8" strokeLinejoin="round" />}
    </g>
  );
}

/**
 * Le fond, vu de dos : le dessin de dos (`BackView`) est défini une fois puis
 * repris en trois couronnes, chacune posée à l'altitude de son étage sur le
 * bombé (`fondFaces`) — le rebord à encoches près du plan de joint, la
 * couronne gravée un peu plus bas, le médaillon au plus bas. À 180° les trois
 * se superposent exactement : c'est la vue de dos.
 */
function FondFace3D({ uid, render, p }: { uid: string; render: WatchRender; p: Pose }) {
  const id = `${uid}-pj-dos`;
  const faces = fondFaces(render);
  if (p.s === 0) {
    return (
      <g data-layer="fond-face" transform={flat(p, faces[faces.length - 1]![2])} clipPath={`url(#${uid}-pj-clip-fond)`}>
        <clipPath id={`${uid}-pj-clip-fond`}>
          <circle cx={C} cy={C} r={R_FOND + 1} />
        </clipPath>
        <BackView uid={uid} render={render} />
      </g>
    );
  }
  return (
    <g data-layer="fond-face">
      <defs>
        <g id={id}>
          <BackView uid={uid} render={render} />
        </g>
        {faces.map(([rOut, rIn], i) => (
          <clipPath key={i} id={`${uid}-pj-clip-fond-${i}`}>
            {rIn > 0 ? <path d={annulus(rOut, rIn)} clipRule="evenodd" /> : <circle cx={C} cy={C} r={rOut} />}
          </clipPath>
        ))}
      </defs>
      {faces.map(([, , z], i) => (
        <use key={i} href={`#${id}`} clipPath={`url(#${uid}-pj-clip-fond-${i})`} transform={flat(p, z)} />
      ))}
    </g>
  );
}

/**
 * Ombre au sol : la silhouette réelle de l'objet — carrure (l'enveloppe de
 * ses deux faces), cornes et bracelet — décalée vers le bas-droit, la lumière
 * venant du haut-gauche, et floutée deux fois (nappe large, contact serré).
 * De profil elle s'amincit d'elle-même, puisque la silhouette s'amincit.
 */
function OmbreSol({ uid, p, frame, coussin, strapThickness }: { uid: string; p: Pose; frame: number; coussin: boolean; strapThickness: number }) {
  const rCase = coussin ? R_CASE + 40 : R_CASE;
  const xs = (half: number, zs: number[]) => {
    const all = zs.flatMap((z) => [px(p, C - half, z), px(p, C + half, z)]);
    return [Math.min(...all), Math.max(...all)] as const;
  };
  const [bx0, bx1] = xs(176, [Z.bracelet, Z.bracelet - strapThickness]);
  const [lx0, lx1] = xs(coussin ? 236 : 235, [Z.carrure, Z.fond]);
  return (
    <g data-layer="ombre" transform="translate(20 34)" filter={`url(#${uid}-pj-ombre-sol)`} opacity="0.3" fill={INK}>
      <path d={bandPath(p, rCase, Z.carrure, rCase, Z.fond)} />
      <rect x={n(lx0)} y={C - R_LUG_TIP + 10} width={n(Math.max(1, lx1 - lx0))} height={2 * R_LUG_TIP - 20} rx="30" />
      <rect x={n(bx0)} y={n(C - frame + 40)} width={n(Math.max(1, bx1 - bx0))} height={n(2 * frame - 80)} rx="20" />
    </g>
  );
}
