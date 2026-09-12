"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { SamplePill } from "@/components/ui/pill";
import { OptionGrid } from "./option-grid";
import { StepSection } from "./step-section";
import { WatchStage } from "./watch-stage";
import { buildConfiguration } from "@/lib/configurateur/configuration";
import { evaluateRules, isGroupVisible, normalizeSelections } from "@/lib/configurateur/rules";
import { encodeConfig } from "@/lib/configurateur/url";
import { STEPS } from "@/lib/data/catalogue";
import { excludedOptionsFor, type SampleModel } from "@/lib/data/models";
import type { Selections } from "@/lib/configurateur/types";
import { useCart } from "@/lib/panier/cart";
import { formatPrice } from "@/lib/utils";

export function Configurator({ model, initial }: { model: SampleModel; initial: Selections }) {
  const exclus = useMemo(() => excludedOptionsFor(model), [model]);
  const [selections, setSelections] = useState<Selections>(() => normalizeSelections(initial, exclus));
  const [historique, setHistorique] = useState<Selections[]>([]);
  const [lienCopie, setLienCopie] = useState(false);
  const panier = useCart();

  const configuration = useMemo(() => buildConfiguration(model, selections), [model, selections]);
  const verdicts = useMemo(() => evaluateRules(selections, exclus), [selections, exclus]);

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
      setSelections(normalizeSelections({ ...selections, ...modif }, exclus));
    },
    [selections, exclus],
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
    setSelections(normalizeSelections(model.defaultSelections, exclus));
  }, [model, selections, exclus]);

  const copierLien = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLienCopie(true);
      window.setTimeout(() => setLienCopie(false), 2400);
    } catch {
      // Presse-papiers refusé : l'adresse reste visible et sélectionnable.
    }
  }, []);

  const label = `${model.name}, configuration en cours`;

  return (
    <div className="mx-auto max-w-wide pb-32 lg:pb-0" style={{ paddingInline: "var(--gutter)" }}>
      <nav aria-label="Fil d'Ariane" className="py-5">
        <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
          <li>
            <Link href="/collection" className="link-underline hover:text-accent">
              Collection
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>
            <Link href={`/collection/${model.slug}`} className="link-underline hover:text-accent">
              {model.name}
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li className="text-fg">Composer</li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
        {/* Scène : collée en haut sur mobile, colonne fixe en grand écran. */}
        <div className="sticky top-16 z-20 -mx-[var(--gutter)] border-b border-rule bg-bg px-[var(--gutter)] pb-4 pt-2 md:top-20 lg:top-24 lg:z-0 lg:mx-0 lg:self-start lg:border-0 lg:px-0">
          <WatchStage render={configuration.render} label={label} className="mx-auto w-[min(100%,25rem)]" />

          <div className="mt-5 hidden lg:block">
            <Resume configuration={configuration} model={model} onAjouter={() => panier.add(model.slug, configuration.shareParam)} />
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
          </header>

          <div className="border-t border-rule">
            {STEPS.map((step, index) => (
              <StepSection
                key={step.key}
                index={index + 1}
                label={step.label}
                intro={step.intro}
                defaultOpen={index === 0}
                resume={resumeEtape(step.key, configuration.summary)}
              >
                {step.groups
                  .filter((group) => isGroupVisible(group.key, selections, exclus))
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
            onAjouter={() => panier.add(model.slug, configuration.shareParam)}
          />
        </div>
      </div>

      {/* Barre fixe sur mobile : le prix et l'action restent sous le pouce. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-panel px-[var(--gutter)] py-3 shadow-sheet lg:hidden">
        <div className="flex items-center justify-between gap-4">
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
            onClick={() => panier.add(model.slug, configuration.shareParam)}
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
  configuration: ReturnType<typeof buildConfiguration>;
  model: SampleModel;
  onAjouter: () => void;
}) {
  const [detail, setDetail] = useState(false);

  return (
    <div className="rounded-card border border-rule bg-panel p-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="type-ui text-fg-soft">Total</span>
        <span className="type-title-1 text-fg" data-numeric>
          {formatPrice(configuration.price.totalCents)}
        </span>
      </div>

      <p className="mt-2 flex items-center gap-3">
        <SamplePill />
        <span className="type-caption text-fg-soft">Tarif de démonstration.</span>
      </p>

      <button
        type="button"
        onClick={() => setDetail((v) => !v)}
        aria-expanded={detail}
        className="type-caption link-underline mt-4 text-fg-soft hover:text-accent"
      >
        {detail ? "Masquer le détail" : `Détail des suppléments (${configuration.price.lines.length})`}
      </button>

      {detail && (
        <dl className="mt-4 flex flex-col gap-2 border-t border-rule pt-4">
          <div className="flex justify-between gap-4">
            <dt className="type-caption text-fg-soft">{model.name}, base</dt>
            <dd className="type-caption text-fg" data-numeric>
              {formatPrice(configuration.price.baseCents)}
            </dd>
          </div>
          {configuration.price.lines.map((ligne) => (
            <div key={`${ligne.groupKey}-${ligne.label}`} className="flex justify-between gap-4">
              <dt className="type-caption text-fg-soft">
                {ligne.groupLabel} · {ligne.label}
              </dt>
              <dd className="type-caption text-fg" data-numeric>
                +{formatPrice(ligne.amountCents)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <hr className="my-4 border-rule" />

      <p className="type-mono text-fg-soft">Assemblage estimé · {configuration.leadTime.days} jours</p>
      {configuration.leadTime.reasons.length > 0 && (
        <p className="type-caption mt-2 text-fg-soft">
          Dont{" "}
          {configuration.leadTime.reasons
            .map((raison) => `${raison.days} j pour ${raison.label.toLowerCase()}`)
            .join(", ")}
          .
        </p>
      )}

      <Button className="mt-5 w-full" onClick={onAjouter}>
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
  configuration: ReturnType<typeof buildConfiguration>;
  model: SampleModel;
  onAjouter: () => void;
}) {
  return (
    <section className="mt-14" aria-labelledby="recapitulatif">
      <h2 id="recapitulatif" className="type-title-1">
        Récapitulatif
      </h2>
      <p className="type-body measure mt-3 text-fg-soft">
        Voici la montre telle qu&apos;elle sera montée, pièce par pièce.
      </p>

      <dl className="mt-8 border-t border-rule">
        {configuration.summary.map((ligne) => (
          <div key={ligne.groupKey} className="flex justify-between gap-6 border-b border-rule py-3">
            <dt className="type-caption text-fg-soft">{ligne.groupLabel}</dt>
            <dd className="type-ui text-right text-fg">{ligne.value}</dd>
          </div>
        ))}
      </dl>

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
              {ligne.groupLabel} · {ligne.label}
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
  return (
    <div>
      <label htmlFor="gravure" className="type-ui block text-fg">
        {label}
      </label>
      {help && <p className="type-caption measure mt-1 text-fg-soft">{help}</p>}

      <input
        id="gravure"
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Pour Camille — 12 juin"
        className="type-ui mt-4 h-11 w-full rounded-field border border-rule bg-panel px-4 text-fg placeholder:text-fg-soft"
      />

      <p className="mt-2 flex items-center justify-between gap-4">
        <span className="type-mono text-fg-soft" data-numeric>
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
function resumeEtape(stepKey: string, summary: { stepLabel: string; value: string }[]): string {
  const etape = STEPS.find((step) => step.key === stepKey);
  if (!etape) return "";
  return summary
    .filter((ligne) => ligne.stepLabel === etape.label)
    .map((ligne) => ligne.value)
    .join(" · ");
}
