import { Bezel } from "./parts/bezel";
import { Case, Lugs } from "./parts/case";
import { Crown, CrownGuards } from "./parts/crown";
import { Crystal } from "./parts/crystal";
import { Defs } from "./parts/defs";
import { dialLayout, heuresPrises } from "./dial-layout";
import { Dial } from "./parts/dial";
import { Hands } from "./parts/hands";
import { Indices } from "./parts/indices";
import { Strap } from "./parts/strap";
import { Pushers } from "./parts/pushers";
import { ProfileView } from "./parts/profile";
import { BackView } from "./parts/back";
import { cushionRadius } from "./parts/cushion";
import { DEFAULT_TIME, FRAME_SCALE, R_BEZEL_IN, R_CASE, SIZE_SCALE, dialScale, n } from "./geometry";
import { ProjectedView } from "./projection/projected-view";
import type { WatchRender, WatchView } from "./types";

/**
 * Pièces de flanc déduites de la configuration, communes aux vues de face et
 * de dos. Le rendu ne ment jamais sur une option : une couronne à 4 h n'est
 * dessinée que si elle est choisie, la seconde couronne que si le réhaut
 * boussole l'est.
 */
export function flankLayout(render: WatchRender) {
  const coussin = render.caseShape === "coussin";
  const crownAt: 3 | 4 = render.crownAt === 4 ? 4 : 3;
  // Le réhaut boussole cède la place à l'échelle 24 h d'un GMT et aux compteurs
  // d'un chronographe (les règles du catalogue l'interdisent déjà).
  const boussole = render.innerRing === "boussole" && render.movement !== "NH34" && render.movement !== "VK64";
  // Sa couronne se loge à 4 h ; si la couronne de remontage y est déjà, à 2 h.
  const secondCrownAt: 2 | 4 | null = boussole ? (crownAt === 4 ? 2 : 4) : null;
  // Le flanc d'un coussin est plus loin du centre, et il enveloppe la couronne :
  // elle s'y enfonce à demi, ce qui dispense de protège-couronne rapportés.
  const offsetAt = (at: 2 | 3 | 4) => (coussin ? cushionRadius(at * 30) - R_CASE - 9 : 0);
  return {
    coussin,
    crownAt,
    boussole,
    secondCrownAt,
    offsetAt,
    // Épaulements de couronne, venus de matière avec le flanc : ceux d'une
    // plongeuse, et ceux de toute carrure ronde percée à 4 h — c'est la même
    // boîte de sport japonaise, qu'elle porte une lunette de plongée, 24 h ou
    // lisse. Un coussin enveloppe déjà sa couronne ; un chronographe a ses poussoirs.
    guards: !coussin && render.movement !== "VK64" && (render.bezelStyle === "plongee" || crownAt === 4),
  };
}

export interface WatchSvgProps {
  /** Identifiant stable : préfixe tous les `id` internes du SVG. */
  id: string;
  render: WatchRender;
  /** Face, profil ou dos. Les trois partagent le même repère et les mêmes dégradés. */
  view?: WatchView;
  /**
   * Lacet en degrés autour de l'axe 12 h – 6 h : 0 de face, 90 le flanc de
   * 3 h, 180 le dos, 270 le flanc de 9 h. Défini, il remplace `view` par la
   * vue projetée (`projection/`), continue à tout angle — y compris 0, 90, 180
   * et 270, pour que la platine tournante ne change jamais de dessin en route.
   */
  yaw?: number;
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
export function WatchSvg({ id, render, view = "face", detail = "full", sheen, crop, className, label, yaw }: WatchSvgProps) {
  const projete = yaw !== undefined && Number.isFinite(yaw);
  const scale = (SIZE_SCALE[render.caseSize] ?? 1) * (view === "profil" && !projete ? 1 : FRAME_SCALE);
  const time = render.time ?? DEFAULT_TIME;
  const flank = flankLayout(render);
  const isGmt = render.movement === "NH34";
  const isChrono = render.movement === "VK64";
  const showDate = (render.showDate ?? true) && render.movement !== "NH38" && render.movement !== "VK64";

  // De dos, couronne et poussoirs passent à gauche : la montre est retournée.
  const couronneDos = (
    <Crown uid={id} style={render.crownStyle === "oignon" ? "oignon" : "lisse"} metal={render.crownMetal} at={flank.crownAt} offset={flank.offsetAt(flank.crownAt)} mirror />
  );
  const secondeCouronneDos = flank.secondCrownAt ? (
    <Crown uid={id} style="lisse" metal={render.crownMetal} at={flank.secondCrownAt} offset={flank.offsetAt(flank.secondCrownAt)} size={0.8} mirror />
  ) : null;

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
          au poignet, en l'air : aucune ombre au sol. La vue projetée porte la sienne. */}
      {view === "profil" || projete ? null : (
        <>
          {/* La lumière vient du haut-gauche : la nappe d'ombre glisse en bas à
              droite, l'occlusion de contact reste sous la carrure. */}
          <ellipse cx="518" cy="534" rx={(flank.coussin ? 470 : 440) * scale} ry={430 * scale} fill={`url(#${id}-shadow)`} />
          <ellipse cx="506" cy="510" rx={(flank.coussin ? 432 : 392) * scale} ry={(flank.coussin ? 420 : 392) * scale} fill={`url(#${id}-shadow-contact)`} />
        </>
      )}

      <g transform={`translate(500 500) scale(${scale}) translate(-500 -500)`}>
        {projete ? (
          <ProjectedView
            uid={id}
            render={render}
            detail={detail}
            frame={500 / scale}
            sheen={sheen}
            time={time}
            flank={flank}
            isGmt={isGmt}
            isChrono={isChrono}
            showDate={showDate}
            yaw={yaw}
          />
        ) : view === "profil" ? (
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
            {/* De dos, couronne et poussoirs passent à gauche : la montre est retournée. */}
            {(flank.coussin || !flank.guards) && couronneDos}
            {flank.coussin && secondeCouronneDos}
            {isChrono && <Pushers uid={id} metal={render.caseMetal} mirror />}
            {!flank.coussin && <Lugs uid={id} metal={render.caseMetal} finish={render.caseFinish} />}
            {/* Comme de face : à 4 h, la couronne passe devant la racine de la corne. */}
            {!flank.coussin && secondeCouronneDos}
            {!flank.coussin && flank.guards && couronneDos}
            {/* Les épaulements passent sous le fond vissé : seul leur débord se voit. */}
            {flank.guards && <CrownGuards uid={id} metal={render.caseMetal} at={flank.crownAt} mirror />}
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
            flank={flank}
            isGmt={isGmt}
            isChrono={isChrono}
            showDate={showDate}
          />
        )}
      </g>
    </svg>
  );
}

/**
 * Plaque imprimée de la montre 3D : lunette, cadran et index, sans bracelet,
 * boîtier, aiguilles ni verre — la 3D les porte en volume. Même repère
 * 1000 × 1000 que la vue de face, à l'échelle 1 : la texture se plaque en UV
 * planaires sur le disque du cadran et l'anneau de la lunette.
 */
export function PlaqueCadranSvg({ id, render }: { id: string; render: WatchRender }) {
  const flank = flankLayout(render);
  const showDate = (render.showDate ?? true) && render.movement !== "NH38" && render.movement !== "VK64";
  return (
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <Defs uid={id} render={render} detail="full" />
      <FaceView
        uid={id}
        render={render}
        detail="full"
        frame={500}
        time={render.time ?? DEFAULT_TIME}
        flank={flank}
        isGmt={render.movement === "NH34"}
        isChrono={render.movement === "VK64"}
        showDate={showDate}
        plaque
      />
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
  flank,
  isGmt,
  isChrono,
  showDate,
  plaque = false,
}: {
  uid: string;
  render: WatchRender;
  detail: "full" | "compact";
  frame: number;
  sheen?: { x: number; y: number };
  time: { hours: number; minutes: number; seconds: number };
  flank: ReturnType<typeof flankLayout>;
  isGmt: boolean;
  isChrono: boolean;
  showDate: boolean;
  /** Seulement ce qui est imprimé ou appliqué : la plaque de la montre 3D. */
  plaque?: boolean;
}) {
  const id = uid;
  const layout = dialLayout(render.indexStyle);
  // La minuterie d'une plongeuse vit sur son réhaut : elle suit les index de
  // plongée. Le réhaut boussole, lui, est une option à part entière.
  const rehaut = flank.boussole ? "boussole" : render.indexStyle === "plongee" ? "minuterie" : "poli";
  // Une lunette à insert resserre l'ouverture du verre : tout ce qui vit sous le
  // verre est réduit d'un bloc autour du centre.
  const k = dialScale(render.bezelStyle);
  // L'échelle 24 h imprimée ne sert que sans lunette 24 h.
  const gmtScale = isGmt && render.bezelStyle !== "gmt";
  // La loupe ne grossit qu'un quantième seul : sur un jour-date elle n'en couvrirait que la moitié.
  const cyclops = Boolean(render.cyclops) && showDate && (render.dateWindow ?? "date") === "date";
  const couronne = (
    <Crown uid={id} style={render.crownStyle} metal={render.crownMetal} at={flank.crownAt} offset={flank.offsetAt(flank.crownAt)} />
  );
  // Plus menue, jamais signée.
  const secondeCouronne = flank.secondCrownAt ? (
    <Crown uid={id} style="lisse" metal={render.crownMetal} at={flank.secondCrownAt} offset={flank.offsetAt(flank.secondCrownAt)} size={0.8} />
  ) : null;
  return (
    <>
        {!plaque && (
          <>
        <Strap
          uid={id}
          kind={render.strapKind}
          color={render.strapColor}
          metal={render.caseMetal}
          detail={detail}
          frame={frame}
        />

        {/* Sans épaulements, la couronne passe sous le flanc. Avec eux, elle est
            dessinée après le boîtier : à 4 h la corne la masquerait. */}
        {!flank.guards && couronne}
        {/* Couronne du réhaut boussole. Sur un coussin elle s'enfonce dans le
            flanc ; sur une carrure ronde elle passe devant la racine de la corne. */}
        {flank.coussin && secondeCouronne}
        {isChrono && <Pushers uid={id} metal={render.caseMetal} />}
        <Case uid={id} metal={render.caseMetal} finish={render.caseFinish} shape={render.caseShape} />
        {!flank.coussin && secondeCouronne}
        {flank.guards && couronne}
        {flank.guards && <CrownGuards uid={id} metal={render.caseMetal} at={flank.crownAt} />}
          </>
        )}

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

        <g data-layer="sous-verre" transform={k === 1 ? undefined : `translate(500 500) scale(${k}) translate(-500 -500)`}>
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

        <g filter={`url(#${id}-contact-shadow)`}>
          <Indices
            detail={detail}
            style={render.indexStyle}
            metal={render.indexMetal ?? render.caseMetal}
            dialColor={render.dialColor}
            ink={render.indexInk}
            lume={render.lume}
            outerRadius={flank.boussole ? 227 : gmtScale ? 230 : undefined}
            innerRadius={flank.boussole ? 194 : gmtScale ? 196 : undefined}
            skipHour={heuresPrises(render.movement, showDate)}
          />
        </g>

        {!plaque && (
          <>
        <Hands
          uid={id}
          shape={render.handShape}
          metal={render.handMetal}
          lume={render.lume}
          movement={render.movement}
          time={time}
          detail={detail}
          accent={render.accentHandColor}
          // Une heure imposée par le rendu est une pose voulue : l'horloge du site la respecte.
          vivante={render.time === undefined}
        />

        <Crystal uid={id} kind={render.crystal} antiGlare={render.antiGlare} sheen={sheen} cyclops={cyclops} dialColor={render.dialColor} />
          </>
        )}
        </g>
    </>
  );
}
