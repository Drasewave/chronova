import { Bezel } from "./parts/bezel";
import { Case, Lugs } from "./parts/case";
import { Crown, CrownGuards } from "./parts/crown";
import { Crystal } from "./parts/crystal";
import { Defs } from "./parts/defs";
import { Dial } from "./parts/dial";
import { Hands } from "./parts/hands";
import { Indices } from "./parts/indices";
import { Strap } from "./parts/strap";
import { Pushers } from "./parts/pushers";
import { ProfileView } from "./parts/profile";
import { BackView } from "./parts/back";
import { DEFAULT_TIME, FRAME_SCALE, SIZE_SCALE } from "./geometry";
import type { WatchRender, WatchView } from "./types";

export interface WatchSvgProps {
  /** Identifiant stable : préfixe tous les `id` internes du SVG. */
  id: string;
  render: WatchRender;
  /** Face, profil ou dos. Les trois partagent le même repère et les mêmes dégradés. */
  view?: WatchView;
  /** `compact` allège la trame (cartes, miniatures du panier et du CRM). */
  detail?: "full" | "compact";
  /** Décalage du reflet, -1 à 1. Piloté par le pointeur dans `InteractiveWatch`. */
  sheen?: { x: number; y: number };
  /**
   * Recadrage en gros plan, dans le repère 1000 × 1000 : « x y largeur hauteur ».
   * Le rendu est vectoriel, donc un détail agrandi reste net — c'est la photo
   * macro du site.
   */
  crop?: string;
  className?: string;
  /** Description lue par les lecteurs d'écran. */
  label: string;
}

/**
 * Rendu d'une montre en calques SVG. Composant sans état ni effet : il peut
 * donc être rendu côté serveur (cartes de collection, e-mails, CRM) comme côté
 * client (configurateur). Changer une option ne remonte jamais l'arbre : seuls
 * des attributs `fill` et `transform` changent.
 */
export function WatchSvg({ id, render, view = "face", detail = "full", sheen, crop, className, label }: WatchSvgProps) {
  const scale = (SIZE_SCALE[render.caseSize] ?? 1) * (view === "profil" ? 1 : FRAME_SCALE);
  const time = render.time ?? DEFAULT_TIME;
  const guards = render.bezelStyle === "plongee";
  const isGmt = render.movement === "NH34";
  const isChrono = render.movement === "VK64";
  const showDate = (render.showDate ?? true) && render.movement !== "NH38" && render.movement !== "VK64";

  return (
    <svg
      viewBox={crop ?? "0 0 1000 1000"}
      preserveAspectRatio={crop ? "xMidYMid slice" : undefined}
      className={className}
      // Un rendu sans intitulé est décoratif — le second coloris d'une carte,
      // par exemple : on le retire de l'arbre d'accessibilité plutôt que de
      // laisser un « image » anonyme dans la liste du lecteur d'écran.
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Defs uid={id} render={render} detail={detail} />

      {/* Ombre portée sous une montre posée à plat. De profil la montre est
          au poignet, en l'air : aucune ombre au sol. */}
      {view === "profil" ? null : (
        <>
          {/* La lumière vient du haut-gauche : la nappe d'ombre glisse en bas à
              droite, l'occlusion de contact reste sous la carrure. */}
          <ellipse cx="518" cy="534" rx={440 * scale} ry={430 * scale} fill={`url(#${id}-shadow)`} />
          <circle cx="506" cy="510" r={392 * scale} fill={`url(#${id}-shadow-contact)`} />
        </>
      )}

      <g transform={`translate(500 500) scale(${scale}) translate(-500 -500)`}>
        {view === "profil" ? (
          <ProfileView uid={id} render={render} />
        ) : view === "dos" ? (
          <>
            <Strap
              uid={id}
              kind={render.strapKind}
              color={render.strapColor}
              metal={render.caseMetal}
              detail={detail}
              frame={500 / scale}
            />
            <Lugs uid={id} metal={render.caseMetal} finish={render.caseFinish} />
            <BackView uid={id} render={render} />
          </>
        ) : (
          <FaceView
            uid={id}
            render={render}
            detail={detail}
            frame={500 / scale}
            sheen={sheen}
            time={time}
            guards={guards}
            isGmt={isGmt}
            isChrono={isChrono}
            showDate={showDate}
          />
        )}
      </g>
    </svg>
  );
}

/** Vue de face : l'empilement complet, du bracelet au reflet du verre. */
function FaceView({
  uid,
  render,
  detail,
  frame,
  sheen,
  time,
  guards,
  isGmt,
  isChrono,
  showDate,
}: {
  uid: string;
  render: WatchRender;
  detail: "full" | "compact";
  frame: number;
  sheen?: { x: number; y: number };
  time: { hours: number; minutes: number; seconds: number };
  guards: boolean;
  isGmt: boolean;
  isChrono: boolean;
  showDate: boolean;
}) {
  const id = uid;
  return (
    <>
        <Strap
          uid={id}
          kind={render.strapKind}
          color={render.strapColor}
          metal={render.caseMetal}
          detail={detail}
          frame={frame}
        />

        <Crown uid={id} style={render.crownStyle} metal={render.crownMetal} />
        {isChrono && <Pushers uid={id} metal={render.caseMetal} />}
        <Case uid={id} metal={render.caseMetal} finish={render.caseFinish} />
        {guards && <CrownGuards uid={id} metal={render.caseMetal} />}

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
        />

        <Dial
          uid={id}
          color={render.dialColor}
          texture={render.dialTexture}
          movement={render.movement}
          showDate={showDate}
          detail={detail}
          subdialColor={render.subdialColor}
        />

        <g filter={`url(#${id}-contact-shadow)`}>
          <Indices
            style={render.indexStyle}
            metal={render.caseMetal}
            dialColor={render.dialColor}
            lume={render.lume}
            outerRadius={isGmt ? 230 : undefined}
            innerRadius={isGmt ? 196 : undefined}
            skipHour={showDate ? 3 : undefined}
          />
        </g>

        <Hands
          uid={id}
          shape={render.handShape}
          metal={render.handMetal}
          lume={render.lume}
          movement={render.movement}
          time={time}
          detail={detail}
        />

        <Crystal uid={id} kind={render.crystal} antiGlare={render.antiGlare} sheen={sheen} />
    </>
  );
}
