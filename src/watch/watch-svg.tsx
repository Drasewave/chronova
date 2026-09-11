import { Bezel } from "./parts/bezel";
import { Case } from "./parts/case";
import { Crown, CrownGuards } from "./parts/crown";
import { Crystal } from "./parts/crystal";
import { Defs } from "./parts/defs";
import { Dial } from "./parts/dial";
import { Hands } from "./parts/hands";
import { Indices } from "./parts/indices";
import { Strap } from "./parts/strap";
import { DEFAULT_TIME, SIZE_SCALE } from "./geometry";
import type { WatchRender } from "./types";

export interface WatchSvgProps {
  /** Identifiant stable : préfixe tous les `id` internes du SVG. */
  id: string;
  render: WatchRender;
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
export function WatchSvg({ id, render, detail = "full", sheen, className, label }: WatchSvgProps) {
  const scale = SIZE_SCALE[render.caseSize] ?? 1;
  const time = render.time ?? DEFAULT_TIME;
  const guards = render.bezelStyle === "plongee";
  const isGmt = render.movement === "NH34";
  const showDate = (render.showDate ?? true) && render.movement !== "NH38";

  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Defs uid={id} render={render} />

      <ellipse cx="500" cy="516" rx="430" ry="418" fill={`url(#${id}-shadow)`} />

      <g transform={`translate(500 500) scale(${scale}) translate(-500 -500)`}>
        <Strap
          uid={id}
          kind={render.strapKind}
          color={render.strapColor}
          metal={render.caseMetal}
          detail={detail}
        />

        <Crown uid={id} style={render.crownStyle} metal={render.crownMetal} />
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
        />

        <Indices
          style={render.indexStyle}
          metal={render.caseMetal}
          dialColor={render.dialColor}
          lume={render.lume}
          outerRadius={isGmt ? 230 : undefined}
          innerRadius={isGmt ? 196 : undefined}
          skipHour={showDate ? 3 : undefined}
        />

        <Hands
          uid={id}
          shape={render.handShape}
          metal={render.handMetal}
          lume={render.lume}
          movement={render.movement}
          time={time}
        />

        <Crystal uid={id} kind={render.crystal} antiGlare sheen={sheen} />
      </g>
    </svg>
  );
}
