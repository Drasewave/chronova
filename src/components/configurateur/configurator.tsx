"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { SamplePill } from "@/components/ui/pill";
import { OptionGrid } from "./option-grid";
import { StepSection } from "./step-section";
import { WatchStage } from "./watch-stage";
import { buildConfiguration, grouperParEtape, type Configuration } from "@/lib/configurateur/configuration";
import { evaluateRules, isGroupVisible, normalizeSelections } from "@/lib/configurateur/rules";
import { encodeConfig } from "@/lib/configurateur/url";
import { excludedOptionsFor, type WatchModelView } from "@/lib/data/models";
import type { CataloguePublic } from "@/lib/configurateur/catalogue";
import type { Selections } from "@/lib/configurateur/types";
import { useCart } from "@/lib/panier/cart";
import { cn, formatPrice } from "@/lib/utils";

/**
 * Grand écran : deux dispositions, selon la HAUTEUR de la fenêtre.
 *
 * — fenêtre haute (≥ 56rem) : le panneau de prix tient sous la montre, dans la
 *   colonne collante ; pas de barre en bas ;
 * — fenêtre basse (portable 768 px, 900 px…) : la colonne ne porte que la montre,
 *   le prix et l'action passent dans la barre fixe du bas, comme sur mobile.
 *
 * Dans les deux cas la largeur de la montre (son cadre est carré) est bornée par
 * la hauteur restante : en-tête 6rem + sélecteur de vue et marges 6,5rem, puis
 * soit la barre et sa marge (5,5rem), soit le panneau de prix dans son cas le
 * plus haut (délais détaillés sur deux lignes) et sa marge.
 * Les classes sont écrites en entier : Tailwind ne voit pas les chaînes composées.
 */
const GRAND_ECRAN = {
  montre:
    "lg:w-[min(100%,36rem,calc(100dvh_-_18rem))] lg:[@media(min-height:56rem)]:w-[min(100%,36rem,calc(100dvh_-_30rem))]",
  panneau: "lg:[@media(min-height:56rem)]:block",
  barre: "lg:[@media(min-height:56rem)]:hidden",
  sansBarre: "lg:[@media(min-height:56rem)]:pb-0",
};

export function Configurator({
  catalogue,
  model,
  initial,
}: {
  catalogue: CataloguePublic;
  model: WatchModelView;
  initial: Selections;
}) {
  const exclus = useMemo(() => excludedOptionsFor(model), [model]);
  const [selections, setSelections] = useState<Selections>(() =>
    normalizeSelections(catalogue, initial, exclus),
  );
  const [historique, setHistorique] = useState<Selections[]>([]);
  const [lienCopie, setLienCopie] = useState(false);
  const panier = useCart();

  const configuration = useMemo(
    () => buildConfiguration(catalogue, model, selections),
    [catalogue, model, selections],
  );
  const verdicts = useMemo(
    () => evaluateRules(catalogue, selections, exclus),
    [catalogue, selections, exclus],
  );

  /**
   * La configuration vit dans l'adresse de la page. `replaceState` plutôt que le
   * routeur : aucun aller-retour serveur, aucune entrée d'historique parasite —
   * le bouton « page précédente » du navigateur reste utilisable normalement.
   */
  useEffect(() => {
    const url = `${window.location.pathname}?c=${configuration.shareParam}`;
    window.history.replaceState(null, "", url);
  }, [configuration.shareParam]);

  const appliquer = useCallback(
    (modif: Selections) => {
      setHistorique((pile) => [...pile.slice(-24), selections]);
      setSelections(normalizeSelections(catalogue, { ...selections, ...modif }, exclus));
    },
    [catalogue, selections, exclus],
  );

  const choisir = useCallback(
    (groupKey: string, optionKey: string) => appliquer({ [groupKey]: optionKey }),
    [appliquer],
  );

  const annuler = useCallback(() => {
    setHistorique((pile) => {
      const precedent = pile[pile.length - 1];
      if (precedent) setSelections(precedent);
      return pile.slice(0, -1);
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setHistorique((pile) => [...pile.slice(-24), selections]);
    setSelections(normalizeSelections(catalogue, model.defaultSelections, exclus));
  }, [catalogue, model, selections, exclus]);

  const champLien = useRef<HTMLInputElement>(null);
  const [lienManuel, setLienManuel] = useState(false);

  /** `navigator.clipboard` n'existe qu'en contexte sécurisé : sinon, le champ du lien est sélectionné pour un copier-coller. */
  const copierLien = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLienManuel(false);
      setLienCopie(true);
      window.setTimeout(() => setLienCopie(false), 2400);
    } catch {
      setLienManuel(true);
      requestAnimationFrame(() => {
        champLien.current?.focus();
        champLien.current?.select();
        // Repli ancien navigateur : copie la sélection si le droit existe.
        try {
          if (document.execCommand("copy")) {
            setLienManuel(false);
            setLienCopie(true);
            window.setTimeout(() => setLienCopie(false), 2400);
          }
        } catch {
          // Le champ reste sélectionné : copie manuelle.
        }
      });
    }
  }, []);

  const label = `${model.name}, configuration en cours`;

  /** Le panier reçoit un instantané : il n'a pas besoin du catalogue pour vivre. */
  const ajouterAuPanier = useCallback(() => {
    panier.add(model.slug, configuration.shareParam, {
      modelName: model.name,
      summary: configuration.summary,
      priceCents: configuration.price.totalCents,
      leadTimeDays: configuration.leadTime.days,
      render: configuration.render,
    });
  }, [panier, model, configuration]);

  return (
    <div className={cn("mx-auto max-w-wide pb-32", GRAND_ECRAN.sansBarre)} style={{ paddingInline: "var(--gutter)" }}>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Total {formatPrice(configuration.price.totalCents)}, assemblage {configuration.leadTime.days} jours.
      </p>
      <nav aria-label="Fil d'Ariane" className="py-5">
        <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
          <li>
            <Link href="/collection" className="link-underline hover:text-accent-ink">
              Collection
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>
            <Link href={`/collection/${model.slug}`} className="link-underline hover:text-accent-ink">
              {model.name}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li className="text-fg">Composer</li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,30rem)] lg:gap-14">
        {/* Scène : collée en haut sur mobile, colonne fixe en grand écran.

            Une zone collante plus haute que la fenêtre ne peut pas rester calée :
            son bas (le prix, « Ajouter au panier ») restait hors champ pendant tout
            le défilement, puis la colonne décrochait d'un bloc en fin de page. La
            montre se borne donc à la hauteur disponible (`100dvh` moins ce qui
            l'entoure), et le panneau de prix ne rejoint la colonne que si la
            fenêtre est assez haute ; sinon la barre du bas prend le relais.

            Téléphone à l'horizontale : en-tête + montre collée + barre ne
            laissaient qu'une fente aux options. La scène n'y est plus collante. */}
        <div
          data-scene-collante
          className="sticky top-16 z-20 -mx-[var(--gutter)] border-b border-rule bg-bg px-[var(--gutter)] pb-4 pt-2 md:top-20 lg:top-24 lg:z-0 lg:mx-0 lg:self-start lg:border-0 lg:px-0 [@media(max-height:34rem)]:static"
        >
          <WatchStage
            render={configuration.render}
            label={label}
            className={cn("mx-auto w-[min(100%,25rem)]", GRAND_ECRAN.montre)}
          />

          <div className={cn("mt-5 hidden", GRAND_ECRAN.panneau)}>
            <Resume configuration={configuration} model={model} onAjouter={() => ajouterAuPanier()} />
          </div>
        </div>

        <div className="pt-8 lg:pt-0">
          <header className="pb-6">
            <h1 className="type-display-2">{model.name}</h1>
            <p className="type-body measure mt-4 text-fg-soft">{model.summary}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button variant="discret" onClick={annuler} disabled={historique.length === 0}>
                Annuler le dernier choix
              </Button>
              <Button variant="discret" onClick={reinitialiser}>
                Réinitialiser
              </Button>
              <Button variant="discret" onClick={copierLien}>
                {lienCopie ? "Lien copié" : "Copier le lien de la configuration"}
              </Button>
            </div>
            {lienManuel && (
              <input
                ref={champLien}
                readOnly
                aria-label="Adresse de la configuration"
                value={typeof window === "undefined" ? "" : window.location.href}
                onFocus={(event) => event.currentTarget.select()}
                className="champ mt-3 h-11 w-full rounded-field border border-rule bg-panel px-4 text-fg"
              />
            )}
            <p className="sr-only" role="status" aria-live="polite">
              {lienCopie ? "Lien copié" : lienManuel ? "Copiez l'adresse affichée ci-dessous" : ""}
            </p>
          </header>

          <div className="border-t border-rule">
            {catalogue.steps.map((step, index) => (
              <StepSection
                key={step.key}
                index={index + 1}
                label={step.label}
                intro={step.intro}
                defaultOpen={index === 0}
                resume={resumeEtape(catalogue, step.key, configuration.summary)}
              >
                {step.groups
                  .filter((group) => isGroupVisible(catalogue, group.key, selections, exclus))
                  .map((group) =>
                    group.selection === "texte" ? (
                      <GravureField
                        key={group.key}
                        label={group.label}
                        help={group.help}
                        maxLength={group.maxLength ?? 30}
                        value={selections[group.key] ?? ""}
                        priceCents={group.filledPriceCents ?? 0}
                        onChange={(valeur) => appliquer({ [group.key]: valeur })}
                      />
                    ) : (
                      <OptionGrid
                        key={group.key}
                        group={{
                          ...group,
                          options: group.options.filter((option) => !exclus.has(`${group.key}:${option.key}`)),
                        }}
                        value={selections[group.key]}
                        verdicts={verdicts}
                        onChange={choisir}
                        footnote={
                          group.options.some((option) => exclus.has(`${group.key}:${option.key}`))
                            ? "Les autres diamètres existent sur d'autres modèles de la collection."
                            : undefined
                        }
                      />
                    ),
                  )}
              </StepSection>
            ))}
          </div>

          <Recapitulatif
            configuration={configuration}
            model={model}
            onAjouter={() => ajouterAuPanier()}
          />
        </div>
      </div>

      {/* Barre fixe (mobile, et grand écran trop bas pour le panneau de prix) :
          le prix et l'action restent sous le pouce. */}
      <div data-barre-prix className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel py-3", GRAND_ECRAN.barre)}>
        {/* Alignée sur la page : sur grand écran bas, la barre sert aussi. */}
        <div className="mx-auto flex max-w-wide items-center justify-between gap-4 px-[var(--gutter)]">
          <div className="min-w-0">
            <p className="type-title-2 whitespace-nowrap text-fg" data-numeric>
              {formatPrice(configuration.price.totalCents)}
            </p>
            <p className="type-mono whitespace-nowrap text-fg-soft">
              {configuration.leadTime.days} jours d&apos;atelier
            </p>
          </div>
          <Button
            className="shrink-0 whitespace-nowrap"
            onClick={() => ajouterAuPanier()}
          >
            Ajouter au panier
          </Button>
        </div>
      </div>
    </div>
  );
}

function Resume({
  configuration,
  model,
  onAjouter,
}: {
  configuration: Configuration;
  model: WatchModelView;
  onAjouter: () => void;
}) {
  const [detail, setDetail] = useState(false);

  return (
    <div className="relative rounded-card border border-rule bg-panel px-5 py-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-ui text-fg-soft">Total</span>
        <span className="type-title-1 text-fg" data-numeric>
          {formatPrice(configuration.price.totalCents)}
        </span>
      </div>

      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <SamplePill />
        <span className="type-caption text-fg-soft">Tarif de démonstration.</span>
        <button
          type="button"
          onClick={() => setDetail((v) => !v)}
          aria-expanded={detail}
          className="type-caption link-underline ml-auto text-fg-soft hover:text-accent-ink"
        >
          {detail ? "Masquer le détail" : `Détail des suppléments (${configuration.price.lines.length})`}
        </button>
      </p>

      {/* En surimpression, au-dessus du panneau : la colonne collante garde sa
          hauteur, donc reste entière dans la fenêtre. Long, le détail défile
          dans son propre cadre. */}
      {detail && (
        <dl
          data-defilement-natif
          className="absolute inset-x-0 bottom-full z-10 mb-2 flex max-h-[min(22rem,50dvh)] flex-col gap-2 overflow-y-auto overscroll-contain rounded-card border border-rule bg-panel p-5 shadow-lift"
        >
          <div className="flex justify-between gap-4">
            <dt className="type-caption text-fg-soft">{model.name}, base</dt>
            <dd className="type-caption text-fg" data-numeric>
              {formatPrice(configuration.price.baseCents)}
            </dd>
          </div>
          {configuration.price.lines.map((ligne) => (
            <div key={`${ligne.groupKey}-${ligne.label}`} className="flex justify-between gap-4">
              <dt className="type-caption text-fg-soft">
                {ligne.stepLabel}, {ligne.groupLabel.toLowerCase()} · {ligne.label}
              </dt>
              <dd className="type-caption text-fg" data-numeric>
                +{formatPrice(ligne.amountCents)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <hr className="my-3 border-rule" />

      <p className="type-mono text-fg-soft">Assemblage estimé · {configuration.leadTime.days} jours</p>
      {configuration.leadTime.reasons.length > 0 && (
        <p className="type-caption mt-1 line-clamp-2 text-fg-soft">
          {configuration.leadTime.reasons
            .map((raison) =>
              `${raison.groupLabel === raison.label ? raison.label : `${raison.groupLabel} ${raison.label}`} : +${raison.days} j`,
            )
            .join(" · ")}
        </p>
      )}

      <Button className="mt-4 w-full" onClick={onAjouter}>
        Ajouter au panier
      </Button>
    </div>
  );
}

function Recapitulatif({
  configuration,
  model,
  onAjouter,
}: {
  configuration: Configuration;
  model: WatchModelView;
  onAjouter: () => void;
}) {
  return (
    <section className="mt-14" aria-labelledby="recapitulatif">
      <h2 id="recapitulatif" className="type-title-1">
        Récapitulatif
      </h2>
      <p className="type-body measure mt-3 text-fg-soft">
        Vérifiez chaque pièce : je monterai la montre telle qu&apos;elle est décrite ici.
      </p>

      {/* Groupé par étape : hors de la sienne, « Forme » ou « Teinte » ne veut
          rien dire — celle des aiguilles ou celle du verre ? */}
      <div className="mt-8">
        {grouperParEtape(configuration.summary).map(([etape, lignes]) => (
          <section key={etape} className="mt-8 first:mt-0">
            <h3 className="type-mono border-b border-accent-decor pb-2 text-fg-soft">{etape}</h3>
            <dl>
              {lignes.map((ligne) => (
                <div
                  key={ligne.groupKey}
                  className="flex justify-between gap-6 border-b border-rule py-3"
                >
                  <dt className="type-caption text-fg-soft">{ligne.groupLabel}</dt>
                  <dd className="type-ui text-right text-fg">{ligne.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-card border border-rule bg-panel p-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="type-ui text-fg-soft">{model.name}, base</span>
          <span className="type-ui text-fg" data-numeric>
            {formatPrice(configuration.price.baseCents)}
          </span>
        </div>
        {configuration.price.lines.map((ligne) => (
          <div key={`${ligne.groupKey}-${ligne.label}`} className="mt-2 flex justify-between gap-4">
            <span className="type-caption text-fg-soft">
              {ligne.stepLabel}, {ligne.groupLabel.toLowerCase()} · {ligne.label}
            </span>
            <span className="type-caption text-fg" data-numeric>
              +{formatPrice(ligne.amountCents)}
            </span>
          </div>
        ))}
        <hr className="my-4 border-rule" />
        <div className="flex items-baseline justify-between gap-4">
          <span className="type-title-2 text-fg">Total</span>
          <span className="type-title-1 text-fg" data-numeric>
            {formatPrice(configuration.price.totalCents)}
          </span>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-3">
          <SamplePill />
          <span className="type-caption text-fg-soft">
            Assemblage estimé : {configuration.leadTime.days} jours après réception des pièces.
          </span>
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <Button onClick={onAjouter}>Ajouter au panier</Button>
          <ButtonLink href="/sur-mesure" variant="discret">
            Demander une pièce unique
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function GravureField({
  label,
  help,
  maxLength,
  value,
  priceCents,
  onChange,
}: {
  label: string;
  help?: string;
  maxLength: number;
  value: string;
  priceCents: number;
  onChange: (valeur: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="type-ui block text-fg">
        {label}
      </label>
      {help && <p className="type-caption measure mt-1 text-fg-soft">{help}</p>}

      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        aria-describedby={`${id}-compteur`}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pour Camille, 12 juin"
        className="champ mt-4 h-11 w-full rounded-field border border-rule bg-panel px-4 text-fg placeholder:text-fg-soft"
      />

      <p className="mt-2 flex items-center justify-between gap-4">
        <span id={`${id}-compteur`} className="type-mono text-fg-soft" data-numeric>
          {value.length} / {maxLength}
        </span>
        {value.trim() && priceCents > 0 && (
          <span className="type-mono text-fg-soft" data-numeric>
            +{formatPrice(priceCents)}
          </span>
        )}
      </p>
      <p className="type-caption mt-2 text-fg-soft">
        L&apos;aperçu apparaît sur la vue de dos, au-dessus.
      </p>
    </div>
  );
}

/** Résumé d'une étape repliée : les libellés de ses propres groupes. */
function resumeEtape(
  catalogue: CataloguePublic,
  stepKey: string,
  summary: { stepLabel: string; value: string }[],
): string {
  const etape = catalogue.steps.find((step) => step.key === stepKey);
  if (!etape) return "";
  return summary
    .filter((ligne) => ligne.stepLabel === etape.label)
    .map((ligne) => ligne.value)
    .join(" · ");
}
