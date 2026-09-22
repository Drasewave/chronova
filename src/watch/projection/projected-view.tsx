import type { ReactNode } from "react";
import { C, R_BEZEL_IN, dialScale, n } from "../geometry";
import { Bezel } from "../parts/bezel";
import { Dial } from "../parts/dial";
import { Hands } from "../parts/hands";
import { Indices } from "../parts/indices";
import { BackView } from "../parts/back";
import type { WatchRender } from "../types";
import type { flankLayout } from "../watch-svg";
import { R_FOND, Z, flat, pose } from "./geometry3d";
import { Defs3D } from "./defs3d";
import { BezelBand, CarrureBand, CushionBottom, CushionFlank, CushionTop, FondBand, InnerWall, Lugs3D, Plat, Underside, bezelTop, fondBottom } from "./case3d";
import { Crown3D, Guards3D, Pusher3D, flankDepth } from "./flank-parts3d";
import { Strap3D } from "./strap3d";
import { Crystal3D } from "./crystal3d";

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
 * boîtier est un empilement de bagues (fond, carrure, lunette) dont on voit la
 * moitié du pourtour qui nous regarde ; le plat de carrure, le cadran, les
 * index, les aiguilles, le verre et le fond sont les dessins de face et de dos
 * existants, chacun posé à son altitude — resserré en cos θ et décalé de
 * z·sin θ, par une seule transformation sur un groupe parent. Les aiguilles
 * gardent donc leur structure (`data-aiguille`, `rotate` sur les groupes
 * internes) et l'horloge vivante continue de les faire battre. Couronnes,
 * poussoirs et protège-couronne sont des cylindres couchés, triés par
 * profondeur : devant le boîtier quand ils regardent vers nous, derrière sinon.
 * Le bracelet reprend son dessin de face et gagne une tranche.
 *
 * Ordre de dessin (du fond vers l'observateur) : ombre au sol, cornes du côté
 * qui fuit, bracelet, pièces de flanc cachées, bagues du boîtier de la plus
 * lointaine à la plus proche, cornes du côté qui regarde, face visible (cadran
 * ou fond), verre, pièces de flanc devant.
 *
 * Composant pur et déterministe : mêmes props, même SVG, serveur ou client.
 */
export function ProjectedView({ uid, render, detail, frame, sheen, time, flank, isGmt, isChrono, showDate, yaw }: ProjectedViewProps) {
  const p = pose(yaw);
  const id = uid;
  const full = detail === "full";
  const coussin = flank.coussin;
  const rehaut = flank.boussole ? "boussole" : render.indexStyle === "plongee" ? "minuterie" : "poli";
  const k = dialScale(render.bezelStyle);
  const kT = k === 1 ? "" : ` translate(${C} ${C}) scale(${k}) translate(${-C} ${-C})`;
  const gmtScale = isGmt && render.bezelStyle !== "gmt";
  const cyclops = Boolean(render.cyclops) && showDate && (render.dateWindow ?? "date") === "date";
  const zLunette = bezelTop(render);
  const zFondBas = fondBottom(render);

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

  /* Ombre au sol : elle suit la silhouette, large de face, mince par la tranche. */
  const largeur = Math.min(1, Math.abs(p.c) + 0.3 * Math.abs(p.s));
  const ombre = (
    <g data-layer="ombre">
      <ellipse cx={n(520 - 10 * p.s)} cy="538" rx={n((coussin ? 470 : 440) * largeur)} ry="430" fill={`url(#${id}-shadow)`} opacity={n(1 - 0.55 * Math.abs(p.s))} />
      <ellipse cx={n(507 - 6 * p.s)} cy="511" rx={n((coussin ? 432 : 392) * largeur)} ry={coussin ? 420 : 392} fill={`url(#${id}-shadow-contact)`} opacity={n(1 - 0.75 * Math.abs(p.s))} />
    </g>
  );

  const bagues = { uid: id, render, p, detail };

  return (
    <g data-view="projection" data-yaw={n(p.theta)}>
      <Defs3D uid={id} render={render} p={p} detail={detail} />
      {ombre}

      {!coussin && <Lugs3D {...bagues} which="far" />}
      <Strap3D uid={id} kind={render.strapKind} color={render.strapColor} metal={render.caseMetal} detail={detail} frame={frame} p={p} />
      {derriere}

      {p.front ? (
        <>
          {full && <FondBand {...bagues} />}
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
              reste caché. */}
          <clipPath id={`${id}-pj-ouverture`}>
            <circle cx={C} cy={C} r={n(R_BEZEL_IN * k)} transform={flat(p, zLunette)} />
          </clipPath>
          <g data-layer="sous-verre" clipPath={`url(#${id}-pj-ouverture)`}>
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
                compactSignature={render.indexStyle === "terrain-24h"}
              />
            </g>
            <g transform={`${flat(p, Z.index)}${kT}`} filter={full ? `url(#${id}-pj-index-shadow)` : undefined}>
              <Indices
                detail={full ? "full" : "compact"}
                style={render.indexStyle}
                metal={render.indexMetal ?? render.caseMetal}
                dialColor={render.dialColor}
                lume={render.lume}
                outerRadius={flank.boussole ? 227 : gmtScale ? 230 : undefined}
                innerRadius={flank.boussole ? 194 : gmtScale ? 196 : undefined}
                skipHour={showDate ? 3 : undefined}
              />
            </g>
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
              />
            </g>
          </g>

          {full && <InnerWall {...bagues} k={k} />}
          <BezelBand {...bagues} />
          <Crystal3D uid={id} render={render} p={p} k={k} sheen={sheen} cyclops={cyclops} detail={detail} />
        </>
      ) : (
        <>
          <BezelBand {...bagues} />
          {coussin ? <CushionFlank {...bagues} /> : <CarrureBand {...bagues} />}
          {!coussin && <Lugs3D {...bagues} which="near" />}
          {coussin ? <CushionBottom {...bagues} /> : <Underside {...bagues} />}
          {full && <FondBand {...bagues} />}
          {/* Fond vissé : le dessin de dos, limité au fond lui-même — carrure et cornes sont déjà en volume. */}
          <g transform={flat(p, zFondBas)} clipPath={`url(#${id}-pj-clip-fond)`}>
            <clipPath id={`${id}-pj-clip-fond`}>
              <circle cx={C} cy={C} r={R_FOND + 1} />
            </clipPath>
            <BackView uid={id} render={render} />
          </g>
        </>
      )}

      {devant}
    </g>
  );
}
