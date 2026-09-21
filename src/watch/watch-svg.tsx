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
export function WatchSvg({ id, render, view = "face", detail = "full", sheen, className, label }: WatchSvgProps) {
  const scale = (SIZE_SCALE[render.caseSize] ?? 1) * (view === "profil" ? 1 : FRAME_SCALE);
  const time = render.time ?? DEFAULT_TIME;
  const guards = render.bezelStyle === "plongee";
  const isGmt = render.movement === "NH34";
  const isChrono = render.movement === "VK64";
  const showDate = (render.showDate ?? true) && render.movement !== "NH38" && render.movement !== "VK64";

  return (
    <svg
      viewBox="0 0 1000 1000"
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
      <Defs uid={id} render={render} />

      {/* Ombre portée : large sous une montre vue de face, rasante de profil. */}
      {view === "profil" ? (
        <ellipse cx="500" cy="640" rx="330" ry="120" fill={`url(#${id}-shadow)`} />
      ) : (
        <ellipse cx="500" cy="514" rx={430 * scale} ry={418 * scale} fill={`url(#${id}-shadow)`} />
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
          insertColor={render.insertColor}
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

        <g filter={`url(#${id}-hand-shadow)`}>
          <Hands
            uid={id}
            shape={render.handShape}
            metal={render.handMetal}
            lume={render.lume}
            movement={render.movement}
            time={time}
          />
        </g>

        <Crystal uid={id} kind={render.crystal} antiGlare={render.antiGlare} sheen={sheen} />
    </>
  );
}
